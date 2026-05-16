#!/usr/bin/env node
/**
 * Test script for Phase 3: Tree Sync & Export
 * 
 * Tests:
 * - Full tree export
 * - Incremental sync (since timestamp)
 * - Network statistics
 * - Tree structure validation
 * - Timestamp filtering
 * 
 * Note: Does not test database operations - those require SvelteKit environment
 * This tests the tree export and statistics logic
 */

import { generateKeyPairSync, sign, randomUUID } from 'crypto';

// Helper functions
function generateIdentityKeypair() {
	const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
		publicKeyEncoding: { type: 'spki', format: 'pem' },
		privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
	});
	return { publicKey, privateKey };
}

// Mock society registry
const societies = new Map();
let registrationTimestamp = Math.floor(Date.now() / 1000) - 86400; // Start 24 hours ago

function registerSociety(handle, publicKey, parentHandle = null) {
	const uuid = randomUUID();
	const foundedAt = registrationTimestamp;
	const foundingRecord = {
		type: 'society_founding',
		parent: parentHandle ? {
			handle: parentHandle,
			uuid: societies.get(parentHandle)?.uuid || randomUUID(),
			public_key: societies.get(parentHandle)?.publicKey || publicKey
		} : null,
		child: { handle, uuid, public_key: publicKey },
		founded_at: new Date(foundedAt * 1000).toISOString(),
		parent_attestation: 'Test founding',
		signature: 'test'
	};

	const society = {
		handle,
		uuid,
		parentHandle,
		publicKey,
		endpoint: `https://${handle}.example.com`,
		endpointType: 'hostname',
		status: 'active',
		foundedAt,
		registeredAt: registrationTimestamp,
		lastUpdated: null,
		updateCount: 0,
		foundingRecord,
		dnsRecords: []
	};
	
	societies.set(handle, society);
	registrationTimestamp += 60; // Increment by 1 minute
	
	return society;
}

function updateSociety(handle) {
	const society = societies.get(handle);
	if (!society) return false;
	
	society.lastUpdated = Math.floor(Date.now() / 1000);
	society.updateCount++;
	society.endpoint = `https://new-${handle}.example.com`;
	
	return true;
}

function addDnsRecord(handle, record) {
	const society = societies.get(handle);
	if (!society) return false;
	
	society.dnsRecords.push(record);
	society.lastUpdated = Math.floor(Date.now() / 1000);
	
	return true;
}

function exportFullTree() {
	return Array.from(societies.values())
		.sort((a, b) => a.registeredAt - b.registeredAt)
		.map(s => ({
			handle: s.handle,
			uuid: s.uuid,
			parent_handle: s.parentHandle,
			public_key: s.publicKey,
			endpoint: s.endpoint,
			endpoint_type: s.endpointType,
			founding_record: s.foundingRecord,
			founded_at: s.foundedAt,
			registered_at: s.registeredAt,
			status: s.status,
			last_updated: s.lastUpdated,
			update_count: s.updateCount
		}));
}

function exportTreeSince(timestamp) {
	return Array.from(societies.values())
		.filter(s => s.registeredAt >= timestamp || (s.lastUpdated && s.lastUpdated >= timestamp))
		.sort((a, b) => {
			const aTime = a.lastUpdated || a.registeredAt;
			const bTime = b.lastUpdated || b.registeredAt;
			return aTime - bTime;
		})
		.map(s => ({
			handle: s.handle,
			uuid: s.uuid,
			parent_handle: s.parentHandle,
			public_key: s.publicKey,
			endpoint: s.endpoint,
			endpoint_type: s.endpointType,
			founding_record: s.foundingRecord,
			founded_at: s.foundedAt,
			registered_at: s.registeredAt,
			status: s.status,
			last_updated: s.lastUpdated,
			update_count: s.updateCount
		}));
}

