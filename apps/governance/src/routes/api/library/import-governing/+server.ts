import type { RequestHandler } from './$types.js';
import { json, error } from '@sveltejs/kit';
import { LibraryClient, downloadFileAsBuffer } from '$lib/library-client.js';
import type { GoverningDocument } from '@bfs/types';
import { saveGoverningDocument } from '$lib/server/documents/society-governing.js';
import { getSocietyUuid } from '$lib/server/documents/society-core.js';
import { randomUUID } from 'node:crypto';
import { issueTokens } from '$lib/server/infrastructure/oidc.js';
import { db } from '$lib/server/db.js';

/**
 * Import a governing document from the Library app into Governance
 * 
 * POST /api/library/import-governing
 * Body: { library_file_id: number }
 * 
 * Process:
 * 1. Download file from library using LibraryClient
 * 2. Parse and validate JSON structure
 * 3. Copy to governance's /data/society-code/ storage
 * 4. Create governing document record in governance database
 * 5. Return document UUID
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.session) {
		return error(401, 'Not authenticated');
	}

	try {
		const body = await request.json();
		const libraryFileId = body.library_file_id;

		if (!libraryFileId || typeof libraryFileId !== 'number') {
			return error(400, 'Missing or invalid library_file_id');
		}

		// Get the library client ID from database
		const libraryClient = db
			.prepare('SELECT client_id FROM oidc_client WHERE name = ?')
			.get('Library') as { client_id: string } | undefined;
		
		if (!libraryClient) {
			console.error('[import-governing] Library OIDC client not registered');
			return error(500, 'Library service not configured');
		}

		// Generate a fresh JWT access token for the library API call
		const tokens = issueTokens({
			personUuid: locals.session.person_uuid,
			sessionUuid: locals.session.uuid,
			actingAsUuid: locals.session.acting_as_uuid,
			clientId: libraryClient.client_id,
			scope: 'openid profile',
		});

		// Download file from library
		const { buffer, contentType, filename } = await downloadFileAsBuffer(
			tokens.access_token,
			libraryFileId
		);

		// Validate it's a JSON file
		if (contentType !== 'application/json' && !filename.endsWith('.json')) {
			return error(400, 'File must be a JSON document');
		}

		// Parse JSON
		let document: unknown;
		try {
			document = JSON.parse(buffer.toString('utf-8'));
		} catch (parseError) {
			return error(400, 'Invalid JSON format');
		}

		// Validate it's a GoverningDocument
		if (!isGoverningDocument(document)) {
			return error(400, 'Document is not a valid GoverningDocument');
		}

		// Get society UUID
		const societyUuid = getSocietyUuid();
		
		if (!societyUuid) {
			return error(500, 'Society not configured');
		}

		// Create a new governing document in governance's society-code storage
		// Generate new UUID for the governance copy (independent from library)
		const governanceDoc: GoverningDocument = {
			...document,
			uuid: randomUUID(),
			// Set owner to the society (governing documents are owned by society)
			owner_uuid: societyUuid,
			// Track the original library file
			source_library_file_id: libraryFileId,
			// Reset timestamps for governance copy
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			// Ensure status is valid for governance (start as draft)
			content: {
				...document.content,
				status: 'draft'
			}
		};

		// Save to governance storage
		await saveGoverningDocument(governanceDoc);

		return json({
			success: true,
			document_uuid: governanceDoc.uuid,
			slug: governanceDoc.slug,
			title: governanceDoc.title
		});

	} catch (err: any) {
		console.error('Error importing governing document from library:', err);
		return error(500, err.message || 'Failed to import governing document');
	}
};

/**
 * Type guard to validate GoverningDocument structure
 */
function isGoverningDocument(doc: unknown): doc is GoverningDocument {
	if (!doc || typeof doc !== 'object') return false;
	
	const d = doc as any;
	
	// Check required top-level fields
	if (typeof d.uuid !== 'string') return false;
	if (d.type !== 'governing') return false;
	if (typeof d.slug !== 'string') return false;
	if (typeof d.title !== 'string') return false;
	if (typeof d.owner_uuid !== 'string') return false;
	if (typeof d.created_at !== 'string') return false;
	if (typeof d.updated_at !== 'string') return false;
	
	// Check content structure
	if (!d.content || typeof d.content !== 'object') return false;
	if (typeof d.content.status !== 'string') return false;
	if (!Array.isArray(d.content.articles)) return false;
	
	// Validate status is valid GoverningDocumentStatus
	const validStatuses = ['draft', 'enacted', 'repealed', 'sunsetted'];
	if (!validStatuses.includes(d.content.status)) return false;
	
	return true;
}
