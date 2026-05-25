import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getAllFederationServers,
	getFederationServer,
	addFederationServer,
	updateFederationServer,
	deleteFederationServer,
	setPrimaryFederationServer,
	updateFederationServerConnectionStatus
} from '$lib/server/federation/servers';
import { registerWithFederation } from '$lib/server/federation/client';
import { getIdentity } from '$lib/server/federation/lineage/identity';
import { randomUUID } from 'crypto';

export const load: PageServerLoad = async () => {
	const servers = getAllFederationServers();
	return { servers };
};

export const actions: Actions = {
	add: async ({ request }) => {
		const formData = await request.formData();
		const url = formData.get('url') as string;
		const handle = formData.get('handle') as string;
		const serviceType = formData.get('service_type') as string;
		const isPrimary = formData.get('is_primary') === 'true';

		if (!url) {
			return fail(400, { error: 'URL is required' });
		}

		try {
			const uuid = randomUUID();
			addFederationServer({ uuid, url, handle: handle || null, serviceType: serviceType || 'registry', isPrimary });

			return { success: true };
		} catch (error) {
			console.error('Failed to add federation server:', error);
			return fail(500, { error: 'Failed to add federation server' });
		}
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const uuid = formData.get('uuid') as string;
		const url = formData.get('url') as string;
		const handle = formData.get('handle') as string;
		const serviceType = formData.get('service_type') as string;

		if (!uuid || !url) {
			return fail(400, { error: 'UUID and URL are required' });
		}

		try {
			updateFederationServer({ uuid, url, handle: handle || null, serviceType });
			return { success: true };
		} catch (error) {
			console.error('Failed to update federation server:', error);
			return fail(500, { error: 'Failed to update federation server' });
		}
	},

	setPrimary: async ({ request }) => {
		const formData = await request.formData();
		const uuid = formData.get('uuid') as string;

		if (!uuid) {
			return fail(400, { error: 'UUID is required' });
		}

		try {
			setPrimaryFederationServer(uuid);
			return { success: true };
		} catch (error) {
			console.error('Failed to set primary server:', error);
			return fail(500, { error: 'Failed to set primary server' });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const uuid = formData.get('uuid') as string;

		if (!uuid) {
			return fail(400, { error: 'UUID is required' });
		}

		try {
			deleteFederationServer(uuid);
			return { success: true };
		} catch (error) {
			console.error('Failed to delete federation server:', error);
			return fail(500, { error: 'Failed to delete federation server' });
		}
	},

	register: async ({ request, url: requestUrl }) => {
		const formData = await request.formData();
		const uuid = formData.get('uuid') as string;

		if (!uuid) {
			return fail(400, { error: 'UUID is required' });
		}

		try {
			// Update status to pending
			updateFederationServerConnectionStatus({ uuid, status: 'pending' });

			// Get the federation server we're registering with
			const server = getFederationServer(uuid);
			if (!server) {
				updateFederationServerConnectionStatus({ uuid, status: 'disconnected' });
				return fail(400, { error: 'Federation server not found' });
			}

			// Get our identity
			const identity = getIdentity();
			if (!identity) {
				updateFederationServerConnectionStatus({ uuid, status: 'disconnected' });
				return fail(400, { error: 'Society identity not initialized' });
			}

			// Get our existing founding record (if any) - proves our lineage
			const foundingRecord = identity.founding_record_json 
				? JSON.parse(identity.founding_record_json)
				: null;

			// Get endpoint (use request origin)
			const endpoint = requestUrl.origin;

			// Register with the specific federation server
			const result = await registerWithFederation({ 
				foundingRecord, 
				endpoint,
				serverUrl: server.url 
			});

			if (result.success) {
				updateFederationServerConnectionStatus({ uuid, status: 'connected' });
				return { success: true };
			} else {
				updateFederationServerConnectionStatus({ uuid, status: 'disconnected' });
				return fail(500, { error: result.error || 'Registration failed' });
			}
		} catch (error) {
			console.error('Failed to register with federation server:', error);
			updateFederationServerConnectionStatus({ uuid, status: 'disconnected' });
			return fail(500, { error: 'Failed to register with federation server' });
		}
	}
};
