#!/usr/bin/env tsx

/**
 * Migration: Create vote_session system and backfill existing votes
 * 
 * This script:
 * 1. Applies schema changes (creates vote_session table, adds vote_session_uuid to motion_vote_receipt)
 * 2. Creates vote_session records for all existing motion vote tallies
 * 3. Backfills vote_session_uuid in motion_vote_receipt table
 * 4. Sets appropriate status and outcome based on motion status
 * 
 * This migration enables the decoupling of voting from meetings,
 * making voting a first-class independent system.
 */

import { randomUUID } from 'node:crypto';
import { openDatabase } from '@bfs/db';
import { schema } from '../src/lib/server/schema.js';

const dbPath = process.env.DATABASE_PATH || './dev.sqlite';

interface MotionVoteTally {
	motion_uuid: string;
	eligible_count: number;
	aye_count: number;
	nay_count: number;
	abstain_count: number;
	opened_at: string;
	closed_at: string | null;
}

interface Motion {
	uuid: string;
	introduced_by_uuid: string;
	body_uuid: string;
	status: string;
	vote_rule_uuid: string | null;
	enacted_at: string | null;
	resolved_at: string | null;
}

interface VoteRule {
	uuid: string;
	numerator: number;
	denominator: number;
}

function main() {
	console.log('🗳️  Vote Session Migration');
	console.log('Creating independent voting system...\n');

	const db = openDatabase(dbPath);
	console.log(`Database: ${dbPath}`);
	
	// Apply schema (creates vote_session table if not exists)
	console.log('\n📋 Applying schema changes...');
	db.exec(schema);
	console.log('✓ Schema applied (vote_session table created)');
	
	// Add vote_session_uuid column to motion_vote_receipt if it doesn't exist
	console.log('\n🔧 Updating motion_vote_receipt table...');
	try {
		// Check if column exists
		const columnInfo = db.prepare("PRAGMA table_info(motion_vote_receipt)").all() as any[];
		const hasVoteSessionUuid = columnInfo.some((col: any) => col.name === 'vote_session_uuid');
		
		if (!hasVoteSessionUuid) {
			db.exec(`ALTER TABLE motion_vote_receipt ADD COLUMN vote_session_uuid TEXT NULL REFERENCES vote_session(uuid)`);
			console.log('✓ Added vote_session_uuid column to motion_vote_receipt');
		} else {
			console.log('✓ vote_session_uuid column already exists');
		}
	} catch (error) {
		console.warn('⚠️  Could not add vote_session_uuid column (may already exist)');
	}
	
	// Get all motion vote tallies that need sessions
	console.log('\n📊 Finding existing vote tallies...');
	const tallies = db.prepare(`
		SELECT * FROM motion_vote_tally
	`).all() as MotionVoteTally[];
	
	console.log(`Found ${tallies.length} vote tallies to migrate`);
	
	if (tallies.length === 0) {
		console.log('\n✨ No existing votes to migrate. Schema is ready for new vote sessions!');
		return;
	}
	
	let created = 0;
	let skipped = 0;
	
	console.log('\n🔄 Creating vote sessions...');
	
	db.transaction(() => {
		for (const tally of tallies) {
			// Check if session already exists
			const existing = db.prepare(
				'SELECT uuid FROM vote_session WHERE motion_uuid = ?'
			).get(tally.motion_uuid);
			
			if (existing) {
				skipped++;
				continue;
			}
			
			// Get motion details
			const motion = db.prepare(
				'SELECT uuid, introduced_by_uuid, body_uuid, status, vote_rule_uuid, enacted_at, resolved_at FROM motion WHERE uuid = ?'
			).get(tally.motion_uuid) as Motion | undefined;
			
			if (!motion) {
				console.warn(`  ⚠️  Motion ${tally.motion_uuid} not found, skipping`);
				continue;
			}
			
			// Determine passing threshold from vote rule (default to simple majority)
			let passing_threshold = 0.5;
			if (motion.vote_rule_uuid) {
				const voteRule = db.prepare(
					'SELECT numerator, denominator FROM vote_rule WHERE uuid = ?'
				).get(motion.vote_rule_uuid) as VoteRule | undefined;
				
				if (voteRule) {
					passing_threshold = voteRule.numerator / voteRule.denominator;
				}
			}
			
			// Determine outcome based on motion status
			let outcome: 'passed' | 'failed' | null = null;
			let status: 'scheduled' | 'open' | 'closed' | 'finalized' = 'finalized';
			
			if (motion.status === 'enacted') {
				outcome = 'passed';
			} else if (motion.status === 'rejected') {
				outcome = 'failed';
			} else if (motion.status === 'deliberation') {
				// Still voting or not yet finalized
				status = tally.closed_at ? 'closed' : 'open';
				outcome = null;
			}
			
			// Use motion introducer as the session opener (best guess)
			const opened_by = motion.introduced_by_uuid;
			
			// Use tally timestamps
			const opens_at = tally.opened_at;
			const closes_at = tally.closed_at || motion.resolved_at || new Date().toISOString();
			const closed_at = tally.closed_at;
			const finalized_at = motion.resolved_at || (status === 'finalized' ? closes_at : null);
			
			// Create vote session
			const sessionUuid = randomUUID();
			db.prepare(`
				INSERT INTO vote_session (
					uuid,
					motion_uuid,
					opened_by,
					meeting_uuid,
					passing_threshold,
					requires_quorum,
					quorum_threshold,
					opens_at,
					closes_at,
					status,
					closed_at,
					finalized_at,
					outcome,
					created_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`).run(
				sessionUuid,
				tally.motion_uuid,
				opened_by,
				null, // No meeting context in legacy data
				passing_threshold,
				0, // No quorum tracking in legacy
				null,
				opens_at,
				closes_at,
				status,
				closed_at,
				finalized_at,
				outcome,
				tally.opened_at
			);
			
			// Backfill vote_session_uuid in motion_vote_receipt
			db.prepare(`
				UPDATE motion_vote_receipt 
				SET vote_session_uuid = ? 
				WHERE motion_uuid = ?
			`).run(sessionUuid, tally.motion_uuid);
			
			created++;
		}
	})();
	
	console.log(`\n✅ Migration complete!`);
	console.log(`   Created: ${created} vote sessions`);
	console.log(`   Skipped: ${skipped} (already existed)`);
	console.log(`\n📝 Summary:`);
	console.log(`   - vote_session table created`);
	console.log(`   - ${created} legacy vote tallies migrated to sessions`);
	console.log(`   - motion_vote_receipt records linked to sessions`);
	console.log(`\n🎉 Voting system is now independent from meetings!`);
}

try {
	main();
} catch (error) {
	console.error('\n❌ Migration failed:', error);
	process.exit(1);
}
