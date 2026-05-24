/**
 * Library Service Client
 * 
 * Helper functions for other BFS services to interact with the Library API.
 * Uses service-to-service communication with user JWT tokens.
 * 
 * Usage:
 *   import { LibraryClient } from '@bfs/library-client';
 *   const client = new LibraryClient(jwtToken, libraryBaseUrl);
 *   const file = await client.uploadFile(buffer, 'document.pdf', bucketKey);
 */

import type { FileMetadata, Folder, Bucket } from './types.js';

export type { FileMetadata, Folder, Bucket };

export class LibraryClient {
	private baseUrl: string;
	private jwtToken: string;

	constructor(jwtToken: string, baseUrl: string = 'http://localhost:5177') {
		this.jwtToken = jwtToken;
		this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
	}

	/**
	 * Get authentication headers
	 */
	private getHeaders(contentType?: string): HeadersInit {
		const headers: HeadersInit = {
			'Authorization': `Bearer ${this.jwtToken}`
		};
		if (contentType) {
			headers['Content-Type'] = contentType;
		}
		return headers;
	}

	/**
	 * List buckets accessible to the authenticated user
	 */
	async listBuckets(): Promise<Bucket[]> {
		const response = await fetch(`${this.baseUrl}/api/buckets`, {
			headers: this.getHeaders()
		});

		if (!response.ok) {
			throw new Error(`Failed to list buckets: ${response.statusText}`);
		}

		const data = await response.json();
		return data.buckets;
	}

	/**
	 * Upload a file to a bucket
	 * 
	 * @param fileData - File content as Buffer or Blob
	 * @param filename - Name of the file
	 * @param bucketKey - Bucket identifier (e.g., "user-abc-123" or "association-handle")
	 * @param folderId - Optional folder ID to upload into
	 * @returns File metadata
	 */
	async uploadFile(
		fileData: Buffer | Blob,
		filename: string,
		bucketKey: string,
		folderId?: number
	): Promise<FileMetadata> {
		const formData = new FormData();
		
		// Convert Buffer to Blob if needed
		const blob = fileData instanceof Blob 
			? fileData 
			: new Blob([new Uint8Array(fileData)]);
		
		formData.append('file', blob, filename);
		formData.append('bucket_key', bucketKey);
		if (folderId !== undefined) {
			formData.append('folder_id', folderId.toString());
		}

		const response = await fetch(`${this.baseUrl}/api/files`, {
			method: 'POST',
			headers: this.getHeaders(),
			body: formData
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to upload file: ${error}`);
		}

		return await response.json();
	}

	/**
	 * Download a file by ID
	 * 
	 * @param fileId - File ID
	 * @returns Object with file data, content type, and filename
	 */
	async downloadFile(fileId: number): Promise<{
		data: ArrayBuffer;
		contentType: string;
		filename: string;
	}> {
		const response = await fetch(`${this.baseUrl}/api/files/${fileId}`, {
			headers: this.getHeaders()
		});

		if (!response.ok) {
			throw new Error(`Failed to download file: ${response.statusText}`);
		}

		const data = await response.arrayBuffer();
		const contentType = response.headers.get('content-type') || 'application/octet-stream';
		
		// Extract filename from Content-Disposition header
		const disposition = response.headers.get('content-disposition') || '';
		const filenameMatch = disposition.match(/filename="(.+)"/);
		const filename = filenameMatch ? filenameMatch[1] : 'file';

		return { data, contentType, filename };
	}

	/**
	 * Delete a file
	 */
	async deleteFile(fileId: number): Promise<void> {
		const response = await fetch(`${this.baseUrl}/api/files/${fileId}`, {
			method: 'DELETE',
			headers: this.getHeaders()
		});

		if (!response.ok) {
			throw new Error(`Failed to delete file: ${response.statusText}`);
		}
	}

	/**
	 * Move a file to a different folder
	 */
	async moveFile(fileId: number, newFolderId: number | null): Promise<FileMetadata> {
		const response = await fetch(`${this.baseUrl}/api/files/${fileId}`, {
			method: 'PATCH',
			headers: this.getHeaders('application/json'),
			body: JSON.stringify({ folder_id: newFolderId })
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to move file: ${error}`);
		}

		return await response.json();
	}

