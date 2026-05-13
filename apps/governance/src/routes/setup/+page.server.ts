import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Actions, PageServerLoad } from './$types.js';
import { createPerson, getPersonByHandle } from '$lib/server/people.js';
import { createAssociation, addMember, getAssociationByHandle, setSortitionConfig } from '$lib/server/associations.js';
import { createVoteRule } from '$lib/server/vote_rules.js';
import { importDocument, type DocumentImportInput } from '$lib/server/documents.js';
import { ALL_PERMISSIONS } from '$lib/server/permissions.js';
import { setInitialCommunityConfig } from '$lib/server/config.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async () => {
	const existing = db.prepare('SELECT 1 FROM person LIMIT 1').get();
	if (existing) redirect(302, '/login');
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const societyName = data.get('society_name');
		const rawHandle   = data.get('handle');
		const givenName   = data.get('given_name');
		const familyName  = data.get('family_name');
		const dob         = data.get('date_of_birth');
		const password    = data.get('password');
		const confirm     = data.get('confirm_password');

		if (
			typeof societyName !== 'string' || !societyName ||
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

		if (password !== confirm) {
			return fail(400, { error: 'Passwords do not match.' });
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

		// Save community configuration with sensible defaults
		setInitialCommunityConfig('society_name', societyName, 'The full name of this local society');
		setInitialCommunityConfig('dues_rate_monthly', '100', 'Monthly membership dues in Franks');
		setInitialCommunityConfig('demurrage_rate', '0.02', 'Demurrage rate as a decimal fraction (0.02 = 2% per month)');
		setInitialCommunityConfig('demurrage_threshold', '5000', 'Balance above which demurrage applies, in Franks');
		setInitialCommunityConfig('demurrage_type', 'recirculation', 'Where demurrage goes: recirculation (Treasury) or contraction (Central Bank)');
		setInitialCommunityConfig('demurrage_schedule', '0 6 1 * *', 'Cron expression for demurrage runs (1st of month at 6am)');
		setInitialCommunityConfig('birthday_issuance_amount', '2000', 'Franks issued per member per birthday');
		setInitialCommunityConfig('society_latitude', '0.0', 'Decimal latitude of the society\'s primary location');
		setInitialCommunityConfig('society_longitude', '0.0', 'Decimal longitude of the society\'s primary location');
		setInitialCommunityConfig('federation_radius_km', '50', 'Default radius in kilometers for browsing neighboring societies');

		// Seed the four system associations and add the founding member
		const systemAssociations = [
			{ handle: 'society',             name: 'The Society',            type: 'society'              },
			{ handle: 'general-assembly',    name: 'General Assembly',       type: 'general_assembly'     },
			{ handle: 'central-bank',        name: 'Central Bank',           type: 'central_bank'         },
			{ handle: 'social-insurance',    name: 'Social Insurance Fund',  type: 'social_insurance_fund'},
			{ handle: 'community-bank',      name: 'Community Bank',         type: 'community_bank'       },
			{ handle: 'agricultural-college',name: 'Agricultural College',   type: 'college'              },
			{ handle: 'culinary-arts',       name: 'Culinary Arts College',  type: 'college'              },
			{ handle: 'food-service',        name: 'Food Service',           type: 'service'              },
			{ handle: 'agricultural-service',name: 'Agricultural Service',   type: 'service'              },
			{ handle: 'communications-service', name: 'Communications Service', type: 'service'           },
			{ handle: 'commerce-service',    name: 'Commerce Service',       type: 'service'              },
			{ handle: 'agricultural-committee', name: 'Agricultural Committee', type: 'committee'         },
			{ handle: 'food-committee',      name: 'Food Committee',         type: 'committee'            },
		] as const;

		for (const assoc of systemAssociations) {
			const created = createAssociation(assoc);
			addMember(created.uuid, person.uuid);
		}

		// Configure sortition bodies: General Assembly and committees
		const ga = getAssociationByHandle('general-assembly')!;
		setSortitionConfig({ association_uuid: ga.uuid, seat_count: 12, term_days: 365 });

		const agCommittee = getAssociationByHandle('agricultural-committee')!;
		const agCollege   = getAssociationByHandle('agricultural-college')!;
		setSortitionConfig({ association_uuid: agCommittee.uuid, seat_count: 5, term_days: 180, source_college_uuid: agCollege.uuid });

		const foodCommittee = getAssociationByHandle('food-committee')!;
		const culinaryCollege = getAssociationByHandle('culinary-arts')!;
		setSortitionConfig({ association_uuid: foodCommittee.uuid, seat_count: 5, term_days: 180, source_college_uuid: culinaryCollege.uuid });

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

		// Seed documents from data/documents/*.json
		// Constitution and Charter are owned by the Society
		const dataDir = join(process.cwd(), 'data', 'documents');
		for (const file of readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
			const raw = JSON.parse(readFileSync(join(dataDir, file), 'utf-8')) as DocumentImportInput;
			const isSocietyDoc = raw.slug === 'constitution' || raw.slug === 'charter';
			importDocument({ ...raw, owner_uuid: isSocietyDoc ? society.uuid : null, created_by_uuid: person.uuid });
		}

		// Create a Founder role in the Society with all permissions; assign in every association
		const founderRoleUuid = randomUUID();
		const createdAt = new Date().toISOString();
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, name, created_at) VALUES (?, ?, 'Founder', ?)`
		).run(founderRoleUuid, society.uuid, createdAt);

		const insertPerm = db.prepare(
			`INSERT INTO role_permission (role_uuid, app, permission) VALUES (?, 'governance', ?)`
		);
		for (const permission of ALL_PERMISSIONS) {
			insertPerm.run(founderRoleUuid, permission);
		}

		const insertPersonRole = db.prepare(
			`INSERT INTO person_role (person_uuid, role_uuid, association_uuid, assigned_at) VALUES (?, ?, ?, ?)`
		);
		for (const assoc of systemAssociations) {
			const a = getAssociationByHandle(assoc.handle)!;
			insertPersonRole.run(person.uuid, founderRoleUuid, a.uuid, createdAt);
		}

		// Seed Food Service with ICS structure
		const foodService = getAssociationByHandle('food-service')!;
		
		// Food Officer (Level 1 - top leadership)
		const foodOfficerUuid = randomUUID();
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, name, level, parent_role_uuid, division, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			foodOfficerUuid,
			foodService.uuid,
			'Food Officer',
			1,
			null,
			null,
			730, // 2 years
			'Chief executive of Food Service. Coordinates all food operations, sets policy, manages budget. Reports to General Assembly. Oversees Supply, Processing, Distribution, and Quality sections.',
			3000,
			createdAt
		);

		// Supply Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, name, level, parent_role_uuid, division, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			foodService.uuid,
			'Supply Section Chief',
			2,
			foodOfficerUuid,
			'Supply',
			365, // 1 year
			'Manages food procurement, storage, and inventory. Coordinates with Agricultural Service and Marketplace for sourcing. Ensures adequate supplies for processing and distribution.',
			2200,
			createdAt
		);

		// Processing Section Chief (Level 2)
		const processingSectionChiefUuid = randomUUID();
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, name, level, parent_role_uuid, division, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			processingSectionChiefUuid,
			foodService.uuid,
			'Processing Section Chief',
			2,
			foodOfficerUuid,
			'Processing',
			365,
			'Manages communal kitchens, food preservation, and meal preparation. Ensures food safety standards. Coordinates with Quality section for compliance.',
			2200,
			createdAt
		);

		// Distribution Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, name, level, parent_role_uuid, division, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			foodService.uuid,
			'Distribution Section Chief',
			2,
			foodOfficerUuid,
			'Distribution',
			365,
			'Manages meal service, delivery routes, and emergency food provisions. Coordinates with households for allocation. Ensures equitable access.',
			2200,
			createdAt
		);

		// Quality Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, name, level, parent_role_uuid, division, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			foodService.uuid,
			'Quality Section Chief',
			2,
			foodOfficerUuid,
			'Quality',
			365,
			'Manages food safety inspections, nutrition standards, and compliance. Trains staff on safety protocols. Investigates food safety incidents.',
			2200,
			createdAt
		);

		// Kitchen Worker (Level 4 - daily position example)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, name, level, parent_role_uuid, division, term_days, description, daily_rate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			foodService.uuid,
			'Kitchen Worker',
			4,
			processingSectionChiefUuid,
			'Processing',
			null, // As-needed
			'Assists with meal preparation, cleaning, and kitchen operations. No prior experience required. Flexible scheduling available.',
			100,
			createdAt
		);

		redirect(302, '/login');
	}
};
