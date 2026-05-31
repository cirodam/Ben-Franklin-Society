import type { RequestHandler } from './$types.js';
import { json, error } from '@sveltejs/kit';
import { LibraryClient } from '$lib/library-client.js';
import { issueTokens } from '$lib/server/infrastructure/oidc/tokens.js';
import { db } from '$lib/server/db.js';

/**
 * List motion files from user's library bucket
 * 
 * GET /api/library/list-motion-files
 * 
 * Returns list of JSON files from the authenticated user's library bucket
 * that could potentially be motion documents.
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.session) {
		return error(401, 'Not authenticated');
	}

	try {
		// Get the library client ID from database
		const libraryClient = db
			.prepare('SELECT client_id FROM oidc_client WHERE name = ?')
			.get('Library') as { client_id: string } | undefined;
		
		if (!libraryClient) {
			console.error('[list-motion-files] Library OIDC client not registered');
			return error(500, 'Library service not configured');
		}

		// Generate a fresh JWT access token for the library API call
		// This token represents the current user making a server-to-server call
		const tokens = issueTokens({
			personUuid: locals.session.person_uuid,
			sessionUuid: locals.session.uuid,
			actingAsUuid: locals.session.acting_as_uuid,
			clientId: libraryClient.client_id,
			scope: 'openid profile',
		});

		const userUuid = locals.session.person_uuid;
		const bucketKey = `user-${userUuid}`;
		console.log('[list-motion-files] Fetching files for bucket:', bucketKey);

		// Create library client with fresh JWT token
		const client = new LibraryClient(tokens.access_token);
		const allFiles = await client.listFiles(bucketKey);

		// Filter to JSON files only (potential motion documents)
		const motionFiles = allFiles.filter(file => 
			file.mime_type === 'application/json' || 
			file.filename.toLowerCase().endsWith('.json')
		);

		// Sort by most recent first
		motionFiles.sort((a, b) => 
			new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
		);

		return json({
			files: motionFiles.map(file => ({
				id: file.id,
				filename: file.filename,
				path: file.path,
				size_bytes: file.size_bytes,
				uploaded_at: file.uploaded_at
			}))
		});

	} catch (err: any) {
		console.error('Error listing library motion files:', err);
		
		// If bucket doesn't exist (404), return empty array instead of error
		if (err.message?.includes('Not Found') || err.message?.includes('404')) {
			console.log('[list-motion-files] Bucket does not exist yet, returning empty list');
			return json({ files: [] });
		}
		
		return error(500, err.message || 'Failed to list library files');
	}
};
