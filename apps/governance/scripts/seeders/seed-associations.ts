#!/usr/bin/env node
/**
 * Base seeder function for creating associations.
 * Handles association creation and founder membership.
 */

import type { Database } from 'better-sqlite3';
import { createAssociation, addMember, getAssociationByHandle } from '../../src/lib/server/organization/associations.js';
import type { BaseAssociationConfig } from '../seed-data/types.js';

export interface SeedAssociationOptions {
	skipIfExists?: boolean;
}

/**
 * Seed a single association and add the founder as a member.
 * Returns the created/existing association.
 */
export function seedAssociation(
	config: BaseAssociationConfig & { governs_app?: string | null },
	founderUuid: string,
	options: SeedAssociationOptions = {}
): any {
	const { skipIfExists = true } = options;

	// Check if association already exists
	const existing = getAssociationByHandle(config.handle);
	if (existing) {
		if (skipIfExists) {
			console.log(`  ⏭️  Association @${config.handle} already exists, skipping`);
			return existing;
		}
		console.log(`  ✓ Association @${config.handle} already exists`);
		return existing;
	}

	// Create the association
	const association = createAssociation({
		handle: config.handle,
		name: config.name,
		type: config.type as any,
		abbreviation: config.abbreviation,
		description: config.description,
		governing_document_slug: config.governing_document_slug,
		governs_app: config.governs_app,
	});

	// Add founder as member
	addMember(association.uuid, founderUuid);

	console.log(`  ✓ Created @${config.handle} (${config.name})`);
	return association;
}

/**
 * Seed multiple associations at once.
 * Returns a map of handle -> association.
 */
export function seedAssociations(
	configs: Array<BaseAssociationConfig & { governs_app?: string | null }>,
	founderUuid: string,
	options: SeedAssociationOptions = {}
): Map<string, any> {
	const associations = new Map<string, any>();

	for (const config of configs) {
		const association = seedAssociation(config, founderUuid, options);
		associations.set(config.handle, association);
	}

	return associations;
}
