<script lang="ts">
	import type { PageData } from './$types.js';
	import { invalidate, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import SortControls from '$lib/components/SortControls.svelte';
	import BulkActionToolbar from '$lib/components/BulkActionToolbar.svelte';
	import AddDocumentModal from '$lib/components/AddDocumentModal.svelte';
	import FileListTable from '$lib/components/FileListTable.svelte';
	import { formatDate } from '$lib/utils.js';
	import { SelectionState } from '$lib/selectionState.svelte.js';
	import * as fileOps from '$lib/fileOperations.js';
	
	const { data } = $props<{ data: PageData }>();
	
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let creatingFolder = $state(false);
	let newFolderName = $state('');
	let showFolderForm = $state(false);
	let showAddDocumentModal = $state(false);
	
	// Rename state
	let renamingFileId = $state<number | null>(null);
	let renamingFolderId = $state<number | null>(null);
	let renameValue = $state('');
	
	// Move state
	let movingFileId = $state<number | null>(null);
	let moveDestinationFolderId = $state<number | null>(null);
	
	// Selection state using extracted module
	const selection = new SelectionState();
	let bulkMoveDestination = $state<number | null | 'placeholder'>('placeholder');
	
	// Computed: whether any items are selected
	let hasSelection = $derived(selection.hasSelection);
	let allVisibleSelected = $derived.by(() => {
		return selection.areAllSelected(filteredAndSortedFiles, filteredAndSortedFolders);
	});
	
	// Search and sort state
	let searchQuery = $state('');
	let sortBy = $state<'name' | 'size' | 'date'>('name');
	let sortDir = $state<'asc' | 'desc'>('asc');
	
	// Computed: filtered and sorted items
	let filteredAndSortedFolders = $derived.by(() => {
		let folders = [...data.folders];
		
		// Filter by search
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			folders = folders.filter(f => f.name.toLowerCase().includes(query));
		}
		
		// Sort
		folders.sort((a, b) => {
			let comparison = 0;
			if (sortBy === 'name') {
				comparison = a.name.localeCompare(b.name);
			} else if (sortBy === 'date') {
				comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
			}
			return sortDir === 'asc' ? comparison : -comparison;
		});
		
		return folders;
	});
	
	let filteredAndSortedFiles = $derived.by(() => {
		let files = [...data.files];
		
		// Filter by search
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			files = files.filter(f => f.filename.toLowerCase().includes(query));
		}
		
		// Sort
		files.sort((a, b) => {
			let comparison = 0;
			if (sortBy === 'name') {
				comparison = a.filename.localeCompare(b.filename);
			} else if (sortBy === 'size') {
				comparison = a.size_bytes - b.size_bytes;
			} else if (sortBy === 'date') {
				comparison = new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
			}
			return sortDir === 'asc' ? comparison : -comparison;
		});
		
		return files;
	});
	
	// Get all folders for move dropdown (current folder + all subfolders)
	let availableFolders = $derived.by(() => {
		const folders = [{ id: null, name: 'Root', path: '/' }];
		for (const folder of data.folders) {
			folders.push({ id: folder.id, name: folder.name, path: folder.path });
		}
		return folders;
	});
	
	async function handleUpload(event: Event) {
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		
		uploading = true;
		uploadError = null;
		
		try {
			await fileOps.uploadFile(formData);
			// Refresh page data
			await invalidate($page.url.pathname);
			form.reset();
		} catch (err: any) {
			uploadError = err.message;
		} finally {
			uploading = false;
		}
	}
	
	async function createFolder() {
		if (!newFolderName.trim() || !data.currentBucket) return;
		
		creatingFolder = true;
		
		try {
			await fileOps.createFolder(
				data.currentBucket.bucket_key,
				data.currentFolder?.id || null,
				newFolderName
			);
			
			// Refresh page data
			await invalidate($page.url.pathname);
			newFolderName = '';
			showFolderForm = false;
		} catch (err: any) {
			alert(err.message);
		} finally {
			creatingFolder = false;
		}
	}
	
	function startRenamingFile(fileId: number, currentName: string) {
		renamingFileId = fileId;
		renameValue = currentName;
	}
	
	function startRenamingFolder(folderId: number, currentName: string) {
		renamingFolderId = folderId;
		renameValue = currentName;
	}
	
	function cancelRename() {
		renamingFileId = null;
		renamingFolderId = null;
		renameValue = '';
	}
	
	async function saveRename() {
		if (!renameValue.trim()) {
			cancelRename();
			return;
		}
		
		try {
			if (renamingFileId !== null) {
				await fileOps.renameFile(renamingFileId, renameValue);
			} else if (renamingFolderId !== null) {
				await fileOps.renameFolder(renamingFolderId, renameValue);
			}
			
			// Refresh page data
			await invalidate($page.url.pathname);
			cancelRename();
		} catch (err: any) {
			alert(err.message);
		}
	}
	
	function startMovingFile(fileId: number) {
		movingFileId = fileId;
		moveDestinationFolderId = data.currentFolder?.id || null;
	}
	
	function cancelMove() {
		movingFileId = null;
		moveDestinationFolderId = null;
	}
	
	async function saveMove() {
		if (movingFileId === null) return;
		
		try {
			await fileOps.moveFile(movingFileId, moveDestinationFolderId);
			
			// Refresh page data
			await invalidate($page.url.pathname);
			cancelMove();
		} catch (err: any) {
			alert(err.message);
		}
	}
	
	async function deleteFile(fileId: number) {
		if (!confirm('Are you sure you want to delete this file?')) {
			return;
		}
		
		try {
			await fileOps.deleteFile(fileId);
			
			// Refresh page data
			await invalidate($page.url.pathname);
		} catch (err) {
			alert('Failed to delete file');
		}
	}
	
	async function deleteFolder(folderId: number) {
		if (!confirm('Are you sure you want to delete this folder? It must be empty.')) {
			return;
		}
		
		try {
			await fileOps.deleteFolder(folderId);
			
			// Refresh page data
			await invalidate($page.url.pathname);
		} catch (err: any) {
			alert(err.message);
		}
	}
	
	function navigateToFolder(folderId: number) {
		const params = new URLSearchParams();
		if (data.currentBucket) {
			params.set('bucket', data.currentBucket.bucket_key);
		}
		params.set('folder', folderId.toString());
		goto(`/?${params.toString()}`);
	}
	
	function navigateToBucket(bucketKey: string) {
		goto(`/?bucket=${bucketKey}`);
	}
	
	function navigateToRoot() {
		const params = new URLSearchParams();
		if (data.currentBucket) {
			params.set('bucket', data.currentBucket.bucket_key);
		}
		goto(`/?${params.toString()}`);
	}
	
	function toggleSort(column: 'name' | 'size' | 'date') {
		if (sortBy === column) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortDir = 'asc';
		}
	}
	
	// Bulk selection functions
	function toggleFileSelection(fileId: number) {
		selection.toggleFile(fileId);
	}
	
	function toggleFolderSelection(folderId: number) {
		selection.toggleFolder(folderId);
	}
	
	function toggleAllSelection() {
		if (allVisibleSelected) {
			selection.clear();
		} else {
			selection.selectAll(filteredAndSortedFiles, filteredAndSortedFolders);
		}
	}
	
	function clearSelection() {
		selection.clear();
		bulkMoveDestination = 'placeholder';
	}
	
	async function bulkDelete() {
		const fileCount = selection.fileIds.size;
		const folderCount = selection.folderIds.size;
		const totalCount = selection.totalCount;
		
		if (totalCount === 0) return;
		
		const message = `Are you sure you want to delete ${totalCount} item${totalCount > 1 ? 's' : ''}? (${fileCount} file${fileCount !== 1 ? 's' : ''}, ${folderCount} folder${folderCount !== 1 ? 's' : ''})`;
		if (!confirm(message)) return;
		
		try {
			await fileOps.bulkDelete(selection.fileIds, selection.folderIds);
			
			clearSelection();
			await invalidate($page.url.pathname);
		} catch (err: any) {
			alert(err.message);
		}
	}
	
	async function bulkMove() {
		const fileCount = selection.fileIds.size;
		
		if (fileCount === 0) {
			alert('Please select files to move. Folder moving is not supported in bulk operations.');
			return;
		}
		
		if (bulkMoveDestination === 'placeholder') {
			alert('Please select a destination folder.');
			return;
		}
		
		try {
			await fileOps.bulkMove(selection.fileIds, bulkMoveDestination);
			
			clearSelection();
			bulkMoveDestination = 'placeholder';
			await invalidate($page.url.pathname);
		} catch (err: any) {
			alert(err.message);
		}
	}
