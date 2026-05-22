<script lang="ts">
	import type { PageData } from './$types.js';
	import { invalidate, goto } from '$app/navigation';
	import { page } from '$app/stores';
	
	const { data } = $props<{ data: PageData }>();
	
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let creatingFolder = $state(false);
	let newFolderName = $state('');
	let showFolderForm = $state(false);
	
	// Rename state
	let renamingFileId = $state<number | null>(null);
	let renamingFolderId = $state<number | null>(null);
	let renameValue = $state('');
	
	// Move state
	let movingFileId = $state<number | null>(null);
	let moveDestinationFolderId = $state<number | null>(null);
	
	// Search and sort state
	let searchQuery = $state('');
	let sortBy = $state<'name' | 'size' | 'date'>('name');
	let sortDir = $state<'asc' | 'desc'>('asc');
	
	// Computed: filtered and sorted items
	let filteredAndSortedFolders = $derived(() => {
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
	
	let filteredAndSortedFiles = $derived(() => {
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
	let availableFolders = $derived(() => {
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
			const response = await fetch('/api/files', {
				method: 'POST',
				body: formData
			});
			
			if (!response.ok) {
				const error = await response.text();
				throw new Error(error || 'Upload failed');
			}
			
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
			const response = await fetch('/api/folders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bucket_key: data.currentBucket.bucket_key,
					parent_folder_id: data.currentFolder?.id || null,
					name: newFolderName.trim()
				})
			});
			
			if (!response.ok) {
				const error = await response.text();
				throw new Error(error || 'Failed to create folder');
			}
			
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
				const response = await fetch(`/api/files/${renamingFileId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ filename: renameValue.trim() })
				});
				
				if (!response.ok) {
					const error = await response.text();
					throw new Error(error || 'Rename failed');
				}
			} else if (renamingFolderId !== null) {
				const response = await fetch(`/api/folders/${renamingFolderId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: renameValue.trim() })
				});
				
				if (!response.ok) {
					const error = await response.text();
					throw new Error(error || 'Rename failed');
				}
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
			const response = await fetch(`/api/files/${movingFileId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ folder_id: moveDestinationFolderId })
			});
			
			if (!response.ok) {
				const error = await response.text();
				throw new Error(error || 'Move failed');
			}
			
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
			const response = await fetch(`/api/files/${fileId}`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				throw new Error('Delete failed');
			}
			
			// Refresh page data
			await invalidate($page.url.pathname);
		} catch (err) {
			alert('Failed to delete file');
		}
	}
	
	async function submitToGovernance(fileId: number, filename: string) {
		if (!confirm(`Submit "${filename}" to Governance for deliberation?`)) {
			return;
		}
		
		try {
			const response = await fetch('http://localhost:5173/api/library/import-motion', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include', // Include cookies for authentication
				body: JSON.stringify({ library_file_id: fileId })
			});
			
			if (!response.ok) {
				const error = await response.text();
				throw new Error(error || 'Failed to submit to governance');
			}
			
			const result = await response.json();
			alert(`Motion successfully submitted! UUID: ${result.motion_uuid}\nSlug: ${result.slug}`);
		} catch (err: any) {
			alert(`Failed to submit to governance: ${err.message}`);
		}
	}
	
	async function deleteFolder(folderId: number) {
		if (!confirm('Are you sure you want to delete this folder? It must be empty.')) {
			return;
		}
		
		try {
			const response = await fetch(`/api/folders/${folderId}`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				const error = await response.text();
				throw new Error(error || 'Delete failed');
			}
			
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
	
	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
	}
	
	function formatDate(isoString: string): string {
		return new Date(isoString).toLocaleDateString();
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
						<button onclick={() => goto('/documents/new/motion')} class="btn btn--primary">
							+ New Motion
						</button>
						<button onclick={() => goto('/documents/new/governing')} class="btn btn--primary">
							+ New Governing Doc
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
				
				<form onsubmit={handleUpload} class="stack">
					<input type="hidden" name="bucket_key" value={data.currentBucket?.bucket_key} />
					{#if data.currentFolder}
						<input type="hidden" name="folder_id" value={data.currentFolder.id} />
					{/if}
					
					<div>
						<label for="file">Upload File</label>
						<input 
							type="file" 
							id="file" 
							name="file" 
							required 
							disabled={uploading}
						/>
					</div>
					
					<button type="submit" class="btn btn--primary" disabled={uploading}>
						{uploading ? 'Uploading...' : 'Upload'}
					</button>
				</form>
			</div>
			
			<!-- Contents -->
			<div class="paper stack">
				<div class="row" style="justify-content: space-between; align-items: center;">
					<h2 class="t-label">
						{data.currentFolder ? data.currentFolder.name : 'My Files'}
					</h2>
					
					<!-- Search -->
					<div style="display: flex; align-items: center; gap: 0.5rem;">
						<input 
							type="text" 
							bind:value={searchQuery}
							placeholder="Search files..."
							style="padding: 0.25rem 0.5rem; width: 200px;"
						/>
					</div>
				</div>
				
				<!-- Sort Controls -->
				<div style="display: flex; gap: 0.5rem; align-items: center; color: var(--ink-muted); font-size: 0.875rem;">
					<span>Sort by:</span>
					<button 
						onclick={() => toggleSort('name')} 
						class="btn btn--secondary"
						style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
					>
						Name {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
					</button>
					<button 
						onclick={() => toggleSort('size')} 
						class="btn btn--secondary"
						style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
					>
						Size {sortBy === 'size' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
					</button>
					<button 
						onclick={() => toggleSort('date')} 
						class="btn btn--secondary"
						style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
					>
						Date {sortBy === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
					</button>
				</div>
				
				{#if filteredAndSortedFolders().length === 0 && filteredAndSortedFiles().length === 0}
					<p style="color: var(--ink-subtle);">
						{searchQuery ? 'No matching files or folders.' : 'This folder is empty.'}
					</p>
				{:else}
					<table style="width: 100%; border-collapse: collapse;">
						<thead>
							<tr style="border-bottom: 1px solid var(--border-heavy);">
								<th style="text-align: left; padding: 0.5rem;" class="t-label">Name</th>
								<th style="text-align: left; padding: 0.5rem;" class="t-label">Type</th>
								<th style="text-align: left; padding: 0.5rem;" class="t-label">Size</th>
								<th style="text-align: left; padding: 0.5rem;" class="t-label">Date</th>
								<th style="text-align: right; padding: 0.5rem;" class="t-label">Actions</th>
							</tr>
						</thead>
						<tbody>
							<!-- Folders -->
							{#each filteredAndSortedFolders() as folder}
								<tr style="border-bottom: 1px solid var(--border);">
									<td style="padding: 0.5rem;">
										{#if renamingFolderId === folder.id}
											<div style="display: flex; gap: 0.25rem; align-items: center;">
												<input 
													type="text" 
													bind:value={renameValue}
													style="padding: 0.25rem; flex: 1;"
													onkeydown={(e) => {
														if (e.key === 'Enter') saveRename();
														if (e.key === 'Escape') cancelRename();
													}}
												/>
												<button onclick={saveRename} class="btn btn--primary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Save</button>
												<button onclick={cancelRename} class="btn btn--secondary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cancel</button>
											</div>
										{:else}
											<button 
												onclick={() => navigateToFolder(folder.id)} 
												style="background: none; border: none; color: var(--gold); cursor: pointer; padding: 0; font-family: inherit; text-align: left;"
											>
												📁 {folder.name}
											</button>
										{/if}
									</td>
									<td style="padding: 0.5rem;">Folder</td>
									<td style="padding: 0.5rem;">—</td>
									<td style="padding: 0.5rem;">{formatDate(folder.created_at)}</td>
									<td style="padding: 0.5rem; text-align: right;">
										{#if renamingFolderId !== folder.id}
											<div class="row" style="justify-content: flex-end; gap: 0.5rem;">
												<button 
													onclick={() => startRenamingFolder(folder.id, folder.name)} 
													class="btn btn--secondary" 
													style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
												>
													Rename
												</button>
												<button 
													onclick={() => deleteFolder(folder.id)} 
													class="btn btn--secondary" 
													style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
												>
													Delete
												</button>
											</div>
										{/if}
									</td>
								</tr>
							{/each}
							
							<!-- Files -->
							{#each filteredAndSortedFiles() as file}
								<tr style="border-bottom: 1px solid var(--border);">
									<td style="padding: 0.5rem;">
										{#if renamingFileId === file.id}
											<div style="display: flex; gap: 0.25rem; align-items: center;">
												<input 
													type="text" 
													bind:value={renameValue}
													style="padding: 0.25rem; flex: 1;"
													onkeydown={(e) => {
														if (e.key === 'Enter') saveRename();
														if (e.key === 'Escape') cancelRename();
													}}
												/>
												<button onclick={saveRename} class="btn btn--primary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Save</button>
												<button onclick={cancelRename} class="btn btn--secondary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cancel</button>
											</div>
										{:else}
											{file.filename}
										{/if}
									</td>
									<td style="padding: 0.5rem;">File</td>
									<td style="padding: 0.5rem;" class="t-numeric">{formatBytes(file.size_bytes)}</td>
									<td style="padding: 0.5rem;">{formatDate(file.uploaded_at)}</td>
									<td style="padding: 0.5rem; text-align: right;">
										{#if movingFileId === file.id}
											<div style="display: flex; gap: 0.25rem; align-items: center; justify-content: flex-end;">
												<select bind:value={moveDestinationFolderId} style="padding: 0.25rem;">
													<option value={null}>Root</option>
													{#each data.folders as folder}
														<option value={folder.id}>{folder.name}</option>
													{/each}
												</select>
												<button onclick={saveMove} class="btn btn--primary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Move</button>
												<button onclick={cancelMove} class="btn btn--secondary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cancel</button>
											</div>
										{:else if renamingFileId !== file.id}
											<div class="row" style="justify-content: flex-end; gap: 0.5rem;">
												<a href="/api/files/{file.id}" class="btn btn--secondary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
													Download
												</a>
												{#if file.filename.endsWith('.json')}
													<button 
														onclick={() => submitToGovernance(file.id, file.filename)} 
														class="btn btn--primary" 
														style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
													>
														Submit to Governance
													</button>
												{/if}
												<button 
													onclick={() => startMovingFile(file.id)} 
													class="btn btn--secondary" 
													style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
												>
													Move
												</button>
												<button 
													onclick={() => startRenamingFile(file.id, file.filename)} 
													class="btn btn--secondary" 
													style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
												>
													Rename
												</button>
												<button 
													onclick={() => deleteFile(file.id)} 
													class="btn btn--secondary" 
													style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
												>
													Delete
												</button>
											</div>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</div>
	{/if}
</div>
