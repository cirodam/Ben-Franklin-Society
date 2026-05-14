#!/usr/bin/env node
// Migration script to set governing_document_slug for existing associations
// Run this after pnpm reset to link associations with their founding documents
// Usage: DATABASE_PATH=./dev.sqlite node scripts/set-governing-documents.mjs

import { openDatabase } from '@bfs/db';

const dbPath = process.env.DATABASE_PATH ?? './dev.sqlite';
const db = openDatabase(dbPath);

// Map of association handles to their governing document slugs
const documentMappings = [
	// Committees
	{ handle: 'agricultural-committee', slug: 'committee-rules' },
	{ handle: 'food-committee', slug: 'committee-rules' },
	
	// Colleges
	{ handle: 'agricultural-college', slug: 'college-of-fabricators' }, // Example - update with actual slug when created
	{ handle: 'culinary-arts', slug: null }, // No document yet
	
	// Services
	{ handle: 'food-service', slug: null }, // No document yet
	{ handle: 'agricultural-service', slug: null }, // No document yet
	{ handle: 'energy-service', slug: null }, // No document yet
	{ handle: 'communications-service', slug: null }, // No document yet
	{ handle: 'commerce-service', slug: null }, // No document yet
	
	// Example: When you create a document for the manufacturing service
	// { handle: 'manufacturing-service', slug: 'manufacturing-service' },
	
	// Example: When you create a document for College of Fabricators
	// { handle: 'fabricators', slug: 'college-of-fabricators' },
];

const updateStmt = db.prepare(
	'UPDATE association SET governing_document_slug = ? WHERE handle = ?'
);

let updated = 0;
for (const mapping of documentMappings) {
	const result = updateStmt.run(mapping.slug, mapping.handle);
	if (result.changes > 0) {
		const action = mapping.slug ? `set to '${mapping.slug}'` : 'cleared';
		console.log(`✓ ${mapping.handle}: ${action}`);
		updated++;
	} else {
		console.log(`⚠ ${mapping.handle}: not found`);
	}
}

console.log(`\n${updated} associations updated.`);
console.log('\nTo set governing documents for specific associations:');
console.log('  UPDATE association SET governing_document_slug = \'document-slug\' WHERE handle = \'association-handle\';');