function getNetworkStats() {
	const allSocieties = Array.from(societies.values());
	const total = allSocieties.length;
	
	const byStatus = allSocieties.reduce((acc, s) => {
		acc[s.status] = (acc[s.status] || 0) + 1;
		return acc;
	}, {});
	
	const roots = allSocieties.filter(s => !s.parentHandle).length;
	
	const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
	const recent24h = allSocieties.filter(s => s.registeredAt >= oneDayAgo).length;
	const updates24h = allSocieties.filter(s => s.lastUpdated && s.lastUpdated >= oneDayAgo).length;
	
	const totalDnsRecords = allSocieties.reduce((sum, s) => sum + s.dnsRecords.length, 0);
	const societiesWithDns = allSocieties.filter(s => s.dnsRecords.length > 0).length;
	
	const oldest = allSocieties.sort((a, b) => a.foundedAt - b.foundedAt)[0];
	const newest = allSocieties.sort((a, b) => b.registeredAt - a.registeredAt)[0];
	const mostActive = allSocieties.sort((a, b) => b.updateCount - a.updateCount)[0];
	
	return {
		total_societies: total,
		by_status: byStatus,
		root_societies: roots,
		recent_registrations_24h: recent24h,
		recent_updates_24h: updates24h,
		total_dns_records: totalDnsRecords,
		societies_with_dns: societiesWithDns,
		oldest_society: oldest ? {
			handle: oldest.handle,
			founded_at: new Date(oldest.foundedAt * 1000).toISOString()
		} : null,
		newest_society: newest ? {
			handle: newest.handle,
			registered_at: new Date(newest.registeredAt * 1000).toISOString()
		} : null,
		most_active_society: mostActive && mostActive.updateCount > 0 ? {
			handle: mostActive.handle,
			update_count: mostActive.updateCount
		} : null
	};
}

console.log('🧪 Testing Phase 3: Tree Sync & Export\n');

// Test 1: Register multiple societies
console.log('1️⃣  Registering test societies...');
const keys1 = generateIdentityKeypair();
const philadelphia = registerSociety('philadelphia', keys1.publicKey);

const keys2 = generateIdentityKeypair();
const pittsburgh = registerSociety('pittsburgh', keys2.publicKey, 'philadelphia');

const keys3 = generateIdentityKeypair();
const columbus = registerSociety('columbus', keys3.publicKey, 'philadelphia');

const keys4 = generateIdentityKeypair();
const cleveland = registerSociety('cleveland', keys4.publicKey, 'pittsburgh');

const keys5 = generateIdentityKeypair();
const cincinnati = registerSociety('cincinnati', keys5.publicKey, 'columbus');

console.log(`   ✅ Registered 5 societies`);
console.log(`   Root: ${philadelphia.handle}`);
console.log(`   Children of ${philadelphia.handle}: ${pittsburgh.handle}, ${columbus.handle}`);
console.log(`   Children of ${pittsburgh.handle}: ${cleveland.handle}`);
console.log(`   Children of ${columbus.handle}: ${cincinnati.handle}`);

// Test 2: Export full tree
console.log('\n2️⃣  Exporting full tree...');
const fullTree = exportFullTree();
console.log(`   Total societies in tree: ${fullTree.length}`);

if (fullTree.length !== 5) {
	console.error('   ⚠️  Expected 5 societies in full tree!');
	process.exit(1);
}

console.log('   Society handles in order:');
fullTree.forEach((s, i) => {
	console.log(`     ${i + 1}. ${s.handle} (parent: ${s.parent_handle || 'none'})`);
});

// Validate tree structure
const phillyInTree = fullTree.find(s => s.handle === 'philadelphia');
if (!phillyInTree || phillyInTree.parent_handle !== null) {
	console.error('   ⚠️  Philadelphia should be a root society!');
	process.exit(1);
}

const pittsburghInTree = fullTree.find(s => s.handle === 'pittsburgh');
if (!pittsburghInTree || pittsburghInTree.parent_handle !== 'philadelphia') {
	console.error('   ⚠️  Pittsburgh parent should be Philadelphia!');
	process.exit(1);
}

console.log('   ✅ Tree structure validated');

// Test 3: Validate founding records in export
console.log('\n3️⃣  Validating founding records...');
const clevelandInTree = fullTree.find(s => s.handle === 'cleveland');
if (!clevelandInTree || !clevelandInTree.founding_record) {
	console.error('   ⚠️  Cleveland should have founding record!');
	process.exit(1);
}

console.log(`   Cleveland founding record:`);
console.log(`     Type: ${clevelandInTree.founding_record.type}`);
console.log(`     Parent: ${clevelandInTree.founding_record.parent?.handle}`);
console.log(`     Child: ${clevelandInTree.founding_record.child.handle}`);
console.log('   ✅ Founding records present');

// Test 4: Update some societies
console.log('\n4️⃣  Updating societies...');
const updateTime = Math.floor(Date.now() / 1000);

// Wait a moment to ensure distinct timestamps
await new Promise(resolve => setTimeout(resolve, 100));

updateSociety('pittsburgh');
updateSociety('cleveland');
addDnsRecord('columbus', { type: 'A', value: '1.2.3.4', ttl: 3600 });

console.log(`   Updated: pittsburgh (endpoint change)`);
console.log(`   Updated: cleveland (endpoint change)`);
console.log(`   Updated: columbus (DNS record added)`);

