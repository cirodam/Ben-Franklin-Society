import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { getFile, readFileContent } from '$lib/server/files.js';
import { getBucketById } from '$lib/server/buckets.js';
import { getOidcClient } from '$lib/server/oidc.js';
import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import type { MotionDocument, GoverningDocument } from '@bfs/types';

// Helper to read and parse document file
async function readDocument(fileId: number): Promise<{ document: MotionDocument | GoverningDocument, path: string } | null> {
	const file = getFile(fileId);
	if (!file) return null;

	const content = await readFileContent(fileId);
	const document = JSON.parse(content.toString('utf-8'));

	let actualPath = file.storage_path;
	if (!actualPath.includes('/') && !actualPath.includes('\\')) {
		actualPath = join(process.cwd(), 'data', 'library-files', actualPath);
	}

	return { document, path: actualPath };
}

// Helper to write document file
async function writeDocument(path: string, document: MotionDocument | GoverningDocument): Promise<void> {
	await writeFile(path, JSON.stringify(document, null, 2), 'utf-8');
}

export const load: PageServerLoad = async ({ params, cookies }) => {
	const oidcClient = getOidcClient();
	const session = await oidcClient.getSession(cookies);
	
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const fileId = parseInt(params.id);
	if (isNaN(fileId)) {
		throw error(400, 'Invalid file ID');
	}

	const file = getFile(fileId);
	if (!file) {
		throw error(404, 'File not found');
	}

	// Get bucket to verify access
	const bucket = getBucketById(file.bucket_id);
	if (!bucket) {
		throw error(404, 'Bucket not found');
	}

	// Read file content
	const content = await readFileContent(fileId);
	const documentData = JSON.parse(content.toString('utf-8'));

	return {
		session,
		file,
		bucket,
		document: documentData
	};
};

