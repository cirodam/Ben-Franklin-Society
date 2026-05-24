/**
 * File and folder operations module
 * Handles all API calls for CRUD operations on files and folders
 */

/**
 * Upload a file to the library
 */
export async function uploadFile(formData: FormData): Promise<void> {
	const response = await fetch('/api/files', {
		method: 'POST',
		body: formData
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || 'Upload failed');
	}
}

/**
 * Create a new folder
 */
export async function createFolder(
	bucketKey: string,
	parentFolderId: number | null,
	name: string
): Promise<void> {
	const response = await fetch('/api/folders', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			bucket_key: bucketKey,
			parent_folder_id: parentFolderId,
			name: name.trim()
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || 'Failed to create folder');
	}
}

/**
 * Rename a file
 */
export async function renameFile(fileId: number, newName: string): Promise<void> {
	const response = await fetch(`/api/files/${fileId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ filename: newName.trim() })
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || 'Rename failed');
	}
}

/**
 * Rename a folder
 */
export async function renameFolder(folderId: number, newName: string): Promise<void> {
	const response = await fetch(`/api/folders/${folderId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name: newName.trim() })
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || 'Rename failed');
	}
}

/**
 * Move a file to a different folder
 */
export async function moveFile(fileId: number, folderId: number | null): Promise<void> {
	const response = await fetch(`/api/files/${fileId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ folder_id: folderId })
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || 'Move failed');
	}
}

/**
 * Delete a file
 */
export async function deleteFile(fileId: number): Promise<void> {
	const response = await fetch(`/api/files/${fileId}`, {
		method: 'DELETE'
	});

	if (!response.ok) {
		throw new Error('Delete failed');
	}
}

/**
 * Delete a folder
 */
export async function deleteFolder(folderId: number): Promise<void> {
	const response = await fetch(`/api/folders/${folderId}`, {
		method: 'DELETE'
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || 'Delete failed');
	}
}

/**
 * Delete multiple files and folders
 */
export async function bulkDelete(fileIds: Set<number>, folderIds: Set<number>): Promise<void> {
	// Delete files
	for (const fileId of fileIds) {
		const response = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
		if (!response.ok) {
			throw new Error(`Failed to delete file ${fileId}`);
		}
	}

	// Delete folders
	for (const folderId of folderIds) {
		const response = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
		if (!response.ok) {
			throw new Error(`Failed to delete folder ${folderId}`);
		}
	}
}

/**
 * Move multiple files to a folder
 */
export async function bulkMove(fileIds: Set<number>, folderId: number | null): Promise<void> {
	for (const fileId of fileIds) {
		const response = await fetch(`/api/files/${fileId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ folder_id: folderId })
		});

		if (!response.ok) {
			throw new Error(`Failed to move file ${fileId}`);
		}
	}
}
