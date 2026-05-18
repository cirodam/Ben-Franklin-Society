#!/usr/bin/env tsx

/**
 * HISTORICAL MIGRATION SCRIPT - Phase 2
 * 
 * This script was used to migrate from the old database schema to the library system.
 * It references old fields (deliberation_opened_at, motion_readiness) that no longer exist.
 * Kept for reference only - do not run on current schema.
 * 
 * Original purpose:
 * 1. Reads motions from the motion table
 * 2. Converts them to LibraryDocument<MotionContent> format
 * 3. Saves them to data/library/motions/{slug}.json
 * 4. Syncs metadata to the library_item table
 * 5. Keeps original DB tables for rollback
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openDatabase } from '@bfs/db';
import { schema } from '../src/lib/server/schema.js';

interface MotionRow {
	uuid: string;
	slug: string;
	motion_number: number;
	title: string;
	type: string;
	seniority: number | null;
	owner_uuid: string;
	body: string;
	reasoning: string | null;
	introduced_by_uuid: string;
	body_uuid: string;
	deliberation_rule_uuid: string | null;
	vote_rule_uuid: string | null;
	status: string;
	clerk_notes: string | null;
	parliamentarian_notes: string | null;
	created_at: string;
	adopted_at: string | null;
	adopted_by_motion_uuid: string | null;
	repealed_at: string | null;
	repealed_by_motion_uuid: string | null;
	deliberation_opened_at: string | null;
	enacted_at: string | null;
	resolved_at: string | null;
}

interface VoteTallyRow {
	motion_uuid: string;
	eligible_count: number;
	aye_count: number;
	nay_count: number;
	abstain_count: number;
	opened_at: string;
	closed_at: string | null;
}

interface MotionDocument {
	uuid: string;
	type: string;
	slug: string;
	title: string;
	owner_uuid: string;
	created_at: string;
	updated_at: string;
	content: {
		status: string;
		body: string;
		introducer_uuid: string;
		introduced_at?: string;
		deliberation_ends_at?: string;
		vote_opened_at?: string;
		vote_closed_at?: string;
		enacted_at?: string;
		vote_rule_uuid?: string;
		deliberation_rule_uuid?: string;
		motion_number?: string;
		clerk_notes?: string;
		parliamentarian_notes?: string;
		reasoning?: string;
		body_uuid?: string;
		adopted_at?: string;
		adopted_by_motion_uuid?: string;
		repealed_at?: string;
		repealed_by_motion_uuid?: string;
	};
}

const LIBRARY_DIR = join(process.cwd(), 'data', 'library');
const MOTIONS_DIR = join(LIBRARY_DIR, 'motions');

function formatMotionNumber(bodyUuid: string, motionNumber: number, createdAt: string): string {
	// Extract year from created_at
	const year = new Date(createdAt).getFullYear();
	
	// Format as M-YYYY-NNN
	const paddedNumber = motionNumber.toString().padStart(3, '0');
	return `M-${year}-${paddedNumber}`;
}

function main() {
	console.log('📚 Library System Migration - Phase 2');
	console.log('Exporting motions from database to library system...\n');

	// Open database
	const dbPath = process.env.DATABASE_PATH || './dev.sqlite';
	const db = openDatabase(dbPath);
	console.log(`Database: ${dbPath}`);
	
	// Apply schema (ensures library_item table exists)
	db.exec(schema);
	console.log('✓ Schema applied\n');

	// Create directories
	if (!existsSync(MOTIONS_DIR)) {
		mkdirSync(MOTIONS_DIR, { recursive: true });
		console.log('✓ Created data/library/motions/');
	}

	// Get all motions
	const motions = db.prepare('SELECT * FROM motion ORDER BY created_at ASC').all() as MotionRow[];

	if (motions.length === 0) {
		console.log('No motions found to migrate.');
		return;
	}

	console.log(`Found ${motions.length} motion(s) to migrate\n`);

	let migratedCount = 0;
	let skippedCount = 0;

	for (const motion of motions) {
		const filePath = join(MOTIONS_DIR, `${motion.slug}.json`);

		try {
			// Check if already migrated
			if (existsSync(filePath)) {
				console.log(`⏭️  Skipped ${motion.slug} (already exists)`);
				skippedCount++;
				continue;
			}

			// Get vote tally if it exists
			const tally = db.prepare(
				'SELECT * FROM motion_vote_tally WHERE motion_uuid = ?'
			).get(motion.uuid) as VoteTallyRow | undefined;

			// Format motion number
			const motionNumber = formatMotionNumber(
				motion.body_uuid, 
				motion.motion_number, 
				motion.created_at
			);

			// Convert to new format
			const newDoc: MotionDocument = {
				uuid: motion.uuid,
				type: 'motion',
				slug: motion.slug,
				title: motion.title,
				owner_uuid: motion.body_uuid,
				created_at: motion.created_at,
				updated_at: motion.resolved_at || motion.enacted_at || motion.deliberation_opened_at || motion.created_at,
				content: {
					status: motion.status,
					body: motion.body,
					introducer_uuid: motion.introduced_by_uuid,
					introduced_at: motion.deliberation_opened_at || motion.created_at,
					vote_opened_at: tally?.opened_at,
					vote_closed_at: tally?.closed_at ?? undefined,
					enacted_at: motion.enacted_at ?? undefined,
					vote_rule_uuid: motion.vote_rule_uuid ?? undefined,
					deliberation_rule_uuid: motion.deliberation_rule_uuid ?? undefined,
					motion_number: motionNumber,
					clerk_notes: motion.clerk_notes ?? undefined,
					parliamentarian_notes: motion.parliamentarian_notes ?? undefined,
					reasoning: motion.reasoning ?? undefined,
					body_uuid: motion.body_uuid,
					adopted_at: motion.adopted_at ?? undefined,
					adopted_by_motion_uuid: motion.adopted_by_motion_uuid ?? undefined,
					repealed_at: motion.repealed_at ?? undefined,
					repealed_by_motion_uuid: motion.repealed_by_motion_uuid ?? undefined,
				}
			};

			// Save to file
			writeFileSync(filePath, JSON.stringify(newDoc, null, 2), 'utf-8');

			// Sync to database
			const metadata = JSON.stringify({
				status: newDoc.content.status,
				motion_number: newDoc.content.motion_number,
				body_uuid: newDoc.content.body_uuid,
				introduced_at: newDoc.content.introduced_at,
				enacted_at: newDoc.content.enacted_at,
			});

			db.prepare(
				`INSERT OR REPLACE INTO library_item 
				 (uuid, type, slug, title, owner_uuid, created_at, updated_at, file_path, metadata_json)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			).run(
				newDoc.uuid,
				newDoc.type,
				newDoc.slug,
				newDoc.title,
				newDoc.owner_uuid,
				newDoc.created_at,
				newDoc.updated_at,
				`motions/${newDoc.slug}.json`,
				metadata
			);

			console.log(`✓ Migrated ${motion.slug} (${motionNumber})`);
			migratedCount++;
		} catch (err) {
			console.error(`✗ Failed to migrate ${motion.slug}:`, err);
		}
	}

	console.log(`\n📊 Migration Summary:`);
	console.log(`   Migrated: ${migratedCount}`);
	console.log(`   Skipped:  ${skippedCount}`);
	console.log(`   Total:    ${motions.length}`);

	if (migratedCount > 0) {
		console.log(`\n✓ Migration complete!`);
		console.log(`  Files written to: ${MOTIONS_DIR}`);
		console.log(`  Database index updated`);
		console.log(`\nOriginal motion table preserved for rollback.`);
		console.log(`After verifying everything works, you can deprecate the old motion table.`);
	}
}

main();