export const actions: Actions = {
	save: async ({ params, request, cookies }) => {
		const oidcClient = getOidcClient();
		const session = await oidcClient.getSession(cookies);
		
		if (!session) {
			return { success: false, error: 'Unauthorized' };
		}

		const fileId = parseInt(params.id);
		if (isNaN(fileId)) {
			return { success: false, error: 'Invalid file ID' };
		}

		const file = getFile(fileId);
		if (!file) {
			return { success: false, error: 'File not found' };
		}

		const formData = await request.formData();
		const documentJson = formData.get('document');
		
		if (!documentJson || typeof documentJson !== 'string') {
			return { success: false, error: 'No document data provided' };
		}

		try {
			// Parse to validate JSON
			const document = JSON.parse(documentJson);
			
			// Determine the actual file path
			let actualPath = file.storage_path;
			// If storage_path is just a filename (legacy format), construct full path
			if (!actualPath.includes('/') && !actualPath.includes('\\')) {
				actualPath = join(process.cwd(), 'data', 'library-files', actualPath);
			}
			
			// Write updated document back to file
			const { writeFile } = await import('node:fs/promises');
			await writeFile(actualPath, JSON.stringify(document, null, 2), 'utf-8');

			return { success: true };
		} catch (err) {
			console.error('Failed to save document:', err);
			return { success: false, error: 'Failed to save document' };
		}
	},

	// Motion editing actions
	updateMotion: async ({ params, request, cookies }) => {
		const oidcClient = getOidcClient();
		const session = await oidcClient.getSession(cookies);
		if (!session) return fail(401, { error: 'Unauthorized' });

		const fileId = parseInt(params.id);
		if (isNaN(fileId)) return fail(400, { error: 'Invalid file ID' });

		const data = await request.formData();
		const provisionsJson = data.get('provisions') as string;
		const clerkNotes = data.get('clerk_notes') as string;
		const parliamentarianNotes = data.get('parliamentarian_notes') as string;

		try {
			const result = await readDocument(fileId);
			if (!result) return fail(404, { error: 'Document not found' });

			const { document, path } = result;
			if (document.type !== 'motion') return fail(400, { error: 'Not a motion document' });

			const provisions = JSON.parse(provisionsJson);
			document.content.provisions = provisions;
			document.content.clerk_notes = clerkNotes || undefined;
			document.content.parliamentarian_notes = parliamentarianNotes || undefined;
			document.updated_at = new Date().toISOString();

			await writeDocument(path, document);
			return { success: true };
		} catch (err) {
			console.error('Failed to update motion:', err);
			return fail(500, { error: 'Failed to update motion' });
		}
	},

	// Governing document editing actions
	editSection: async ({ params, request, cookies }) => {
		const oidcClient = getOidcClient();
		const session = await oidcClient.getSession(cookies);
		if (!session) return fail(401, { error: 'Unauthorized' });

		const fileId = parseInt(params.id);
		if (isNaN(fileId)) return fail(400, { error: 'Invalid file ID' });

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);
		const sectionIdx = parseInt(data.get('sectionIdx') as string);
		const title = data.get('title') as string;
		const body = data.get('body') as string;
		const rationale = data.get('rationale') as string;

		if (!title || !body) return fail(400, { error: 'Title and body are required' });

		try {
			const result = await readDocument(fileId);
			if (!result) return fail(404, { error: 'Document not found' });

			const { document, path } = result;
			if (document.type !== 'governing') return fail(400, { error: 'Not a governing document' });

			document.content.articles[articleIdx].sections[sectionIdx] = {
				title,
				body,
				rationale: rationale || undefined
			};
			document.updated_at = new Date().toISOString();

			await writeDocument(path, document);
			return { success: true };
		} catch (err) {
			console.error('Failed to update section:', err);
			return fail(500, { error: 'Failed to update section' });
		}
	},

	addSection: async ({ params, request, cookies }) => {
		const oidcClient = getOidcClient();
		const session = await oidcClient.getSession(cookies);
		if (!session) return fail(401, { error: 'Unauthorized' });

		const fileId = parseInt(params.id);
		if (isNaN(fileId)) return fail(400, { error: 'Invalid file ID' });

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);
		const title = data.get('title') as string || 'New Section';
		const body = data.get('body') as string || 'Section content...';
		const rationale = data.get('rationale') as string;

		try {
			const result = await readDocument(fileId);
			if (!result) return fail(404, { error: 'Document not found' });

			const { document, path } = result;
			if (document.type !== 'governing') return fail(400, { error: 'Not a governing document' });

			const newSectionIdx = document.content.articles[articleIdx].sections.length;
			document.content.articles[articleIdx].sections.push({
				title,
				body,
				rationale: rationale || undefined
			});
			document.updated_at = new Date().toISOString();

			await writeDocument(path, document);
			return { success: true, articleIdx, newSectionIdx };
		} catch (err) {
			console.error('Failed to add section:', err);
			return fail(500, { error: 'Failed to add section' });
		}
	},

	deleteSection: async ({ params, request, cookies }) => {
		const oidcClient = getOidcClient();
		const session = await oidcClient.getSession(cookies);
		if (!session) return fail(401, { error: 'Unauthorized' });

		const fileId = parseInt(params.id);
		if (isNaN(fileId)) return fail(400, { error: 'Invalid file ID' });

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);
		const sectionIdx = parseInt(data.get('sectionIdx') as string);

		try {
			const result = await readDocument(fileId);
			if (!result) return fail(404, { error: 'Document not found' });

			const { document, path } = result;
			if (document.type !== 'governing') return fail(400, { error: 'Not a governing document' });

			document.content.articles[articleIdx].sections.splice(sectionIdx, 1);
			document.updated_at = new Date().toISOString();

			await writeDocument(path, document);
			return { success: true };
		} catch (err) {
			console.error('Failed to delete section:', err);
			return fail(500, { error: 'Failed to delete section' });
		}
	},

	editArticle: async ({ params, request, cookies }) => {
		const oidcClient = getOidcClient();
		const session = await oidcClient.getSession(cookies);
		if (!session) return fail(401, { error: 'Unauthorized' });

		const fileId = parseInt(params.id);
		if (isNaN(fileId)) return fail(400, { error: 'Invalid file ID' });

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);
		const number = data.get('number') as string;
		const title = data.get('title') as string;

		if (!number || !title) return fail(400, { error: 'Number and title are required' });

		try {
			const result = await readDocument(fileId);
			if (!result) return fail(404, { error: 'Document not found' });

			const { document, path } = result;
			if (document.type !== 'governing') return fail(400, { error: 'Not a governing document' });

			document.content.articles[articleIdx].number = number;
			document.content.articles[articleIdx].title = title;
			document.updated_at = new Date().toISOString();

			await writeDocument(path, document);
			return { success: true };
		} catch (err) {
			console.error('Failed to edit article:', err);
			return fail(500, { error: 'Failed to edit article' });
		}
	},

	addArticle: async ({ params, request, cookies }) => {
		const oidcClient = getOidcClient();
		const session = await oidcClient.getSession(cookies);
		if (!session) return fail(401, { error: 'Unauthorized' });

		const fileId = parseInt(params.id);
		if (isNaN(fileId)) return fail(400, { error: 'Invalid file ID' });

		const data = await request.formData();
		const number = data.get('number') as string || 'I';
		const title = data.get('title') as string || 'New Article';

		try {
			const result = await readDocument(fileId);
			if (!result) return fail(404, { error: 'Document not found' });

			const { document, path } = result;
			if (document.type !== 'governing') return fail(400, { error: 'Not a governing document' });

			const newArticleIdx = document.content.articles.length;
			document.content.articles.push({
				number,
				title,
				sections: []
			});
			document.updated_at = new Date().toISOString();

			await writeDocument(path, document);
			return { success: true, newArticleIdx };
		} catch (err) {
			console.error('Failed to add article:', err);
			return fail(500, { error: 'Failed to add article' });
		}
	},

	deleteArticle: async ({ params, request, cookies }) => {
		const oidcClient = getOidcClient();
		const session = await oidcClient.getSession(cookies);
		if (!session) return fail(401, { error: 'Unauthorized' });

		const fileId = parseInt(params.id);
		if (isNaN(fileId)) return fail(400, { error: 'Invalid file ID' });

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);

		try {
			const result = await readDocument(fileId);
			if (!result) return fail(404, { error: 'Document not found' });

			const { document, path } = result;
			if (document.type !== 'governing') return fail(400, { error: 'Not a governing document' });

			document.content.articles.splice(articleIdx, 1);
			document.updated_at = new Date().toISOString();

			await writeDocument(path, document);
			return { success: true };
		} catch (err) {
			console.error('Failed to delete article:', err);
			return fail(500, { error: 'Failed to delete article' });
		}
	}
};
