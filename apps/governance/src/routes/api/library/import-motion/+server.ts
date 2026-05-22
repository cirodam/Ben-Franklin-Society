import type { RequestHandler } from './$types.js';
import { json, error } from '@sveltejs/kit';
import { LibraryClient, downloadFileAsBuffer } from '$lib/library-client.js';
import type { MotionDocument } from '@bfs/types';
import { saveMotion } from '$lib/server/documents/society-motions.js';
import { randomUUID } from 'node:crypto';

/**
 * Import a motion from the Library app into Governance
 * 
 * POST /api/library/import-motion
 * Body: { library_file_id: number }
 * 
 * Process:
 * 1. Download file from library using LibraryClient
 * 2. Parse and validate JSON structure
 * 3. Copy to governance's /data/society-code/ storage
 * 4. Create motion record in governance database
 * 5. Return motion UUID
 */
export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	if (!locals.session) {
		return error(401, 'Not authenticated');
	}

	try {
		const body = await request.json();
		const libraryFileId = body.library_file_id;

		if (!libraryFileId || typeof libraryFileId !== 'number') {
			return error(400, 'Missing or invalid library_file_id');
		}

		// Get JWT token from session
		// The oidc_session cookie contains the JWT
		const oidcSession = cookies.get('oidc_session');
		if (!oidcSession) {
			return error(401, 'No OIDC session found');
		}

		// Download file from library
		const { buffer, contentType, filename } = await downloadFileAsBuffer(
			oidcSession,
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

		// Validate it's a MotionDocument
		if (!isMotionDocument(document)) {
			return error(400, 'Document is not a valid MotionDocument');
		}

		// Create a new motion in governance's society-code storage
		// Generate new UUID for the governance copy (independent from library)
		const governanceMotion: MotionDocument = {
			...document,
			uuid: randomUUID(),
			// Track the original library file
			source_library_file_id: libraryFileId,
			// Reset timestamps for governance copy
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			// Ensure status is valid for governance
			content: {
				...document.content,
				status: 'draft' // Start as draft in governance
			}
		};

		// Save to governance storage
		await saveMotion(governanceMotion);

		return json({
			success: true,
			motion_uuid: governanceMotion.uuid,
			slug: governanceMotion.slug,
			title: governanceMotion.title
		});

	} catch (err: any) {
		console.error('Error importing motion from library:', err);
		return error(500, err.message || 'Failed to import motion');
	}
};

/**
 * Type guard to validate MotionDocument structure
 */
function isMotionDocument(doc: unknown): doc is MotionDocument {
	if (!doc || typeof doc !== 'object') return false;
	
	const d = doc as any;
	
	// Check required top-level fields
	if (typeof d.uuid !== 'string') return false;
	if (d.type !== 'motion') return false;
	if (typeof d.slug !== 'string') return false;
	if (typeof d.title !== 'string') return false;
	if (typeof d.owner_uuid !== 'string') return false;
	if (typeof d.created_at !== 'string') return false;
	if (typeof d.updated_at !== 'string') return false;
	
	// Check content structure
	if (!d.content || typeof d.content !== 'object') return false;
	if (typeof d.content.status !== 'string') return false;
	if (!Array.isArray(d.content.provisions)) return false;
	
	// Validate status is valid MotionStatus
	const validStatuses = ['draft', 'introduced', 'deliberation', 'voting', 'adopted', 'enacted', 'rejected', 'withdrawn'];
	if (!validStatuses.includes(d.content.status)) return false;
	
	return true;
}
