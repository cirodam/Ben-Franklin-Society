import type { CoreAssociationConfig } from './types.js';

/**
 * Core system associations that are essential infrastructure.
 * These should always be created during setup.
 */
export const coreAssociations: CoreAssociationConfig[] = [
	{
		handle: 'society',
		name: 'The Society',
		type: 'society',
		abbreviation: 'SOC',
		description: 'The root association representing all members of this local society',
	},
	{
		handle: 'general-assembly',
		name: 'General Assembly',
		type: 'general_assembly',
		abbreviation: 'GA',
		description: 'The primary legislative body, populated by sortition from all members',
	},
	{
		handle: 'treasury',
		name: 'Treasury',
		type: 'association',
		abbreviation: 'TRES',
		description: 'Manages society-wide revenue collection and expenditure distribution',
	},
	{
		handle: 'social-insurance',
		name: 'Social Insurance Fund',
		type: 'social_insurance_fund',
		abbreviation: 'SIF',
		description: 'Provides mutual aid and insurance to members during times of need',
	},
];
