import { db } from './db.js';
import { getBucketById } from './buckets.js';

export interface Folder {
	id: number;
	bucket_id: number;
	parent_folder_id: number | null;
	name: string;
	path: string;
	created_at: string;
	created_by: string;
}

export interface CreateFolderParams {
	bucketId: number;
	parentFolderId?: number;
	name: string;
	createdBy: string;
}

/**
 * Create a new folder in a bucket
 */
export function createFolder(params: CreateFolderParams): Folder {
	const { bucketId, parentFolderId, name, createdBy } = params;

	// Verify bucket exists
	const bucket = getBucketById(bucketId);
	if (!bucket) {
		throw new Error(`Bucket ${bucketId} not found`);
	}

	// Validate folder name (no slashes, not empty)
	if (!name || name.includes('/')) {
		throw new Error('Invalid folder name');
	}

	// Determine path
	let path: string;
	if (parentFolderId) {
		const parent = getFolder(parentFolderId);
		if (!parent) {
			throw new Error(`Parent folder ${parentFolderId} not found`);
		}
		if (parent.bucket_id !== bucketId) {
			throw new Error('Parent folder is in a different bucket');
		}
		path = `${parent.path}/${name}`;
	} else {
		path = `/${name}`;
	}

	// Check if folder already exists at this path
	const existing = db
		.prepare('SELECT id FROM folders WHERE bucket_id = ? AND path = ?')
		.get(bucketId, path) as { id: number } | undefined;

	if (existing) {
		throw new Error(`Folder already exists at path: ${path}`);
	}

	// Insert folder
	const now = new Date().toISOString();
	const result = db
		.prepare(
			`INSERT INTO folders (bucket_id, parent_folder_id, name, path, created_at, created_by)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.run(bucketId, parentFolderId || null, name, path, now, createdBy);

	return {
		id: result.lastInsertRowid as number,
		bucket_id: bucketId,
		parent_folder_id: parentFolderId || null,
		name,
		path,
		created_at: now,
		created_by: createdBy,
	};
}

/**
 * Get folder by ID
 */
export function getFolder(folderId: number): Folder | null {
	const folder = db
		.prepare('SELECT * FROM folders WHERE id = ?')
		.get(folderId) as Folder | undefined;

	return folder || null;
}

/**
 * Get folder by bucket and path
 */
export function getFolderByPath(bucketId: number, path: string): Folder | null {
	const folder = db
		.prepare('SELECT * FROM folders WHERE bucket_id = ? AND path = ?')
		.get(bucketId, path) as Folder | undefined;

	return folder || null;
}

/**
 * List folders in a bucket (optionally filtered by parent)
 */
export function listFolders(bucketId: number, parentFolderId?: number): Folder[] {
	let query: string;
	let params: any[];

	if (parentFolderId !== undefined) {
		// List child folders of specific parent
		query = 'SELECT * FROM folders WHERE bucket_id = ? AND parent_folder_id = ? ORDER BY name ASC';
		params = [bucketId, parentFolderId];
	} else {
		// List all folders in bucket
		query = 'SELECT * FROM folders WHERE bucket_id = ? ORDER BY path ASC';
		params = [bucketId];
	}

	return db.prepare(query).all(...params) as Folder[];
}

/**
 * List root-level folders in a bucket (folders with no parent)
 */
export function listRootFolders(bucketId: number): Folder[] {
	return db
		.prepare('SELECT * FROM folders WHERE bucket_id = ? AND parent_folder_id IS NULL ORDER BY name ASC')
		.all(bucketId) as Folder[];
}

/**
 * Delete a folder (only if empty - no files or subfolders)
 */
export function deleteFolder(folderId: number): void {
	const folder = getFolder(folderId);
	if (!folder) {
		throw new Error(`Folder ${folderId} not found`);
	}

	// Check for files in this folder
	const fileCount = db
		.prepare('SELECT COUNT(*) as count FROM files WHERE folder_id = ?')
		.get(folderId) as { count: number };

	if (fileCount.count > 0) {
		throw new Error('Cannot delete folder: contains files');
	}

	// Check for subfolders
	const subfolderCount = db
		.prepare('SELECT COUNT(*) as count FROM folders WHERE parent_folder_id = ?')
		.get(folderId) as { count: number };

	if (subfolderCount.count > 0) {
		throw new Error('Cannot delete folder: contains subfolders');
	}

	// Delete folder
	db.prepare('DELETE FROM folders WHERE id = ?').run(folderId);
}

/**
 * Get breadcrumb trail for a folder (path components)
 */
export function getFolderBreadcrumbs(folderId: number): Array<{ id: number; name: string; path: string }> {
	const folder = getFolder(folderId);
	if (!folder) {
		return [];
	}

	const breadcrumbs: Array<{ id: number; name: string; path: string }> = [];
	let current: Folder | null = folder;

	while (current) {
		breadcrumbs.unshift({
			id: current.id,
			name: current.name,
			path: current.path,
		});

		if (current.parent_folder_id) {
			current = getFolder(current.parent_folder_id);
		} else {
			current = null;
		}
	}

	return breadcrumbs;
}

/**
 * Rename a folder
 */
export function renameFolder(folderId: number, newName: string): Folder {
	const folder = getFolder(folderId);
	if (!folder) {
		throw new Error(`Folder ${folderId} not found`);
	}

	// Validate name
	if (!newName || newName.includes('/')) {
		throw new Error('Invalid folder name');
	}

	// Determine new path
	let newPath: string;
	if (folder.parent_folder_id) {
		const parent = getFolder(folder.parent_folder_id);
		if (!parent) {
			throw new Error('Parent folder not found');
		}
		newPath = `${parent.path}/${newName}`;
	} else {
		newPath = `/${newName}`;
	}

	// Check if folder already exists at this path
	const existing = db
		.prepare('SELECT id FROM folders WHERE bucket_id = ? AND path = ? AND id != ?')
		.get(folder.bucket_id, newPath, folderId) as { id: number } | undefined;
	
	if (existing) {
		throw new Error(`Folder with name "${newName}" already exists in this location`);
	}

	const oldPath = folder.path;

	// Update folder name and path
	db.prepare('UPDATE folders SET name = ?, path = ? WHERE id = ?')
		.run(newName, newPath, folderId);

	// Update all descendant folders' paths
	const descendants = db
		.prepare('SELECT * FROM folders WHERE bucket_id = ? AND path LIKE ?')
		.all(folder.bucket_id, `${oldPath}/%`) as Folder[];

	for (const descendant of descendants) {
		const updatedPath = descendant.path.replace(oldPath, newPath);
		db.prepare('UPDATE folders SET path = ? WHERE id = ?')
			.run(updatedPath, descendant.id);
	}

	// Update all files in this folder and descendants
	const files = db
		.prepare('SELECT * FROM files WHERE bucket_id = ? AND path LIKE ?')
		.all(folder.bucket_id, `${oldPath}/%`) as Array<{ id: number; path: string }>;

	for (const file of files) {
		const updatedPath = file.path.replace(oldPath, newPath);
		db.prepare('UPDATE files SET path = ? WHERE id = ?')
			.run(updatedPath, file.id);
	}

	// Also update files directly in the renamed folder
	const directFiles = db
		.prepare('SELECT * FROM files WHERE folder_id = ?')
		.all(folderId) as Array<{ id: number; path: string }>;

	for (const file of directFiles) {
		const filename = file.path.split('/').pop();
		const updatedPath = `${newPath}/${filename}`;
		db.prepare('UPDATE files SET path = ? WHERE id = ?')
			.run(updatedPath, file.id);
	}

	return getFolder(folderId)!;
}
