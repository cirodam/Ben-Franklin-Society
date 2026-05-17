#!/usr/bin/env tsx

/**
 * Migration: Convert governing documents to new library system format
 * 
 * This script:
 * 1. Reads existing documents from data/library/*.json
 * 2. Converts them to the new LibraryDocument<GoverningDocContent> format
 * 3. Saves them to data/library/governing/*.json
 * 4. Syncs metadata to the library_item table
 * 5. Keeps originals for rollback
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { openDatabase } from '@bfs/db';
import { schema } from '../src/lib/server/schema.js';

interface LegacyDocument {
	slug: string;
	title: string;
	type: 'governing_document';
	seniority: number;
	owner_uuid: string;
	status: 'draft' | 'adopted' | 'repealed';
	created_at: string;
	adopted_at?: string | null;
	adopted_by_motion_uuid?: string | null;
	repealed_at?: string | null;
	repealed_by_motion_uuid?: string | null;
	articles: any[];
}

interface GoverningDocument {
	uuid: string;
	type: string;
	slug: string;
	title: string;
	owner_uuid: string;
	created_at: string;
	updated_at: string;
	content: {
		status: 'draft' | 'adopted' | 'repealed';
		seniority: number;
		articles: any[];
		adopted_at?: string;
		adopted_by_motion_uuid?: string;
		repealed_at?: string;
		repealed_by_motion_uuid?: string;
	};
}

const LIBRARY_DIR = join(process.cwd(), 'data', 'library');
const GOVERNING_DIR = join(LIBRARY_DIR, 'governing');
const BACKUP_DIR = join(LIBRARY_DIR, '_backup_pre_migration');

function main() {
	console.log('📚 Library System Migration - Phase 1');
	console.log('Converting governing documents to new format...\n');

	// Open database
	const dbPath = process.env.DATABASE_PATH || './dev.sqlite';
	const db = openDatabase(dbPath);
	console.log(`Database: ${dbPath}`);
	
	// Apply schema (ensures library_item table exists)
	db.exec(schema);
	console.log('✓ Schema applied\n');

	// Create directories
	if (!existsSync(GOVERNING_DIR)) {
		mkdirSync(GOVERNING_DIR, { recursive: true });
		console.log('✓ Created data/library/governing/');
	}

	if (!existsSync(BACKUP_DIR)) {
		mkdirSync(BACKUP_DIR, { recursive: true });
		console.log('✓ Created backup directory');
	}

	// Get all JSON files in library root
	const files = readdirSync(LIBRARY_DIR).filter((f) => f.endsWith('.json'));

	if (files.length === 0) {
		console.log('No documents found to migrate.');
		return;
	}

	console.log(`Found ${files.length} documents to migrate\n`);

	let migratedCount = 0;
	let skippedCount = 0;

	for (const file of files) {
		const slug = file.replace('.json', '');
		const oldPath = join(LIBRARY_DIR, file);
		const newPath = join(GOVERNING_DIR, file);
		const backupPath = join(BACKUP_DIR, file);

		try {
			// Check if already migrated
			if (existsSync(newPath)) {
				console.log(`⏭️  Skipped ${slug} (already exists in governing/)`);
				skippedCount++;
				continue;
			}

			// Read legacy document
			const content = readFileSync(oldPath, 'utf-8');
			const legacy = JSON.parse(content) as LegacyDocument;

			// Check if it's already in new format
			if ('uuid' in legacy && 'content' in legacy) {
				console.log(`⏭️  Skipped ${slug} (already in new format)`);
				skippedCount++;
				continue;
			}

			// Convert to new format
			const newDoc: GoverningDocument = {
				uuid: randomUUID(),
				type: 'governing',
				slug: legacy.slug,
				title: legacy.title,
				owner_uuid: legacy.owner_uuid,
				created_at: legacy.created_at,
				updated_at: legacy.created_at,
				content: {
					status: legacy.status,
					seniority: legacy.seniority,
					articles: legacy.articles,
					adopted_at: legacy.adopted_at ?? undefined,
					adopted_by_motion_uuid: legacy.adopted_by_motion_uuid ?? undefined,
					repealed_at: legacy.repealed_at ?? undefined,
					repealed_by_motion_uuid: legacy.repealed_by_motion_uuid ?? undefined
				}
			};

			// Backup original
			copyFileSync(oldPath, backupPath);

			// Save new format
			writeFileSync(newPath, JSON.stringify(newDoc, null, 2), 'utf-8');

			// Sync to database
			const metadata = JSON.stringify({
				status: newDoc.content.status,
				seniority: newDoc.content.seniority,
				adopted_at: newDoc.content.adopted_at,
				repealed_at: newDoc.content.repealed_at
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
				`governing/${newDoc.slug}.json`,
				metadata
			);

			console.log(`✓ Migrated ${slug}`);
			migratedCount++;
		} catch (err) {
			console.error(`✗ Failed to migrate ${slug}:`, err);
		}
	}

	console.log(`\n📊 Migration Summary:`);
	console.log(`   Migrated: ${migratedCount}`);
	console.log(`   Skipped:  ${skippedCount}`);
	console.log(`   Total:    ${files.length}`);

	if (migratedCount > 0) {
		console.log(`\n✓ Migration complete!`);
		console.log(`  Original files backed up to: ${BACKUP_DIR}`);
		console.log(`  New files written to: ${GOVERNING_DIR}`);
		console.log(`  Database index updated`);
		console.log(`\nYou can safely delete the backup directory once you've verified everything works.`);
	}
}

main();
