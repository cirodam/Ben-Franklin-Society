import type { ServiceConfig } from './types.js';

/**
 * Service associations that provide essential infrastructure and support.
 * Can be selectively seeded for testing scenarios.
 */
export const services: ServiceConfig[] = [
	{
		handle: 'community-bank',
		name: 'Community Bank Association',
		type: 'service',
		abbreviation: 'CBA',
		governs_app: 'bank',
		description: 'Governs the operation of the community banking system and monetary policy',
	},
	{
		handle: 'communications-service',
		name: 'Communications Service Association',
		type: 'service',
		abbreviation: 'CSA',
		governs_app: 'mail',
		description: 'Operates the inter-society mail system and communications infrastructure',
	},
	{
		handle: 'commerce-service',
		name: 'Commerce Service Association',
		type: 'service',
		abbreviation: 'CMSA',
		governs_app: 'marketplace',
		description: 'Governs the marketplace and facilitates exchange between members and societies',
	},
	{
		handle: 'mediation-service',
		name: 'Mediation Service Association',
		type: 'service',
		abbreviation: 'MSA',
		governs_app: null,
		description: 'Handles mediation, conflict resolution, and accountability proceedings under College of Conciliation oversight',
	},
	{
		handle: 'food-service',
		name: 'Food Service',
		type: 'service',
		abbreviation: 'FOOD',
		governs_app: null,
		description: 'Operates community kitchens, cafeterias, and food distribution',
	},
	{
		handle: 'agricultural-service',
		name: 'Agricultural Service',
		type: 'service',
		abbreviation: 'AGSVC',
		governs_app: null,
		description: 'Coordinates farming operations, seed libraries, and agricultural resources',
	},
	{
		handle: 'energy-service',
		name: 'Energy Service',
		type: 'service',
		abbreviation: 'ENRG',
		governs_app: null,
		description: 'Maintains power generation, distribution, and energy infrastructure',
	},
];
