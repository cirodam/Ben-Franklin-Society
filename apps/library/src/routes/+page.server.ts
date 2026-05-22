import type { PageServerLoad } from './$types.js';
import { getUserBuckets, getBucket, canAccessBucket } from '$lib/server/buckets.js';
import { listRootFiles, listFiles } from '$lib/server/files.js';
import { listRootFolders, listFolders, getFolder, getFolderBreadcrumbs } from '$lib/server/folders.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.session) {
		return {
			session: null,
			buckets: [],
			currentBucket: null,
			files: [],
			folders: [],
			currentFolder: null,
			breadcrumbs: []
		};
	}

	const buckets = getUserBuckets(locals.session.acting_as_uuid);
	if (buckets.length === 0) {
		return {
			session: locals.session,
			buckets: [],
			currentBucket: null,
			files: [],
			folders: [],
			currentFolder: null,
			breadcrumbs: []
		};
	}

	// Get bucket from URL parameter or default to first bucket
	const bucketKeyParam = url.searchParams.get('bucket');
	let currentBucket = bucketKeyParam 
		? buckets.find(b => b.bucket_key === bucketKeyParam) 
		: buckets[0];

	// Verify user has access to this bucket
	if (currentBucket && !canAccessBucket(locals.session.acting_as_uuid, currentBucket)) {
		throw error(403, 'Not authorized to access this bucket');
	}

	// Default to first bucket if not found or no access
	if (!currentBucket) {
		currentBucket = buckets[0];
	}

	const folderIdParam = url.searchParams.get('folder');

	if (folderIdParam) {
		// Inside a folder
		const folderId = parseInt(folderIdParam, 10);
		const currentFolder = getFolder(folderId);
		
		if (currentFolder && currentFolder.bucket_id === currentBucket.id) {
			const files = listFiles(currentBucket.id, folderId);
			const folders = listFolders(currentBucket.id, folderId);
			const breadcrumbs = getFolderBreadcrumbs(folderId);

			return {
				session: locals.session,
				buckets,
				currentBucket,
				files,
				folders,
				currentFolder,
				breadcrumbs
			};
		}
	}

	// Root level
	const files = listRootFiles(currentBucket.id);
	const folders = listRootFolders(currentBucket.id);

	return {
		session: locals.session,
		buckets,
		currentBucket,
		files,
		folders,
		currentFolder: null,
		breadcrumbs: []
	};
};