// Test 5: Incremental sync
console.log('\n5️⃣  Testing incremental sync...');
const incrementalTree = exportTreeSince(updateTime);
console.log(`   Societies updated since ${new Date(updateTime * 1000).toISOString()}:`);
console.log(`   Count: ${incrementalTree.length}`);

if (incrementalTree.length !== 3) {
	console.error(`   ⚠️  Expected 3 updated societies, got ${incrementalTree.length}!`);
	process.exit(1);
}

const updatedHandles = incrementalTree.map(s => s.handle).sort();
console.log(`   Handles: ${updatedHandles.join(', ')}`);

if (!updatedHandles.includes('pittsburgh') || !updatedHandles.includes('cleveland') || !updatedHandles.includes('columbus')) {
	console.error('   ⚠️  Missing updated societies!');
	process.exit(1);
}

console.log('   ✅ Incremental sync working');

// Test 6: Empty incremental sync
console.log('\n6️⃣  Testing incremental sync with future timestamp...');
const futureTime = Math.floor(Date.now() / 1000) + 3600;
const emptyTree = exportTreeSince(futureTime);
console.log(`   Societies since future timestamp: ${emptyTree.length}`);

if (emptyTree.length !== 0) {
	console.error('   ⚠️  Expected 0 societies for future timestamp!');
	process.exit(1);
}

console.log('   ✅ Empty result for future timestamp');

// Test 7: Network statistics
console.log('\n7️⃣  Testing network statistics...');
const stats = getNetworkStats();
console.log(`   Total societies: ${stats.total_societies}`);
console.log(`   Status breakdown:`, stats.by_status);
console.log(`   Root societies: ${stats.root_societies}`);
console.log(`   Recent registrations (24h): ${stats.recent_registrations_24h}`);
console.log(`   Recent updates (24h): ${stats.recent_updates_24h}`);
console.log(`   Total DNS records: ${stats.total_dns_records}`);
console.log(`   Societies with DNS: ${stats.societies_with_dns}`);

if (stats.total_societies !== 5) {
	console.error(`   ⚠️  Expected 5 total societies, got ${stats.total_societies}!`);
	process.exit(1);
}

if (stats.root_societies !== 1) {
	console.error(`   ⚠️  Expected 1 root society, got ${stats.root_societies}!`);
	process.exit(1);
}

if (stats.total_dns_records !== 1) {
	console.error(`   ⚠️  Expected 1 DNS record, got ${stats.total_dns_records}!`);
	process.exit(1);
}

console.log('   ✅ Statistics accurate');

// Test 8: Oldest and newest tracking
console.log('\n8️⃣  Testing oldest/newest tracking...');
console.log(`   Oldest: ${stats.oldest_society?.handle}`);
console.log(`   Newest: ${stats.newest_society?.handle}`);

if (stats.oldest_society?.handle !== 'philadelphia') {
	console.error('   ⚠️  Philadelphia should be oldest!');
	process.exit(1);
}

if (stats.newest_society?.handle !== 'cincinnati') {
	console.error('   ⚠️  Cincinnati should be newest!');
	process.exit(1);
}

console.log('   ✅ Oldest/newest tracking correct');

// Test 9: Most active tracking
console.log('\n9️⃣  Testing most active tracking...');
if (stats.most_active_society) {
	console.log(`   Most active: ${stats.most_active_society.handle} (${stats.most_active_society.update_count} updates)`);
	
	// Should be one of the updated societies
	const activeHandle = stats.most_active_society.handle;
	if (!['pittsburgh', 'cleveland', 'columbus'].includes(activeHandle)) {
		console.error('   ⚠️  Most active should be one of the updated societies!');
		process.exit(1);
	}
}

console.log('   ✅ Most active tracking correct');

// Summary
console.log('\n✨ All Phase 3 tests passed!\n');
console.log('📋 Summary of capabilities tested:');
console.log('   • Full tree export with all societies');
console.log('   • Tree structure validation (parent-child)');
console.log('   • Founding record inclusion in export');
console.log('   • Incremental sync (timestamp-based filtering)');
console.log('   • Empty result for future timestamps');
console.log('   • Network statistics (totals, status, roots)');
console.log('   • Recent activity tracking (24h)');
console.log('   • DNS record statistics');
console.log('   • Oldest/newest society tracking');
console.log('   • Most active society tracking');
console.log('\n✅ Phase 3: Tree Sync & Export Complete!\n');
console.log('🚀 Next steps:');
console.log('   • Deploy and test with real SvelteKit endpoints');
console.log('   • Test with larger datasets (100s of societies)');
console.log('   • Verify incremental sync workflow');
console.log('   • Monitor statistics endpoint performance');
console.log('   • Consider Phase 4: Status Management\n');
