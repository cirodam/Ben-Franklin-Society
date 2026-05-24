/**
 * Shared type definitions for the Library application
 */

/**
 * File metadata stored in the database
 */
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
	// Document metadata (populated from JSON content for document files)
	document_type?: string;
	document_title?: string;
	document_status?: string;
}

/**
 * Folder metadata stored in the database
 */
export interface Folder {
	id: number;
	bucket_id: number;
	parent_folder_id: number | null;
	name: string;
	path: string;
	created_at: string;
	created_by: string;
}

/**
 * Bucket metadata stored in the database
 */
export interface Bucket {
	id: number;
	bucket_key: string;
	owner_type: 'user' | 'association';
	owner_id: string;
	created_at: string;
	name?: string; // Display name for UI (user's name or association name)
}

/**
 * Parameters for uploading a file
 */
export interface UploadFileParams {
	bucketId: number;
	folderId?: number;
	filename: string;
	content: Buffer;
	mimeType?: string;
	uploadedBy: string;
}

/**
 * Parameters for creating a folder
 */
export interface CreateFolderParams {
	bucketId: number;
	parentFolderId?: number;
	name: string;
	createdBy: string;
}
