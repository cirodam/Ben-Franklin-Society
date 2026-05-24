/**
 * Selection state management using Svelte 5 runes
 * Provides reactive state for tracking selected files and folders
 */

export class SelectionState {
	fileIds = $state<Set<number>>(new Set());
	folderIds = $state<Set<number>>(new Set());

	/**
	 * Whether any items are currently selected
	 */
	get hasSelection(): boolean {
		return this.fileIds.size > 0 || this.folderIds.size > 0;
	}

	/**
	 * Total number of selected items
	 */
	get totalCount(): number {
		return this.fileIds.size + this.folderIds.size;
	}

	/**
	 * Toggle selection of a file
	 */
	toggleFile(fileId: number) {
		const newSet = new Set(this.fileIds);
		if (newSet.has(fileId)) {
			newSet.delete(fileId);
		} else {
			newSet.add(fileId);
		}
		this.fileIds = newSet;
	}

	/**
	 * Toggle selection of a folder
	 */
	toggleFolder(folderId: number) {
		const newSet = new Set(this.folderIds);
		if (newSet.has(folderId)) {
			newSet.delete(folderId);
		} else {
			newSet.add(folderId);
		}
		this.folderIds = newSet;
	}

	/**
	 * Select all files and folders from provided arrays
	 */
	selectAll(files: Array<{ id: number }>, folders: Array<{ id: number }>) {
		this.fileIds = new Set(files.map((f) => f.id));
		this.folderIds = new Set(folders.map((f) => f.id));
	}

	/**
	 * Check if all provided items are selected
	 */
	areAllSelected(files: Array<{ id: number }>, folders: Array<{ id: number }>): boolean {
		if (files.length === 0 && folders.length === 0) return false;

		const allFilesSelected = files.every((f) => this.fileIds.has(f.id));
		const allFoldersSelected = folders.every((f) => this.folderIds.has(f.id));

		return allFilesSelected && allFoldersSelected;
	}

	/**
	 * Clear all selections
	 */
	clear() {
		this.fileIds = new Set();
		this.folderIds = new Set();
	}
}