</script>

<div class="container">
	<h1 class="t-display">Library</h1>
	
	{#if !data.session}
		<div class="paper stack" style="margin-top: 2rem;">
			<p>Not logged in. <a href="/auth/login">Log in</a> to access your files.</p>
		</div>
	{:else}
		<div class="stack" style="margin-top: 2rem; gap: 2rem;">
			<!-- Bucket Selector -->
			{#if data.buckets.length > 1}
				<div class="paper" style="padding: 1rem;">
					<div style="display: flex; align-items: center; gap: 0.5rem;">
						<label for="bucket_selector" class="t-label">Bucket:</label>
						<select 
							id="bucket_selector"
							value={data.currentBucket?.bucket_key}
							onchange={(e) => navigateToBucket((e.target as HTMLSelectElement).value)}
							style="padding: 0.5rem; font-size: 1rem;"
						>
							{#each data.buckets as bucket}
								<option value={bucket.bucket_key}>{bucket.name || bucket.bucket_key}</option>
							{/each}
						</select>
					</div>
				</div>
			{/if}
			
			<!-- Breadcrumb Navigation -->
			{#if data.breadcrumbs.length > 0 || data.currentFolder}
				<div style="display: flex; align-items: center; gap: 0.5rem; color: var(--ink-muted);">
					<button 
						onclick={navigateToRoot}
						style="background: none; border: none; color: var(--gold); cursor: pointer; padding: 0; font-family: inherit; text-decoration: underline;"
					>
						{data.currentBucket?.name || 'Home'}
					</button>
					{#each data.breadcrumbs as crumb}
						<span>/</span>
						<button 
							onclick={() => navigateToFolder(crumb.id)}
							style="background: none; border: none; color: var(--gold); cursor: pointer; padding: 0; font-family: inherit; text-decoration: underline;"
						>
							{crumb.name}
						</button>
					{/each}
				</div>
			{/if}
			
			<!-- Actions -->
			<div class="paper stack">
				<div class="row" style="justify-content: space-between;">
					<h2 class="t-label">Actions</h2>
					<div style="display: flex; gap: 0.5rem;">
						<button onclick={() => showAddDocumentModal = true} class="btn btn--primary">
							add document
						</button>
						<button onclick={() => showFolderForm = !showFolderForm} class="btn btn--secondary">
							{showFolderForm ? 'Cancel' : '+ New Folder'}
						</button>
					</div>
				</div>
				
				{#if showFolderForm}
					<div style="padding: 1rem; background: var(--tint-green); border: 1px solid var(--border);">
						<div class="stack" style="gap: 0.5rem;">
							<label for="folder_name">Folder Name</label>
							<input 
								type="text" 
								id="folder_name"
								bind:value={newFolderName}
								placeholder="Enter folder name"
								disabled={creatingFolder}
								onkeydown={(e) => e.key === 'Enter' && createFolder()}
							/>
							<button onclick={createFolder} class="btn btn--primary" disabled={creatingFolder || !newFolderName.trim()}>
								{creatingFolder ? 'Creating...' : 'Create Folder'}
							</button>
						</div>
					</div>
				{/if}
				
				{#if uploadError}
					<div style="padding: 1rem; background: #fdd; border: 1px solid var(--danger);">
						{uploadError}
					</div>
				{/if}
		</div>
		<!-- Contents -->
		<div class="paper stack">
			<div class="row" style="justify-content: space-between; align-items: center;">
				<h2 class="t-label">
					{data.currentFolder ? data.currentFolder.name : 'Documents'}
				</h2>
				<SearchBar bind:value={searchQuery} placeholder="Search files..." />
			</div>
			
			<!-- Sort Controls -->
			<SortControls 
				{sortBy}
				{sortDir}
				onToggleSort={toggleSort}
			/>
			
			<!-- Bulk Actions Toolbar -->
			{#if hasSelection}
				<BulkActionToolbar
				selectedFileIds={selection.fileIds}
				selectedFolderIds={selection.folderIds}
					onBulkDelete={bulkDelete}
					bind:bulkMoveDestination
				/>
			{/if}
				
				{#if filteredAndSortedFolders.length === 0 && filteredAndSortedFiles.length === 0}
					<p style="color: var(--ink-subtle);">
						{searchQuery ? 'No matching files or folders.' : 'This folder is empty.'}
					</p>
				{:else}
				<FileListTable
					files={filteredAndSortedFiles}
					folders={filteredAndSortedFolders}
					allFolders={data.folders}
				selectedFileIds={selection.fileIds}
				selectedFolderIds={selection.folderIds}
					{allVisibleSelected}
					{renamingFileId}
					{renamingFolderId}
					bind:renameValue
					{movingFileId}
					bind:moveDestinationFolderId
					onToggleAllSelection={toggleAllSelection}
					onToggleFileSelection={toggleFileSelection}
					onToggleFolderSelection={toggleFolderSelection}
					onNavigateToFolder={navigateToFolder}
					onStartRenamingFile={startRenamingFile}
					onStartRenamingFolder={startRenamingFolder}
					onSaveRename={saveRename}
					onCancelRename={cancelRename}
					onStartMovingFile={startMovingFile}
					onSaveMove={saveMove}
					onCancelMove={cancelMove}
					onDeleteFile={deleteFile}
					onDeleteFolder={deleteFolder}
				/>
				{/if}
			</div>
		</div>
	{/if}

<!-- Add Document Modal -->
<AddDocumentModal
	bind:open={showAddDocumentModal}
	currentBucketKey={data.currentBucket?.key || null}
	currentFolderId={data.currentFolder?.id || null}
	onClose={() => showAddDocumentModal = false}
	onUpload={handleUpload}
	{uploading}
	{uploadError}
/>
</div>
