import { db } from './db.js';
import { getBucketById } from './buckets.js';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, writeFile, readFile, unlink, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const STORAGE_ROOT = process.env.STORAGE_PATH || './data/buckets';

export interface FileMetadata {
	id: number;
	bucket_id: number;
	folder_id: number | null;
	filename: string;
	path: string;
	storage_path: string;
	mime_type: string | null;
	size_bytes: number;
	uploaded_at: string;
	uploaded_by: string;
	// Document metadata (populated from JSON content)
	document_type?: string;
	document_title?: string;
	document_status?: string;
}

export interface UploadFileParams {
	bucketId: number;
	folderId?: number;
	filename: string;
	content: Buffer;
	mimeType?: string;
	uploadedBy: string;
}

/**
 * Generate a unique storage path for a file
 */
function generateStoragePath(bucketId: number, filename: string): string {
	const hash = randomBytes(16).toString('hex');
	const ext = filename.split('.').pop() || '';
	const storageName = ext ? `${hash}.${ext}` : hash;
	return join(STORAGE_ROOT, bucketId.toString(), storageName);
}

/**
 * Upload a file to a bucket
 */
export async function uploadFile(params: UploadFileParams): Promise<FileMetadata> {
	const { bucketId, folderId, filename, content, mimeType, uploadedBy } = params;

	// Verify bucket exists
	const bucket = getBucketById(bucketId);
	if (!bucket) {
		throw new Error(`Bucket ${bucketId} not found`);
	}

	// Generate storage path
	const storagePath = generateStoragePath(bucketId, filename);
	
	// Determine logical path
	let logicalPath = `/${filename}`;
	if (folderId) {
		const folder = db.prepare('SELECT path FROM folders WHERE id = ?').get(folderId) as { path: string } | undefined;
		if (folder) {
			logicalPath = `${folder.path}/${filename}`;
		}
	}

	// Check if file already exists at this path
	const existing = db
		.prepare('SELECT id FROM files WHERE bucket_id = ? AND path = ?')
		.get(bucketId, logicalPath) as { id: number } | undefined;
	
	if (existing) {
		throw new Error(`File already exists at path: ${logicalPath}`);
	}

	// Ensure storage directory exists
	await mkdir(dirname(storagePath), { recursive: true });

	// Write file to disk
	await writeFile(storagePath, content);

	// Insert into database
	const now = new Date().toISOString();
	const result = db
		.prepare(
			`INSERT INTO files (bucket_id, folder_id, filename, path, storage_path, mime_type, size_bytes, uploaded_at, uploaded_by)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			bucketId,
			folderId || null,
			filename,
			logicalPath,
			storagePath,
			mimeType || null,
			content.length,
			now,
			uploadedBy
		);

	return {
		id: result.lastInsertRowid as number,
		bucket_id: bucketId,
		folder_id: folderId || null,
		filename,
		path: logicalPath,
		storage_path: storagePath,
		mime_type: mimeType || null,
		size_bytes: content.length,
		uploaded_at: now,
		uploaded_by: uploadedBy
	};
}

/**
 * Get file metadata by ID
 */
export function getFile(fileId: number): FileMetadata | null {
	const file = db
		.prepare('SELECT * FROM files WHERE id = ?')
		.get(fileId) as FileMetadata | undefined;

	return file || null;
}

/**
 * Get file metadata by bucket and path
 */
export function getFileByPath(bucketId: number, path: string): FileMetadata | null {
	const file = db
		.prepare('SELECT * FROM files WHERE bucket_id = ? AND path = ?')
		.get(bucketId, path) as FileMetadata | undefined;

	return file || null;
}

/**
 * Read file content from disk
 */
export async function readFileContent(fileId: number): Promise<Buffer> {
	const file = getFile(fileId);
	if (!file) {
		throw new Error(`File ${fileId} not found`);
	}

	try {
		// Try reading from the stored path first
		return await readFile(file.storage_path);
	} catch (err) {
		// Fallback: if storage_path is just a filename (legacy format),
		// try looking in the library-files directory
		if (!file.storage_path.includes('/') && !file.storage_path.includes('\\')) {
			try {
				const fallbackPath = join(process.cwd(), 'data', 'library-files', file.storage_path);
				return await readFile(fallbackPath);
			} catch {
				// Ignore fallback error, throw original error
			}
		}
		throw new Error(`Failed to read file from disk: ${err}`);
	}
}

/**
 * Delete a file (both metadata and physical file)
 */
export async function deleteFile(fileId: number): Promise<void> {
	const file = getFile(fileId);
	if (!file) {
		throw new Error(`File ${fileId} not found`);
	}

	// Delete from database first
	db.prepare('DELETE FROM files WHERE id = ?').run(fileId);

	// Try to delete physical file (don't fail if already gone)
	try {
		await unlink(file.storage_path);
	} catch (err: any) {
		if (err.code !== 'ENOENT') {
			console.error('Failed to delete physical file:', err);
		}
	}
}

/**
 * List files in a bucket (optionally filtered by folder)
 */
export function listFiles(bucketId: number, folderId?: number): FileMetadata[] {
	let query: string;
	let params: any[];

	if (folderId !== undefined) {
		// List files in specific folder
		query = 'SELECT * FROM files WHERE bucket_id = ? AND folder_id = ? ORDER BY filename ASC';
		params = [bucketId, folderId];
	} else {
		// List all files in bucket
		query = 'SELECT * FROM files WHERE bucket_id = ? ORDER BY path ASC';
		params = [bucketId];
	}

	return db.prepare(query).all(...params) as FileMetadata[];
}

/**
 * List root-level files in a bucket (files not in any folder)
 */
export function listRootFiles(bucketId: number): FileMetadata[] {
	return db
		.prepare('SELECT * FROM files WHERE bucket_id = ? AND folder_id IS NULL ORDER BY filename ASC')
		.all(bucketId) as FileMetadata[];
}

/**
 * Extract document metadata from a JSON file
 */
export async function getDocumentMetadata(file: FileMetadata): Promise<Partial<FileMetadata>> {
	if (!file.filename.endsWith('.json')) {
		return {};
	}

	try {
		const content = await readFile(file.storage_path, 'utf-8');
		const doc = JSON.parse(content);
		
		return {
			document_type: doc.type || 'unknown',
			document_title: doc.title || file.filename,
			document_status: doc.content?.status
		};
	} catch (err) {
		console.error(`Failed to read document metadata from ${file.filename}:`, err);
		return {};
	}
}

/**
 * Enrich file list with document metadata from JSON content
 */
export async function enrichFilesWithDocumentMetadata(files: FileMetadata[]): Promise<FileMetadata[]> {
	const enriched = await Promise.all(
		files.map(async (file) => {
			if (file.filename.endsWith('.json')) {
				const metadata = await getDocumentMetadata(file);
				return { ...file, ...metadata };
			}
			return file;
		})
	);
	return enriched;
}

/**
 * Move a file to a different folder (or to root)
 */
export function moveFile(fileId: number, newFolderId: number | null): FileMetadata {
	const file = getFile(fileId);
	if (!file) {
		throw new Error(`File ${fileId} not found`);
	}

	// Determine new path
	let newPath: string;
	if (newFolderId) {
		const folder = db
			.prepare('SELECT bucket_id, path FROM folders WHERE id = ?')
			.get(newFolderId) as { bucket_id: number; path: string } | undefined;
		
		if (!folder) {
			throw new Error(`Folder ${newFolderId} not found`);
		}

		// Verify folder is in same bucket
		if (folder.bucket_id !== file.bucket_id) {
			throw new Error('Cannot move file to folder in different bucket');
		}

		newPath = `${folder.path}/${file.filename}`;
	} else {
		newPath = `/${file.filename}`;
	}

	// Check if file already exists at destination
	const existing = db
		.prepare('SELECT id FROM files WHERE bucket_id = ? AND path = ? AND id != ?')
		.get(file.bucket_id, newPath, fileId) as { id: number } | undefined;
	
	if (existing) {
		throw new Error(`File with name "${file.filename}" already exists in destination folder`);
	}

	// Update file
	db.prepare('UPDATE files SET folder_id = ?, path = ? WHERE id = ?')
		.run(newFolderId, newPath, fileId);

	return getFile(fileId)!;
}

/**
 * Rename a file
 */
export function renameFile(fileId: number, newFilename: string): FileMetadata {
	const file = getFile(fileId);
	if (!file) {
		throw new Error(`File ${fileId} not found`);
	}

	// Validate filename
	if (!newFilename || newFilename.includes('/')) {
		throw new Error('Invalid filename');
	}

	// Determine new path
	let newPath: string;
	if (file.folder_id) {
		const folder = db
			.prepare('SELECT path FROM folders WHERE id = ?')
			.get(file.folder_id) as { path: string } | undefined;
		
		if (folder) {
			newPath = `${folder.path}/${newFilename}`;
		} else {
			newPath = `/${newFilename}`;
		}
	} else {
		newPath = `/${newFilename}`;
	}

	// Check if file already exists at this path
	const existing = db
		.prepare('SELECT id FROM files WHERE bucket_id = ? AND path = ? AND id != ?')
		.get(file.bucket_id, newPath, fileId) as { id: number } | undefined;
	
	if (existing) {
		throw new Error(`File with name "${newFilename}" already exists in this folder`);
	}

	// Update file
	db.prepare('UPDATE files SET filename = ?, path = ? WHERE id = ?')
		.run(newFilename, newPath, fileId);

	return getFile(fileId)!;
}

/**
 * Get file stats (for validation/debugging)
 */
export async function getFileStats(fileId: number) {
	const file = getFile(fileId);
	if (!file) {
		throw new Error(`File ${fileId} not found`);
	}

	try {
		const stats = await stat(file.storage_path);
		return {
			exists: true,
			size: stats.size,
			dbSize: file.size_bytes,
			sizeMatch: stats.size === file.size_bytes,
		};
	} catch {
		return {
			exists: false,
			size: 0,
			dbSize: file.size_bytes,
			sizeMatch: false,
		};
	}
}
