#!/usr/bin/env node
/**
 * Service-specific seeder.
 */

import type { ServiceConfig } from '../seed-data/types.js';
import { seedAssociations, type SeedAssociationOptions } from './seed-associations.js';

/**
 * Seed service associations.
 * 
 * @param services - Array of service configurations to seed
 * @param founderUuid - UUID of the founder to add as member
 * @param options - Seeding options
 * @returns Map of service handle -> association
 */
export function seedServices(
	services: ServiceConfig[],
	founderUuid: string,
	options: SeedAssociationOptions = {}
): Map<string, any> {
	console.log(`\n📋 Seeding ${services.length} service(s)...`);
	
	const associations = seedAssociations(services, founderUuid, options);
	
	console.log(`✅ Seeded ${services.length} service(s)`);
	return associations;
}
