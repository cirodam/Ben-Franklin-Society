import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import type { Actions, PageServerLoad } from './$types.js';
import { createPerson, getPersonByHandle } from '$lib/server/people.js';
import { createAssociation, addMember, getAssociationByHandle, setSortitionConfig } from '$lib/server/associations.js';
import { createVoteRule } from '$lib/server/vote_rules.js';
import { createDeliberationRule } from '$lib/server/deliberation_rules.js';
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
			{ handle: 'energy-service',      name: 'Energy Service',         type: 'service'              },
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
		// General Assembly: ~1% of population, 1-year terms. Start with 5 seats (adjust as population grows)
		setSortitionConfig({ association_uuid: ga.uuid, seat_count: 5, term_days: 365 });

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

		// Documents are now file-based in data/documents/*.json and loaded directly
		// No need to import them into the database

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
		
		// Create organizational sections for Food Service
		const supplySection = randomUUID();
		const processingSection = randomUUID();
		const distributionSection = randomUUID();
		const qualitySection = randomUUID();
		
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(supplySection, foodService.uuid, null, 'Supply', 'Procure and manage food supplies, storage, and inventory. Coordinate with Agricultural Service and Marketplace for sourcing.', createdAt);
		
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(processingSection, foodService.uuid, null, 'Processing', 'Transform raw ingredients through communal kitchens, food preservation, and meal preparation. Maintain food safety standards.', createdAt);
		
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(distributionSection, foodService.uuid, null, 'Distribution', 'Manage meal service, delivery routes, and emergency food provisions. Ensure equitable access to food for all households.', createdAt);
		
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(qualitySection, foodService.uuid, null, 'Quality', 'Manage food safety inspections, nutrition standards, and compliance. Train staff on safety protocols.', createdAt);
		
		// Food Officer (Level 1 - top leadership)
		const foodOfficerUuid = randomUUID();
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			foodOfficerUuid,
			foodService.uuid,
			null, // Root level - no section
			'Food Officer',
			1,
			null,
			730, // 2 years
			'Chief executive of Food Service. Coordinates all food operations, sets policy, manages budget. Reports to General Assembly. Oversees Supply, Processing, Distribution, and Quality sections.',
			3000,
			createdAt
		);

		// Supply Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			foodService.uuid,
			supplySection,
			'Supply Section Chief',
			2,
			foodOfficerUuid,
			365, // 1 year
			'Manages food procurement, storage, and inventory. Coordinates with Agricultural Service and Marketplace for sourcing. Ensures adequate supplies for processing and distribution.',
			2200,
			createdAt
		);

		// Processing Section Chief (Level 2)
		const processingSectionChiefUuid = randomUUID();
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			processingSectionChiefUuid,
			foodService.uuid,
			processingSection,
			'Processing Section Chief',
			2,
			foodOfficerUuid,
			365,
			'Manages communal kitchens, food preservation, and meal preparation. Ensures food safety standards. Coordinates with Quality section for compliance.',
			2200,
			createdAt
		);

		// Distribution Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			foodService.uuid,
			distributionSection,
			'Distribution Section Chief',
			2,
			foodOfficerUuid,
			365,
			'Manages meal service, delivery routes, and emergency food provisions. Coordinates with households for allocation. Ensures equitable access.',
			2200,
			createdAt
		);

		// Quality Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			foodService.uuid,
			qualitySection,
			'Quality Section Chief',
			2,
			foodOfficerUuid,
			365,
			'Manages food safety inspections, nutrition standards, and compliance. Trains staff on safety protocols. Investigates food safety incidents.',
			2200,
			createdAt
		);

		// Kitchen Worker (Level 4 - daily position example)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, daily_rate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			foodService.uuid,
			processingSection,
			'Kitchen Worker',
			4,
			processingSectionChiefUuid,
			null, // As-needed
			'Assists with meal preparation, cleaning, and kitchen operations. No prior experience required. Flexible scheduling available.',
			100,
			createdAt
		);

		// Seed Community Bank with organizational structure
		const communityBank = getAssociationByHandle('community-bank')!;
		
		// Create organizational sections for Community Bank
		const mainBranchSection = randomUUID();
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(mainBranchSection, communityBank.uuid, null, 'Main Branch', 'Provide banking services to community members including deposits, withdrawals, and financial management.', createdAt);
		
		// Bank Officer (Level 1 - top leadership)
		const bankOfficerUuid = randomUUID();
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			bankOfficerUuid,
			communityBank.uuid,
			null,
			'Bank Officer',
			1,
			null,
			730, // 2 years
			'Chief executive of Community Bank. Sets banking policy, manages overall operations, ensures financial stability. Reports to General Assembly. Oversees all branch operations.',
			3000,
			createdAt
		);

		// Branch Officer (Level 2)
		const branchOfficerUuid = randomUUID();
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			branchOfficerUuid,
			communityBank.uuid,
			mainBranchSection,
			'Branch Officer',
			2,
			bankOfficerUuid,
			365, // 1 year
			'Manages daily operations of the main branch. Supervises tellers, handles complex transactions, ensures compliance with banking policies. Provides customer service leadership.',
			2200,
			createdAt
		);

		// Teller (Level 3)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			communityBank.uuid,
			mainBranchSection,
			'Teller',
			3,
			branchOfficerUuid,
			180, // 6 months
			'Processes member transactions including deposits, withdrawals, and account inquiries. Maintains accurate cash drawer. Provides courteous service to members.',
			1800,
			createdAt
		);

		// Seed Central Bank with organizational structure
		const centralBank = getAssociationByHandle('central-bank')!;
		
		// Create organizational sections for Central Bank
		const economicsSection = randomUUID();
		const demographicsSection = randomUUID();
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(economicsSection, centralBank.uuid, null, 'Economics', 'Manage monetary policy analysis, currency operations, and financial stability monitoring. Track economic indicators and recommend policy adjustments.', createdAt);
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(demographicsSection, centralBank.uuid, null, 'Demographics', 'Manage population data collection and analysis. Track births, deaths, migrations, and household formation. Provide demographic forecasts for planning.', createdAt);
		
		// Central Bank Officer (Level 1 - top leadership)
		const centralBankOfficerUuid = randomUUID();
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			centralBankOfficerUuid,
			centralBank.uuid,
			null,
			'Central Bank Officer',
			1,
			null,
			730, // 2 years
			'Chief executive of Central Bank. Sets monetary policy, manages currency issuance and demurrage, oversees economic planning. Reports to General Assembly. Coordinates Economics and Demographics sections.',
			3200,
			createdAt
		);

		// Economics Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			centralBank.uuid,
			economicsSection,
			'Economics Section Chief',
			2,
			centralBankOfficerUuid,
			365, // 1 year
			'Manages monetary policy analysis, currency operations, and financial stability monitoring. Tracks inflation, employment, and economic indicators. Recommends policy adjustments.',
			2400,
			createdAt
		);

		// Demographics Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			centralBank.uuid,
			demographicsSection,
			'Demographics Section Chief',
			2,
			centralBankOfficerUuid,
			365, // 1 year
			'Manages population data collection and analysis. Tracks births, deaths, migrations, household formation. Provides demographic forecasts for economic planning and resource allocation.',
			2400,
			createdAt
		);

		// Seed Commerce Service with organizational structure
		const commerceService = getAssociationByHandle('commerce-service')!;
		
		// Create organizational sections for Commerce Service
		const ecommerceSection = randomUUID();
		const centralMarketplaceSection = randomUUID();
		const northMarketplaceSection = randomUUID();
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(ecommerceSection, commerceService.uuid, null, 'E-commerce', 'Manage online marketplace platform, digital listings, and order fulfillment coordination. Ensure platform security and user experience.', createdAt);
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(centralMarketplaceSection, commerceService.uuid, null, 'Central Marketplace', 'Manage daily operations of Central Marketplace. Oversee vendor coordination, facility maintenance, security, and customer service.', createdAt);
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(northMarketplaceSection, commerceService.uuid, null, 'North Marketplace', 'Manage daily operations of North Marketplace. Oversee vendor coordination, facility maintenance, security, and customer service.', createdAt);
		
		// Commerce Officer (Level 1 - top leadership)
		const commerceOfficerUuid = randomUUID();
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			commerceOfficerUuid,
			commerceService.uuid,
			null,
			'Commerce Officer',
			1,
			null,
			730, // 2 years
			'Chief executive of Commerce Service. Sets commerce policy, oversees marketplace operations, manages e-commerce platform. Reports to General Assembly. Coordinates e-commerce and physical marketplace sections.',
			3000,
			createdAt
		);

		// E-commerce Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			commerceService.uuid,
			ecommerceSection,
			'E-commerce Section Chief',
			2,
			commerceOfficerUuid,
			365, // 1 year
			'Manages online marketplace platform, digital listings, order fulfillment coordination. Ensures platform security and user experience. Coordinates with physical marketplaces for inventory.',
			2200,
			createdAt
		);

		// Central Marketplace Officer (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			commerceService.uuid,
			centralMarketplaceSection,
			'Central Marketplace Officer',
			2,
			commerceOfficerUuid,
			365, // 1 year
			'Manages daily operations of Central Marketplace. Oversees vendor coordination, facility maintenance, security, and customer service. Ensures fair trading practices and market accessibility.',
			2200,
			createdAt
		);

		// North Marketplace Officer (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			commerceService.uuid,
			northMarketplaceSection,
			'North Marketplace Officer',
			2,
			commerceOfficerUuid,
			365, // 1 year
			'Manages daily operations of North Marketplace. Oversees vendor coordination, facility maintenance, security, and customer service. Ensures fair trading practices and market accessibility.',
			2200,
			createdAt
		);

		// Seed Communications Service with organizational structure
		const communicationsService = getAssociationByHandle('communications-service')!;
		
		// Create organizational sections for Communications Service
		const webServicesSection = randomUUID();
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(webServicesSection, communicationsService.uuid, null, 'Web Services', 'Manage web hosting, application development, and digital services. Maintain community websites and web applications.', createdAt);
		
		// Communications Officer (Level 1 - top leadership)
		const communicationsOfficerUuid = randomUUID();
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			communicationsOfficerUuid,
			communicationsService.uuid,
			null,
			'Communications Officer',
			1,
			null,
			730, // 2 years
			'Chief executive of Communications Service. Sets communications policy, oversees all telecommunications and digital infrastructure. Reports to General Assembly. Coordinates web services and network operations.',
			3000,
			createdAt
		);

		// Web Services Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			communicationsService.uuid,
			webServicesSection,
			'Web Services Section Chief',
			2,
			communicationsOfficerUuid,
			365, // 1 year
			'Manages web hosting, application development, and digital services. Maintains community websites and web applications. Ensures security, uptime, and accessibility of digital platforms.',
			2200,
			createdAt
		);

		// Seed Agricultural Service with organizational structure
		const agriculturalService = getAssociationByHandle('agricultural-service')!;
		
		// Create organizational sections for Agricultural Service
		const farmToolingSection = randomUUID();
		const farmLaborSection = randomUUID();
		const seedLibrarySection = randomUUID();
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(farmToolingSection, agriculturalService.uuid, null, 'Farm Tooling', 'Manage shared agricultural equipment, tools, and machinery available to independent farmers. Coordinate maintenance, repairs, and equipment lending.', createdAt);
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(farmLaborSection, agriculturalService.uuid, null, 'Farm Labor', 'Coordinate labor pools to support independent farmers. Match labor needs with available workers for planting, maintenance, and harvest seasons.', createdAt);
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(seedLibrarySection, agriculturalService.uuid, null, 'Seed Library', 'Manage community seed library. Coordinate seed collection, storage, and distribution. Maintain seed diversity and heritage varieties.', createdAt);
		
		// Agricultural Officer (Level 1 - top leadership)
		const agriculturalOfficerUuid = randomUUID();
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			agriculturalOfficerUuid,
			agriculturalService.uuid,
			null,
			'Agricultural Officer',
			1,
			null,
			730, // 2 years
			'Chief executive of Agricultural Service. Provides support services to independent community farms. Manages equipment sharing, labor coordination, and technical assistance. Reports to General Assembly.',
			3000,
			createdAt
		);

		// Farm Tooling Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			agriculturalService.uuid,
			farmToolingSection,
			'Farm Tooling Section Chief',
			2,
			agriculturalOfficerUuid,
			365, // 1 year
			'Manages shared agricultural equipment, tools, and machinery available to independent farmers. Coordinates maintenance, repairs, and equipment lending. Ensures tools are available and in good working condition.',
			2200,
			createdAt
		);

		// Farm Labor Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			agriculturalService.uuid,
			farmLaborSection,
			'Farm Labor Section Chief',
			2,
			agriculturalOfficerUuid,
			365, // 1 year
			'Coordinates labor pools to support independent farmers. Manages work schedules and volunteer assignments. Matches labor needs with available workers for planting, maintenance, and harvest seasons.',
			2200,
			createdAt
		);

		// Seed Library Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			agriculturalService.uuid,
			seedLibrarySection,
			'Seed Library Section Chief',
			2,
			agriculturalOfficerUuid,
			365, // 1 year
			'Manages community seed library. Coordinates seed collection, storage, and distribution to independent farmers. Maintains seed diversity and heritage varieties. Provides education on seed saving practices.',
			2200,
			createdAt
		);

		// Seed Energy Service with organizational structure
		const energyService = getAssociationByHandle('energy-service')!;
		
		// Create organizational sections for Energy Service
		const liquidFuelsSection = randomUUID();
		const electricalGenerationSection = randomUUID();
		const electricalDistributionSection = randomUUID();
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(liquidFuelsSection, energyService.uuid, null, 'Liquid Fuels', 'Manage liquid fuel supply, storage, and distribution. Oversee transition to biofuels and sustainable alternatives.', createdAt);
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(electricalGenerationSection, energyService.uuid, null, 'Electrical Generation', 'Manage power generation facilities including solar, wind, hydro, and backup systems. Ensure reliable electricity supply.', createdAt);
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(electricalDistributionSection, energyService.uuid, null, 'Electrical Distribution', 'Manage electrical grid, transmission lines, and distribution infrastructure. Ensure safe and efficient power delivery.', createdAt);
		
		// Energy Officer (Level 1 - top leadership)
		const energyOfficerUuid = randomUUID();
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			energyOfficerUuid,
			energyService.uuid,
			null,
			'Energy Officer',
			1,
			null,
			730, // 2 years
			'Chief executive of Energy Service. Sets energy policy, oversees all energy production and distribution. Manages transition to renewable energy. Reports to General Assembly. Coordinates fuel, generation, and distribution sections.',
			3000,
			createdAt
		);

		// Liquid Fuels Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			energyService.uuid,
			liquidFuelsSection,
			'Liquid Fuels Section Chief',
			2,
			energyOfficerUuid,
			365, // 1 year
			'Manages liquid fuel supply, storage, and distribution. Coordinates with suppliers, maintains fuel depots, ensures fuel quality and availability. Oversees transition to biofuels and sustainable alternatives.',
			2200,
			createdAt
		);

		// Electrical Generation Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			energyService.uuid,
			electricalGenerationSection,
			'Electrical Generation Section Chief',
			2,
			energyOfficerUuid,
			365, // 1 year
			'Manages power generation facilities including solar, wind, hydro, and backup systems. Coordinates maintenance, capacity planning, and expansion. Ensures reliable electricity supply for community needs.',
			2200,
			createdAt
		);

		// Electrical Distribution Section Chief (Level 2)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			energyService.uuid,
			electricalDistributionSection,
			'Electrical Distribution Section Chief',
			2,
			energyOfficerUuid,
			365, // 1 year
			'Manages electrical grid, transmission lines, and distribution infrastructure. Coordinates repairs, outage response, and grid maintenance. Ensures safe and efficient power delivery to all households and facilities.',
			2200,
			createdAt
		);

		// Seed General Assembly roles
		const generalAssembly = getAssociationByHandle('general-assembly')!;
		
		// Create organizational sections for General Assembly
		const assemblySection = randomUUID();
		const supportSection = randomUUID();
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(assemblySection, generalAssembly.uuid, null, 'Assembly', 'Sortition-selected deliberative body responsible for democratic governance, legislation, and policy-making.', createdAt);
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(supportSection, generalAssembly.uuid, null, 'Support', 'Administrative support staff providing procedural, clerical, and facilitation services to the Assembly.', createdAt);
		
		// Assembly Member (Level 1 - sortition-selected body)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			generalAssembly.uuid,
			assemblySection,
			'Assembly Member',
			1,
			null,
			365, // 1 year
			'Sortition-selected member of General Assembly. Participates in deliberation, votes on motions and legislation. Represents community interests in democratic governance.',
			0, // Volunteer
			createdAt
		);
		
		// Assembly Clerk (Level 1 - support staff)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			generalAssembly.uuid,
			supportSection,
			'Assembly Clerk',
			1,
			null,
			365, // 1 year
			'Manages assembly records, minutes, and documentation. Maintains official record of motions, votes, and proceedings. Provides administrative support to assembly members and presiding officer.',
			2500,
			createdAt
		);

		// Presiding Officer (Level 1 - support staff)
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			generalAssembly.uuid,
			supportSection,
			'Presiding Officer',
			1,
			null,
			365, // 1 year
			'Facilitates General Assembly meetings. Maintains parliamentary order, recognizes speakers, manages agenda. Ensures fair and orderly deliberation. Non-voting role focused on procedural fairness.',
			2500,
			createdAt
		);

		// Seed Committee Member roles (reuse variables from earlier)
		
		// Create organizational section for Agricultural Committee
		const agCommitteeSection = randomUUID();
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(agCommitteeSection, agCommittee.uuid, null, 'Committee', 'Sortition-selected committee body providing expertise on agricultural policies and practices.', createdAt);
		
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			agCommittee.uuid,
			agCommitteeSection,
			'Committee Member',
			1,
			null,
			180, // 6 months
			'Sortition-selected member of Agricultural Committee. Reviews agricultural policies, provides expertise, makes recommendations to General Assembly.',
			0, // Volunteer
			createdAt
		);

		// Create organizational section for Food Committee
		const foodCommitteeSection = randomUUID();
		db.prepare(
			`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, mandate, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(foodCommitteeSection, foodCommittee.uuid, null, 'Committee', 'Sortition-selected committee body providing culinary expertise on food service policies.', createdAt);
		
		db.prepare(
			`INSERT INTO role (uuid, association_uuid, section_uuid, name, level, parent_role_uuid, term_days, description, salary_monthly, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			foodCommittee.uuid,
			foodCommitteeSection,
			'Committee Member',
			1,
			null,
			180, // 6 months
			'Sortition-selected member of Food Committee. Reviews food service policies, provides culinary expertise, makes recommendations to General Assembly.',
			0, // Volunteer
			createdAt
		);

		redirect(302, '/login');
	}
};
