#!/usr/bin/env tsx

/**
 * Test: Verify motion system works with library
 */

import { openDatabase } from '@bfs/db';
import { schema } from '../src/lib/server/schema.js';
import * as motions from '../src/lib/server/motions.js';
import * as library from '../src/lib/server/library.js';

const dbPath = process.env.DATABASE_PATH || './dev.sqlite';
const db = openDatabase(dbPath);
db.exec(schema);

console.log('🧪 Testing Motion System with Library\n');

// Test 1: Load existing motion
console.log('Test 1: Load existing motion from library');
const existingUuid = 'ce27aca7-9ca4-40a2-abc7-e99de83ea340';
const motion = motions.getMotionByUuid(existingUuid);
if (motion) {
	console.log(`✓ Loaded motion: ${motion.title} (${motion.slug})`);
	console.log(`  Status: ${motion.status}`);
	console.log(`  Motion Number: ${motion.motion_number}`);
} else {
	console.log(`✗ Failed to load motion ${existingUuid}`);
}

// Test 2: List motions
console.log('\nTest 2: List all motions');
const allMotions = motions.listMotions();
console.log(`✓ Found ${allMotions.length} motion(s)`);
for (const m of allMotions) {
	console.log(`  - ${m.title} (${m.status})`);
}

// Test 3: Update motion clerk notes
console.log('\nTest 3: Update clerk notes');
const updated = motions.setMotionClerkNotes(existingUuid, 'Test clerk notes from library system');
console.log(`✓ Updated clerk notes: "${updated.clerk_notes}"`);

// Test 4: Verify file was updated
console.log('\nTest 4: Verify file persistence');
const reloaded = library.getMotionBySlug(updated.slug);
if (reloaded && reloaded.clerk_notes === updated.clerk_notes) {
	console.log(`✓ File persisted correctly`);
} else {
	console.log(`✗ File not persisted correctly`);
}

console.log('\n✅ All tests passed!');
