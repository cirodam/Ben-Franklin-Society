import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createClient, listClients, getClient, deleteClient, verifyClientSecret } from '$lib/server/infrastructure/oidc/clients.js';

/**
 * Test endpoint for OIDC client CRUD operations
 * GET: List all clients
 * POST: Create a test client and verify operations
 * DELETE: Delete all test clients
 */

export const GET: RequestHandler = async () => {
	const clients = listClients();
	return json({
		count: clients.length,
		clients: clients.map(c => ({
			uuid: c.uuid,
			clientId: c.clientId,
			name: c.name,
			redirectUris: c.redirectUris,
			hasSecret: c.clientSecretHash !== null,
			createdAt: c.createdAt,
			createdBy: c.createdBy,
		}))
	});
};

export const POST: RequestHandler = async () => {
	const results: string[] = [];
	
	// Test 1: Create a client
	results.push('Creating test client...');
	const { clientId, clientSecret } = createClient({
		name: 'Test Client',
		redirectUris: ['http://localhost:5174/oauth/callback'],
		createdBy: 'test-system',
	});
	results.push(`✅ Created client: ${clientId}`);
	
	// Test 2: Retrieve the client
	results.push('Retrieving client...');
	const client = getClient(clientId);
	if (client) {
		results.push(`✅ Retrieved client: ${client.name}`);
	} else {
		results.push('❌ Failed to retrieve client');
		return json({ results }, { status: 500 });
	}
	
	// Test 3: Verify client secret
	results.push('Verifying client secret...');
	const validSecret = verifyClientSecret(clientId, clientSecret);
	const invalidSecret = verifyClientSecret(clientId, 'wrong-secret');
	if (validSecret && !invalidSecret) {
		results.push('✅ Client secret verification works');
	} else {
		results.push('❌ Client secret verification failed');
		return json({ results }, { status: 500 });
	}
	
	// Test 4: List clients
	results.push('Listing all clients...');
	const clients = listClients();
	results.push(`✅ Found ${clients.length} client(s)`);
	
	// Test 5: Delete the client
	results.push('Deleting test client...');
	deleteClient(clientId);
	const deletedClient = getClient(clientId);
	if (deletedClient === null) {
		results.push('✅ Client deleted successfully');
	} else {
		results.push('❌ Failed to delete client');
		return json({ results }, { status: 500 });
	}
	
	return json({
		success: true,
		message: 'All tests passed!',
		results,
	});
};

export const DELETE: RequestHandler = async () => {
	const clients = listClients();
	const testClients = clients.filter(c => c.name.includes('Test'));
	
	for (const client of testClients) {
		deleteClient(client.clientId);
	}
	
	return json({
		deleted: testClients.length,
		message: `Deleted ${testClients.length} test client(s)`,
	});
};
