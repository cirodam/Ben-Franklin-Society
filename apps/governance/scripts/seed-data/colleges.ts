import type { CollegeConfig } from './types.js';

/**
 * College associations representing professional bodies.
 * Can be selectively seeded for testing scenarios.
 */
export const colleges: CollegeConfig[] = [
	{
		handle: 'agricultural-college',
		name: 'Agricultural College',
		type: 'college',
		abbreviation: 'AGCOL',
		governing_document_slug: 'agricultural-college',
		description: 'Professional association for farmers, gardeners, and agricultural workers',
	},
	{
		handle: 'culinary-arts',
		name: 'Culinary Arts College',
		type: 'college',
		abbreviation: 'CACOL',
		description: 'Professional association for chefs, bakers, and culinary professionals',
	},
];
