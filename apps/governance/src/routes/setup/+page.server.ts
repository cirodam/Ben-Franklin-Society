import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import type { Actions, PageServerLoad } from './$types.js';
import { createPerson, getPersonByHandle } from '$lib/server/organization/people.js';
import { getAssociationByHandle, setSortitionConfig, assignRole } from '$lib/server/organization/associations.js';
import { createVoteRule } from '$lib/server/governance/vote-rules.js';
import { createDeliberationRule } from '$lib/server/governance/deliberation-rules.js';
import { ALL_PERMISSIONS } from '$lib/server/infrastructure/permissions.js';
import { setInitialCommunityConfig } from '$lib/server/infrastructure/config.js';
import { db } from '$lib/server/db.js';
import { env } from '$env/dynamic/private';
import { coreAssociations } from '../../../scripts/seed-data/core-associations.js';
import { services } from '../../../scripts/seed-data/services.js';
import { colleges } from '../../../scripts/seed-data/colleges.js';
import { committees } from '../../../scripts/seed-data/committees.js';
import { seedAssociations } from '../../../scripts/seeders/seed-associations.js';
import { seedServices } from '../../../scripts/seeders/seed-services.js';
import { seedColleges } from '../../../scripts/seeders/seed-colleges.js';
import { seedCommittees } from '../../../scripts/seeders/seed-committees.js';
import { seedAdminRoles } from '../../../scripts/seeders/seed-roles.js';
import { generateIdentityKeypair, initializeIdentity } from '$lib/server/federation/lineage/identity.js';
import { issueInitialFranks } from '$lib/server/central-bank/issuance.js';
import { queueCreateAccountCommand } from '$lib/server/central-bank/outbox.js';

