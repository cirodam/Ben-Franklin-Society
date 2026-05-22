import type { CommitteeConfig } from './types.js';

/**
 * Committee associations with sortition configuration.
 * Can be selectively seeded for testing scenarios.
 */
export const committees: CommitteeConfig[] = [
	{
		handle: 'agricultural-committee',
		name: 'Agricultural Committee',
		type: 'committee',
		abbreviation: 'AGCOM',
		governing_document_slug: 'committee-rules',
		description: 'Standing committee for agricultural policy and resource allocation',
		sortition: {
			seat_count: 5,
			term_days: 180,
			source_college: 'agricultural-college',
		},
	},
	{
		handle: 'food-committee',
		name: 'Food Committee',
		type: 'committee',
		abbreviation: 'FDCOM',
		governing_document_slug: 'committee-rules',
		description: 'Standing committee for food policy and nutrition programs',
		sortition: {
			seat_count: 5,
			term_days: 180,
			source_college: 'culinary-arts',
		},
	},
];
