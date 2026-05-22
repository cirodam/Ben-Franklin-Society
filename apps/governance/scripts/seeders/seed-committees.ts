#!/usr/bin/env node
/**
 * Committee-specific seeder with sortition configuration.
 */

import type { CommitteeConfig } from '../seed-data/types.js';
import { seedAssociation, type SeedAssociationOptions } from './seed-associations.js';
import { setSortitionConfig, getAssociationByHandle } from '../../src/lib/server/organization/associations.js';

/**
 * Seed committee associations with sortition configuration.
 * 
 * @param committees - Array of committee configurations to seed
 * @param founderUuid - UUID of the founder to add as member
 * @param options - Seeding options
 * @returns Map of committee handle -> association
 */
export function seedCommittees(
	committees: CommitteeConfig[],
	founderUuid: string,
	options: SeedAssociationOptions = {}
): Map<string, any> {
	console.log(`\n📋 Seeding ${committees.length} committee(s)...`);
	
	const associations = new Map<string, any>();

	for (const config of committees) {
		// Create the committee association
		const association = seedAssociation(config, founderUuid, options);
		associations.set(config.handle, association);

		// Configure sortition if specified
		if (config.sortition) {
			const { seat_count, term_days, source_college } = config.sortition;
			
			// Resolve source college UUID if specified
			let sourceCollegeUuid: string | null = null;
			if (source_college) {
				const college = getAssociationByHandle(source_college);
				if (!college) {
					console.warn(`    ⚠️  Source college @${source_college} not found, skipping sortition config`);
					continue;
				}
				sourceCollegeUuid = college.uuid;
			}

			// Set sortition configuration
			setSortitionConfig({
				association_uuid: association.uuid,
				seat_count,
				term_days,
				source_college_uuid: sourceCollegeUuid,
			});

			console.log(`    ⚙️  Configured sortition: ${seat_count} seats, ${term_days}-day terms${sourceCollegeUuid ? `, draws from @${source_college}` : ''}`);
		}
	}
	
	console.log(`✅ Seeded ${committees.length} committee(s)`);
	return associations;
}
