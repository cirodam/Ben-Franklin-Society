#!/usr/bin/env node
/**
 * College-specific seeder.
 */

import type { CollegeConfig } from '../seed-data/types.js';
import { seedAssociations, type SeedAssociationOptions } from './seed-associations.js';

/**
 * Seed college associations.
 * 
 * @param colleges - Array of college configurations to seed
 * @param founderUuid - UUID of the founder to add as member
 * @param options - Seeding options
 * @returns Map of college handle -> association
 */
export function seedColleges(
	colleges: CollegeConfig[],
	founderUuid: string,
	options: SeedAssociationOptions = {}
): Map<string, any> {
	console.log(`\n📋 Seeding ${colleges.length} college(s)...`);
	
	const associations = seedAssociations(colleges, founderUuid, options);
	
	console.log(`✅ Seeded ${colleges.length} college(s)`);
	return associations;
}
