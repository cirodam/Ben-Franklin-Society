import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { updateSection, addSection, deleteSection, updateArticle, addArticle, deleteArticle } from '$lib/server/documents/society-docs.js';
import { loadMotion } from '$lib/server/documents/society-motions.js';
import { loadGoverningDocument } from '$lib/server/documents/society-governing.js';
import { hasPermission, PERMISSIONS } from '$lib/server/infrastructure/permissions.js';
import { 
	getGoverningStatusFromPath, 
	SOCIETY_CODE_FOLDERS, 
	getAllBodySlugs, 
	getMotionFolder, 
	MOTION_STATUSES,
	moveGoverningDocument,
	moveMotion
} from '$lib/server/documents/society-core.js';
import { db } from '$lib/server/db.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const load: PageServerLoad = async ({ params, locals }) => {
	// Try to load as governing document first (search all status folders)
	const governingDoc = loadGoverningDocument(params.slug);
	
	// Get list of active members for owner change dropdown
	const members = db
		.prepare(`
			SELECT uuid, given_name || ' ' || family_name as name 
			FROM person 
			WHERE status = 'active'
			ORDER BY family_name, given_name
		`)
		.all() as Array<{ uuid: string; name: string }>;

	if (governingDoc) {
		// Determine status from folder location by checking which folder contains the file
		let docStatus: keyof typeof SOCIETY_CODE_FOLDERS = 'inbox';
		for (const [status, folder] of Object.entries(SOCIETY_CODE_FOLDERS)) {
			const filePath = join(folder, `${params.slug}.json`);
			if (existsSync(filePath)) {
				docStatus = status as keyof typeof SOCIETY_CODE_FOLDERS;
				break;
			}
		}

		const canEdit = docStatus === 'inbox' && hasPermission(locals.person?.uuid, PERMISSIONS.LIBRARY_EDIT);
		const canChangeOwner = hasPermission(locals.person?.uuid, PERMISSIONS.LIBRARY_EDIT);
		
		return { 
			document: governingDoc, 
			canEdit, 
			canChangeOwner, 
			members, 
			documentType: 'governing',
			status: docStatus
		};
	}

	// Try to load as motion (search all bodies/statuses)
	const motionDoc = loadMotion(params.slug);
	if (motionDoc) {
		// Find the body and status by checking which folder contains the file
		let motionBody: string | null = null;
		let motionStatus: typeof MOTION_STATUSES[number] | null = null;

		const bodies = getAllBodySlugs();
		for (const body of bodies) {
			for (const status of MOTION_STATUSES) {
				const filePath = join(getMotionFolder(body, status), `${params.slug}.json`);
				if (existsSync(filePath)) {
					motionBody = body;
					motionStatus = status;
					break;
				}
			}
			if (motionBody) break;
		}

		// Motions can only be edited in inbox status by their introducer
		const canEdit = motionStatus === 'inbox' && locals.person?.uuid === motionDoc.content.introducer_uuid;
		const canChangeOwner = locals.person?.uuid === motionDoc.owner_uuid || hasPermission(locals.person?.uuid, PERMISSIONS.LIBRARY_EDIT);
		
		return { 
			document: motionDoc, 
			canEdit, 
			canChangeOwner, 
			members, 
			documentType: 'motion',
			bodySlug: motionBody,
			status: motionStatus
		};
	}

	error(404, 'Document not found');
};