	/**
	 * Rename a file
	 */
	async renameFile(fileId: number, newFilename: string): Promise<FileMetadata> {
		const response = await fetch(`${this.baseUrl}/api/files/${fileId}`, {
			method: 'PATCH',
			headers: this.getHeaders('application/json'),
			body: JSON.stringify({ filename: newFilename })
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to rename file: ${error}`);
		}

		return await response.json();
	}

	/**
	 * List files in a bucket (root level)
	 */
	async listFiles(bucketKey: string): Promise<FileMetadata[]> {
		const response = await fetch(`${this.baseUrl}/api/buckets/${bucketKey}/files`, {
			headers: this.getHeaders()
		});

		if (!response.ok) {
			throw new Error(`Failed to list files: ${response.statusText}`);
		}

		const data = await response.json();
		return data.files;
	}

	/**
	 * Create a folder
	 */
	async createFolder(
		bucketKey: string,
		name: string,
		parentFolderId?: number
	): Promise<Folder> {
		const response = await fetch(`${this.baseUrl}/api/folders`, {
			method: 'POST',
			headers: this.getHeaders('application/json'),
			body: JSON.stringify({
				bucket_key: bucketKey,
				name,
				parent_folder_id: parentFolderId || null
			})
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to create folder: ${error}`);
		}

		return await response.json();
	}

	/**
	 * Delete a folder (must be empty)
	 */
	async deleteFolder(folderId: number): Promise<void> {
		const response = await fetch(`${this.baseUrl}/api/folders/${folderId}`, {
			method: 'DELETE',
			headers: this.getHeaders()
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to delete folder: ${error}`);
		}
	}

	/**
	 * Rename a folder
	 */
	async renameFolder(folderId: number, newName: string): Promise<Folder> {
		const response = await fetch(`${this.baseUrl}/api/folders/${folderId}`, {
			method: 'PATCH',
			headers: this.getHeaders('application/json'),
			body: JSON.stringify({ name: newName })
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to rename folder: ${error}`);
		}

		return await response.json();
	}

	/**
	 * List folders in a bucket (root level)
	 */
	async listFolders(bucketKey: string): Promise<Folder[]> {
		const response = await fetch(`${this.baseUrl}/api/buckets/${bucketKey}/folders`, {
			headers: this.getHeaders()
		});

		if (!response.ok) {
			throw new Error(`Failed to list folders: ${response.statusText}`);
		}

		const data = await response.json();
		return data.folders;
	}

	/**
	 * Get folder contents (subfolders and files)
	 */
	async getFolderContents(folderId: number): Promise<{
		folder: Folder;
		subfolders: Folder[];
		files: FileMetadata[];
	}> {
		const response = await fetch(`${this.baseUrl}/api/folders/${folderId}/contents`, {
			headers: this.getHeaders()
		});

		if (!response.ok) {
			throw new Error(`Failed to get folder contents: ${response.statusText}`);
		}

		return await response.json();
	}
}

/**
 * Common helper functions for specific use cases
 */

/**
 * Upload file to user's personal bucket
 */
export async function uploadToUserBucket(
	jwtToken: string,
	userUuid: string,
	fileData: Buffer | Blob,
	filename: string,
	libraryUrl?: string
): Promise<FileMetadata> {
	const client = new LibraryClient(jwtToken, libraryUrl);
	const bucketKey = `user-${userUuid}`;
	return await client.uploadFile(fileData, filename, bucketKey);
}

/**
 * Upload file to association bucket
 */
export async function uploadToAssociationBucket(
	jwtToken: string,
	associationHandle: string,
	fileData: Buffer | Blob,
	filename: string,
	libraryUrl?: string
): Promise<FileMetadata> {
	const client = new LibraryClient(jwtToken, libraryUrl);
	const bucketKey = `association-${associationHandle}`;
	return await client.uploadFile(fileData, filename, bucketKey);
}

/**
 * Download file and return as Buffer (Node.js)
 */
export async function downloadFileAsBuffer(
	jwtToken: string,
	fileId: number,
	libraryUrl?: string
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
	const client = new LibraryClient(jwtToken, libraryUrl);
	const result = await client.downloadFile(fileId);
	
	return {
		buffer: Buffer.from(result.data),
		contentType: result.contentType,
		filename: result.filename
	};
}
