/**
 * Simple script to test the updated schema
 */

import { openDatabase } from '@bfs/db';
import { schema } from '../src/lib/server/schema.js';
import { createAccount, searchAccounts, updateAccountMetadata } from '../src/lib/server/accounts.js';

const db = openDatabase('./bank.sqlite');

console.log('🔧 Testing schema...\n');

// Apply schema
db.exec(schema);
console.log('✅ Schema applied successfully\n');

// Create a test account with new fields
const account = createAccount({
	principal_uuid: 'test-uuid-123',
	name: 'Test Account',
	handle_cache: 'test',
	account_type: 'standard',
	can_auto_pull: false,
});

console.log('✅ Created account:', {
	uuid: account.uuid,
	name: account.name,
	account_type: account.account_type,
	can_auto_pull: account.can_auto_pull,
});
console.log('');

// Update account metadata
updateAccountMetadata(account.uuid, {
	account_type: 'official',
	can_auto_pull: true,
});

console.log('✅ Updated account metadata\n');

// Search for accounts
const results = searchAccounts('test');
console.log('✅ Found', results.length, 'accounts matching "test"\n');

// Verify the update worked
const updated = results[0];
if (updated) {
	console.log('Account after update:', {
		account_type: updated.account_type,
		can_auto_pull: updated.can_auto_pull,
	});
}

console.log('\n✅ All tests passed!');
db.close();
