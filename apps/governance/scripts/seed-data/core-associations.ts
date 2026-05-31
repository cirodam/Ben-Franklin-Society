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
];
