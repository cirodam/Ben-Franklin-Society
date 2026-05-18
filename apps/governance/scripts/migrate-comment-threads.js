#!/usr/bin/env node
/**
 * Migration: Convert motion_comment to general comment thread system
 * 
 * This script:
 * 1. Creates a comment thread for each motion that has comments
 * 2. Migrates all motion_comment entries to the new comment table
 * 3. Updates motion table with thread_uuid references
 * 4. Preserves all UUIDs, timestamps, and content
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../dev.sqlite');
const db = new Database(dbPath);

console.log('Starting migration: motion_comment → comment_thread system');

// Enable foreign keys
db.pragma('foreign_keys = ON');

try {
	db.exec('BEGIN TRANSACTION');
	
	// Step 1: Get all motions that have comments
	const motionsWithComments = db.prepare(`
		SELECT DISTINCT motion_uuid 
		FROM motion_comment
	`).all();
	
	console.log(`Found ${motionsWithComments.length} motions with comments`);
	
	// Step 2: Create a thread for each motion with comments and migrate data
	const createThread = db.prepare('INSERT INTO comment_thread (uuid, created_at) VALUES (?, ?)');
	const updateMotion = db.prepare('UPDATE motion SET thread_uuid = ? WHERE uuid = ?');
	const migrateComment = db.prepare(`
		INSERT INTO comment (uuid, thread_uuid, author_uuid, parent_comment_uuid, body, created_at, edited_at, deleted_at)
		VALUES (?, ?, ?, NULL, ?, ?, ?, ?)
	`);
	
	let threadCount = 0;
	let commentCount = 0;
	
	for (const { motion_uuid } of motionsWithComments) {
		// Get the earliest comment timestamp for this motion (thread creation time)
		const firstComment = db.prepare(`
			SELECT MIN(created_at) as created_at 
			FROM motion_comment 
			WHERE motion_uuid = ?
		`).get(motion_uuid);
		
		const thread_uuid = motion_uuid + '_thread'; // Generate predictable thread UUID
		const thread_created_at = firstComment.created_at;
		
		// Create thread
		createThread.run(thread_uuid, thread_created_at);
		threadCount++;
		
		// Update motion with thread reference
		updateMotion.run(thread_uuid, motion_uuid);
		
		// Migrate all comments for this motion
		const comments = db.prepare('SELECT * FROM motion_comment WHERE motion_uuid = ?')
			.all(motion_uuid);
		
		for (const comment of comments) {
			migrateComment.run(
				comment.uuid,
				thread_uuid,
				comment.author_uuid,
				comment.body,
				comment.created_at,
				comment.edited_at,
				comment.deleted_at
			);
			commentCount++;
		}
	}
	
	// Step 3: Create threads for motions without comments (so they can receive comments)
	const motionsWithoutThreads = db.prepare(`
		SELECT uuid, created_at 
		FROM motion 
		WHERE thread_uuid IS NULL
	`).all();
	
	console.log(`Creating threads for ${motionsWithoutThreads.length} motions without comments`);
	
	for (const motion of motionsWithoutThreads) {
		const thread_uuid = motion.uuid + '_thread';
		createThread.run(thread_uuid, motion.created_at);
		updateMotion.run(thread_uuid, motion.uuid);
		threadCount++;
	}
	
	db.exec('COMMIT');
	
	console.log('✅ Migration completed successfully!');
	console.log(`   Created ${threadCount} threads`);
	console.log(`   Migrated ${commentCount} comments`);
	console.log('');
	console.log('Note: motion_comment table still exists for rollback safety.');
	console.log('After verifying the migration, you can drop it with:');
	console.log('   DROP TABLE motion_comment;');
	
} catch (error) {
	db.exec('ROLLBACK');
	console.error('❌ Migration failed:', error);
	process.exit(1);
} finally {
	db.close();
}
