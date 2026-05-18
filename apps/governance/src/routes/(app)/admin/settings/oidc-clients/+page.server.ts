import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { listClients, createClient, deleteClient } from '$lib/server/infrastructure/oidc.js';
import { hasPermission, PERMISSIONS } from '$lib/server/infrastructure/permissions.js';

export const load: PageServerLoad = async ({ locals }) => {
	const actingAs = locals.session?.acting_as_uuid ?? null;
	const canManage = actingAs ? hasPermission(actingAs, PERMISSIONS.GOVERNANCE_ADMIN) : false;

	if (!canManage) {
		redirect(302, '/');
	}

	const clients = listClients();
	
	// Check which special clients already exist
	const hasCommunityBank = clients.some(c => c.clientId === 'community-bank');
	const hasMail = clients.some(c => c.clientId === 'mail');
	const hasMarketplace = clients.some(c => c.clientId === 'marketplace');

	return {
		clients,
		hasCommunityBank,
		hasMail,
		hasMarketplace,
	};
};

export const actions: Actions = {
	createCommunityBank: async ({ locals }) => {
		const actingAs = locals.session?.acting_as_uuid ?? null;
		if (!actingAs || !hasPermission(actingAs, PERMISSIONS.GOVERNANCE_ADMIN)) {
			return fail(403, { error: 'Permission denied' });
		}

		try {
			const { clientId, clientSecret } = createClient({
				name: 'Community Bank',
				redirectUris: ['http://localhost:5174/oauth/callback'],
				createdBy: locals.session!.person_uuid,
				clientId: 'community-bank',
			});

			return {
				success: true,
				clientId,
				clientSecret,
				message: 'Community Bank client created successfully',
			};
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to create client' });
		}
	},

	createMail: async ({ locals }) => {
		const actingAs = locals.session?.acting_as_uuid ?? null;
		if (!actingAs || !hasPermission(actingAs, PERMISSIONS.GOVERNANCE_ADMIN)) {
			return fail(403, { error: 'Permission denied' });
		}

		try {
			const { clientId, clientSecret } = createClient({
				name: 'Mail',
				redirectUris: ['http://localhost:5175/oauth/callback'],
				createdBy: locals.session!.person_uuid,
				clientId: 'mail',
			});

			return {
				success: true,
				clientId,
				clientSecret,
				message: 'Mail client created successfully',
			};
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to create client' });
		}
	},

	createMarketplace: async ({ locals }) => {
		const actingAs = locals.session?.acting_as_uuid ?? null;
		if (!actingAs || !hasPermission(actingAs, PERMISSIONS.GOVERNANCE_ADMIN)) {
			return fail(403, { error: 'Permission denied' });
		}

		try {
			const { clientId, clientSecret } = createClient({
				name: 'Marketplace',
				redirectUris: ['http://localhost:5176/oauth/callback'],
				createdBy: locals.session!.person_uuid,
				clientId: 'marketplace',
			});

			return {
				success: true,
				clientId,
				clientSecret,
				message: 'Marketplace client created successfully',
			};
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to create client' });
		}
	},

	create: async ({ request, locals }) => {
		const actingAs = locals.session?.acting_as_uuid ?? null;
		if (!actingAs || !hasPermission(actingAs, PERMISSIONS.GOVERNANCE_ADMIN)) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const name = data.get('name');
		const redirectUris = data.get('redirect_uris');

		if (typeof name !== 'string' || !name.trim()) {
			return fail(400, { error: 'Client name is required' });
		}

		if (typeof redirectUris !== 'string' || !redirectUris.trim()) {
			return fail(400, { error: 'At least one redirect URI is required' });
		}

		// Parse redirect URIs (one per line)
		const uris = redirectUris
			.split('\n')
			.map(u => u.trim())
			.filter(u => u.length > 0);

		if (uris.length === 0) {
			return fail(400, { error: 'At least one redirect URI is required' });
		}

		// Validate URIs
		for (const uri of uris) {
			try {
				new URL(uri);
			} catch {
				return fail(400, { error: `Invalid URI: ${uri}` });
			}
		}

		const { clientId, clientSecret } = createClient({
			name: name.trim(),
			redirectUris: uris,
			createdBy: locals.session!.person_uuid,
		});

		return {
			success: true,
			clientId,
			clientSecret,
			message: 'OIDC client created successfully. Save the client secret - it cannot be retrieved later!',
		};
	},

	delete: async ({ request, locals }) => {
		const actingAs = locals.session?.acting_as_uuid ?? null;
		if (!actingAs || !hasPermission(actingAs, PERMISSIONS.GOVERNANCE_ADMIN)) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const clientId = data.get('client_id');

		if (typeof clientId !== 'string') {
			return fail(400, { error: 'Invalid client ID' });
		}

		deleteClient(clientId);

		return {
			success: true,
			message: 'Client deleted successfully',
		};
	},
};