export const actions: Actions = {
	updateSection: async ({ params, request, locals }) => {
		if (!hasPermission(locals.person.uuid, PERMISSIONS.LIBRARY_EDIT)) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);
		const sectionIdx = parseInt(data.get('sectionIdx') as string);
		const title = data.get('title') as string;
		const body = data.get('body') as string;
		const rationale = data.get('rationale') as string;

		if (!title || !body) {
			return fail(400, { error: 'Title and body are required' });
		}

		try {
			updateSection(params.slug, articleIdx, sectionIdx, {
				title,
				body,
				rationale: rationale || undefined
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	addSection: async ({ params, request, locals }) => {
		if (!hasPermission(locals.person.uuid, PERMISSIONS.LIBRARY_EDIT)) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);
		const title = data.get('title') as string || 'New Section';
		const body = data.get('body') as string || 'Section content...';
		const rationale = data.get('rationale') as string;

		try {
			const doc = await loadGoverningDocument(params.slug);
			const newSectionIdx = doc.content.articles[articleIdx].sections.length;
			
			addSection(params.slug, articleIdx, {
				title,
				body,
				rationale: rationale || undefined
			});
			return { success: true, articleIdx, newSectionIdx };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	deleteSection: async ({ params, request, locals }) => {
		if (!hasPermission(locals.person.uuid, PERMISSIONS.LIBRARY_EDIT)) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);
		const sectionIdx = parseInt(data.get('sectionIdx') as string);

		try {
			deleteSection(params.slug, articleIdx, sectionIdx);
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	updateArticle: async ({ params, request, locals }) => {
		if (!hasPermission(locals.person.uuid, PERMISSIONS.LIBRARY_EDIT)) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);
		const number = data.get('number') as string;
		const title = data.get('title') as string;

		if (!number || !title) {
			return fail(400, { error: 'Number and title are required' });
		}

		try {
			updateArticle(params.slug, articleIdx, { number, title });
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	addArticle: async ({ params, request, locals }) => {
		if (!hasPermission(locals.person.uuid, PERMISSIONS.LIBRARY_EDIT)) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const number = data.get('number') as string || 'I';
		const title = data.get('title') as string || 'New Article';

		try {
			const doc = await loadGoverningDocument(params.slug);
			const newArticleIdx = doc.content.articles.length;
			
			addArticle(params.slug, {
				number,
				title,
				sections: []
			});
			return { success: true, newArticleIdx };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	deleteArticle: async ({ params, request, locals }) => {
		if (!hasPermission(locals.person.uuid, PERMISSIONS.LIBRARY_EDIT)) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);

		try {
			deleteArticle(params.slug, articleIdx);
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	updateMotion: async ({ params, request, locals }) => {
		const data = await request.formData();
		
		// Get the motion to check permissions
		const motion = loadMotion(params.slug);
		if (!motion) {
			return fail(404, { error: 'Motion not found' });
		}

		// Check permissions: must be owner/introducer and motion must be in draft
		const canEdit = motion.content.status === 'draft' && locals.person?.uuid === motion.content.introducer_uuid;
		if (!canEdit) {
			return fail(403, { error: 'Permission denied' });
		}

		// Parse provisions and notes from form data
		const provisionsJson = data.get('provisions') as string;
		const clerkNotes = data.get('clerk_notes') as string;
		const parliamentarianNotes = data.get('parliamentarian_notes') as string;
		
		try {
			const provisions = JSON.parse(provisionsJson);
			updateMotion(params.slug, {
				provisions,
				clerk_notes: clerkNotes || undefined,
				parliamentarian_notes: parliamentarianNotes || undefined,
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	updateDocument: async ({ params, request, locals }) => {
		const data = await request.formData();
		const documentJson = data.get('document') as string;
		
		if (!documentJson) {
			return fail(400, { error: 'Document data is required' });
		}

		try {
			const document = JSON.parse(documentJson);
			
			// Check document type and permissions
			const item = db
				.prepare('SELECT type FROM library_item WHERE slug = ?')
				.get(params.slug) as { type: string } | undefined;

			if (!item) {
				return fail(404, { error: 'Document not found' });
			}

			if (item.type === 'motion') {
				// Check motion permissions
				const canEdit = document.content.status === 'draft' && 
					locals.person?.uuid === document.content.introducer_uuid;
				
				if (!canEdit) {
					return fail(403, { error: 'Permission denied' });
				}

				const { saveMotion } = await import('$lib/server/documents/society-motions.js');
				saveMotion(document);
			} else if (item.type === 'governing') {
				// Check governing doc permissions
				if (!hasPermission(locals.person.uuid, PERMISSIONS.LIBRARY_EDIT)) {
					return fail(403, { error: 'Permission denied' });
				}

				const { saveGoverningDocument } = await import('$lib/server/documents/society-governing.js');
				saveGoverningDocument(document);
			} else {
				return fail(400, { error: 'Document type not supported for updates' });
			}

			return { success: true };
		} catch (err) {
			console.error('Error updating document:', err);
			return fail(500, { error: (err as Error).message });
		}
	},

	moveDocument: async ({ params, request, locals }) => {
		// Check if user is authenticated
		if (!locals.person) {
			return fail(401, { error: 'Authentication required' });
		}

		if (!hasPermission(locals.person.uuid, PERMISSIONS.LIBRARY_EDIT)) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const toStatus = data.get('toStatus') as string;
		const documentType = data.get('documentType') as string;

		if (!toStatus) {
			return fail(400, { error: 'Target status is required' });
		}

		try {
			if (documentType === 'governing') {
				// Find current status
				let fromStatus: keyof typeof SOCIETY_CODE_FOLDERS | null = null;
				for (const [status, folder] of Object.entries(SOCIETY_CODE_FOLDERS)) {
					const filePath = join(folder, `${params.slug}.json`);
					if (existsSync(filePath)) {
						fromStatus = status as keyof typeof SOCIETY_CODE_FOLDERS;
						break;
					}
				}

				if (!fromStatus) {
					return fail(404, { error: 'Document not found' });
				}

				if (!Object.keys(SOCIETY_CODE_FOLDERS).includes(toStatus)) {
					return fail(400, { error: 'Invalid target status' });
				}

				const success = moveGoverningDocument(
					params.slug, 
					fromStatus, 
					toStatus as keyof typeof SOCIETY_CODE_FOLDERS
				);

				if (!success) {
					return fail(500, { error: 'Failed to move document' });
				}

				return { success: true };
			} else if (documentType === 'motion') {
				// Find current body and status
				const bodySlug = data.get('bodySlug') as string;
				if (!bodySlug) {
					return fail(400, { error: 'Body slug is required for motions' });
				}

				let fromStatus: typeof MOTION_STATUSES[number] | null = null;
				for (const status of MOTION_STATUSES) {
					const filePath = join(getMotionFolder(bodySlug, status), `${params.slug}.json`);
					if (existsSync(filePath)) {
						fromStatus = status;
						break;
					}
				}

				if (!fromStatus) {
					return fail(404, { error: 'Motion not found' });
				}

				if (!MOTION_STATUSES.includes(toStatus as any)) {
					return fail(400, { error: 'Invalid target status' });
				}

				const success = moveMotion(
					params.slug,
					bodySlug,
					fromStatus,
					toStatus as typeof MOTION_STATUSES[number]
				);

				if (!success) {
					return fail(500, { error: 'Failed to move motion' });
				}

				return { success: true };
			} else {
				return fail(400, { error: 'Invalid document type' });
			}
		} catch (err) {
			console.error('Error moving document:', err);
			return fail(500, { error: (err as Error).message });
		}
	}
};