export const load: PageServerLoad = async () => {
	const existing = db.prepare('SELECT 1 FROM person LIMIT 1').get();
	if (existing) redirect(302, '/login');
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const societyName = data.get('society_name');
		const societyLocation = data.get('society_location');
		const societyHandle = data.get('society_handle');
		const rawHandle   = data.get('handle');
		const givenName   = data.get('given_name');
		const familyName  = data.get('family_name');
		const dob         = data.get('date_of_birth');
		const password    = data.get('password');
		const confirm     = data.get('confirm_password');

		if (
			typeof societyName !== 'string' || !societyName ||
			typeof societyLocation !== 'string' || !societyLocation ||
			typeof societyHandle !== 'string' || !societyHandle ||
			typeof rawHandle !== 'string' || !rawHandle ||
			typeof givenName !== 'string' || !givenName ||
			typeof familyName !== 'string' || !familyName ||
			typeof dob !== 'string' || !dob ||
			typeof password !== 'string' || !password ||
			typeof confirm !== 'string'
		) {
			return fail(400, { error: 'All fields are required.' });
		}

		const handle = rawHandle.toLowerCase().trim();
		const societyHandleClean = societyHandle.toLowerCase().trim();

		if (password !== confirm) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		if (!/^[a-z0-9-]{2,32}$/.test(societyHandleClean)) {
			return fail(400, { error: 'Society handle must be 2–32 lowercase letters, numbers, or hyphens.' });
		}

		if (password.length < 12) {
			return fail(400, { error: 'Password must be at least 12 characters.' });
		}

		if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
			return fail(400, { error: 'Date of birth must be in YYYY-MM-DD format.' });
		}

		if (!/^[a-z0-9_-]{2,32}$/.test(handle)) {
			return fail(400, { error: 'Handle must be 2–32 lowercase letters, numbers, hyphens, or underscores.' });
		}

		if (getPersonByHandle(handle)) {
			return fail(400, { error: 'That handle is already taken.' });
		}

		const person = await createPerson({ handle, given_name: givenName, family_name: familyName, date_of_birth: dob, initial_password: password });

		// Generate society identity (Ed25519 keypair)
		console.log('\n🔐 Generating society identity...');
		const { publicKey, privateKey } = generateIdentityKeypair();
		// Note: privateKey should be encrypted with a master key in production
		// For now, we'll base64 encode it (TODO: implement proper encryption)
		const privateKeyEncoded = Buffer.from(privateKey).toString('base64');
		initializeIdentity({
			handle: societyHandleClean,
			privateKeyEncrypted: privateKeyEncoded,
			publicKey: publicKey
			// No parent or founding record for root society
		});
		console.log(`✅ Society identity initialized: ${societyHandleClean}`);

		// Save community configuration with sensible defaults
		setInitialCommunityConfig('society_name', societyName, 'The full name of this local society');
		setInitialCommunityConfig('society_location', societyLocation, 'Short location name for display');
		setInitialCommunityConfig('dues_rate_monthly', '100', 'Monthly membership dues in Franks');
		setInitialCommunityConfig('demurrage_rate', '0.02', 'Demurrage rate as a decimal fraction (0.02 = 2% per month)');
		setInitialCommunityConfig('demurrage_threshold', '5000', 'Balance above which demurrage applies, in Franks');
		setInitialCommunityConfig('demurrage_type', 'recirculation', 'Where demurrage goes: recirculation (Treasury) or contraction (Central Bank)');
		setInitialCommunityConfig('demurrage_schedule', '0 6 1 * *', 'Cron expression for demurrage runs (1st of month at 6am)');
		setInitialCommunityConfig('birthday_issuance_amount', '2000', 'Franks issued per member per birthday');
		setInitialCommunityConfig('society_latitude', '0.0', 'Decimal latitude of the society\'s primary location');
		setInitialCommunityConfig('society_longitude', '0.0', 'Decimal longitude of the society\'s primary location');
		setInitialCommunityConfig('federation_radius_km', '50', 'Default radius in kilometers for browsing neighboring societies');

		// Service URLs for inter-app communication
		if (env.BANK_URL) {
			setInitialCommunityConfig('bank_url', env.BANK_URL, 'URL of the community bank service');
		}
		if (env.MAIL_URL) {
			setInitialCommunityConfig('mail_url', env.MAIL_URL, 'URL of the mail service');
		}
		if (env.MARKETPLACE_URL) {
			setInitialCommunityConfig('marketplace_url', env.MARKETPLACE_URL, 'URL of the marketplace service');
		}
		if (env.LIBRARY_URL) {
			setInitialCommunityConfig('library_url', env.LIBRARY_URL, 'URL of the library service');
		}

		// Seed core system associations using modular seeders
		console.log('\n🌱 Seeding system associations...');
		seedAssociations(coreAssociations, person.uuid, { skipIfExists: false });

		// Queue bank account creation for all seeded associations
		console.log('\n💰 Queueing bank account creation for system associations...');
		const associationsNeedingAccounts = ['society', 'general-assembly', 'treasury', 'social-insurance'];
		for (const handle of associationsNeedingAccounts) {
			const assoc = getAssociationByHandle(handle);
			if (assoc) {
				try {
					const commandUuid = queueCreateAccountCommand({
						owner_uuid: assoc.uuid,
						name: assoc.name,
						demurrage_exempt: handle === 'treasury' || handle === 'social-insurance' // Treasury and SIF exempt from demurrage
					});
					console.log(`  ✓ Queued account creation for ${assoc.name}: ${commandUuid}`);
				} catch (err) {
					console.error(`  ✗ Failed to queue account creation for ${assoc.name}:`, err);
				}
			}
		}

		// Seed services, colleges, and committees
		seedServices(services, person.uuid, { skipIfExists: false });
		seedColleges(colleges, person.uuid, { skipIfExists: false });
		seedCommittees(committees, person.uuid, { skipIfExists: false });

		// Queue bank account creation for service associations
		console.log('\n💰 Queueing bank account creation for service associations...');
		for (const service of services) {
			const assoc = getAssociationByHandle(service.handle);
			if (assoc) {
				try {
					const commandUuid = queueCreateAccountCommand({
						owner_uuid: assoc.uuid,
						name: assoc.name,
						demurrage_exempt: false // Services subject to normal demurrage
					});
					console.log(`  ✓ Queued account creation for ${assoc.name}: ${commandUuid}`);
				} catch (err) {
					console.error(`  ✗ Failed to queue account creation for ${assoc.name}:`, err);
				}
			}
		}
		seedServices(services, person.uuid, { skipIfExists: false });
		seedColleges(colleges, person.uuid, { skipIfExists: false });
		seedCommittees(committees, person.uuid, { skipIfExists: false });

		// Configure sortition for General Assembly
		const ga = getAssociationByHandle('general-assembly')!;
		setSortitionConfig({ association_uuid: ga.uuid, seat_count: 5, term_days: 365 });

		// Seed standard vote rules
		const society = getAssociationByHandle('society')!;
		const standardRules = [
			{ name: 'Simple Majority',       numerator: 1, denominator: 2 },
			{ name: 'Two-Thirds',            numerator: 2, denominator: 3 },
			{ name: 'Three-Quarters',        numerator: 3, denominator: 4 },
			{ name: 'Unanimous',             numerator: 1, denominator: 1 },
		];
		for (const r of standardRules) {
			createVoteRule({ association_uuid: society.uuid, ...r });
			createVoteRule({ association_uuid: ga.uuid, ...r });
		}

		// Seed standard deliberation rules
		const standardDeliberationRules = [
			{ name: 'Standard (7 days)',     minimum_days: 7 },
			{ name: 'Extended (14 days)',    minimum_days: 14 },
			{ name: 'Constitutional (30 days)', minimum_days: 30 },
			{ name: 'Urgent (1 day)',        minimum_days: 1 },
		];
		for (const r of standardDeliberationRules) {
			createDeliberationRule({ association_uuid: society.uuid, ...r });
			createDeliberationRule({ association_uuid: ga.uuid, ...r });
		}

		// Documents are now file-based in data/library/*.json and loaded directly
		// No need to import them into the database

		// Create a Founder role in the Society with all permissions; assign in every association
		const founderRoleUuid = randomUUID();
		const createdAt = new Date().toISOString();
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, title, created_at) VALUES (?, ?, 'Founder', ?)`
		).run(founderRoleUuid, society.uuid, createdAt);

		const insertPerm = db.prepare(
			`INSERT INTO role_permission (role_uuid, app, permission) VALUES (?, 'governance', ?)`
		);
		for (const permission of ALL_PERMISSIONS) {
			insertPerm.run(founderRoleUuid, permission);
		}

		// Assign founder role to the founding member
		assignRole(founderRoleUuid, person.uuid);

		// Create Administrator roles in satellite app associations (bank, mail, marketplace)
		seedAdminRoles(person.uuid);

		// Issue initial Franks for the founder (now that Treasury exists)
		try {
			const commandUuid = issueInitialFranks({
				personUuid: person.uuid,
				dateOfBirth: dob,
				performedByUuid: person.uuid
			});
			console.log(`✅ Queued initial issuance for founder: command ${commandUuid}`);
		} catch (err) {
			console.error('⚠️  Failed to queue initial franks for founder:', err);
		}

		console.log('✅ Setup complete!\n');
		redirect(302, '/login');
	}
};