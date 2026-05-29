<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { Button, Textarea, Input } from '@bfs/ui';
	import type { MotionDocument } from '$lib/server/documents/library-types.js';
	
	let { 
		show = $bindable(false),
		bodyName = 'this body',
		bodyUuid = '',
		draftMotions = []
	}: {
		show?: boolean;
		bodyName?: string;
		bodyUuid?: string;
		draftMotions?: MotionDocument[];
	} = $props();

	interface LibraryFile {
		id: number;
		filename: string;
		path: string;
		size_bytes: number;
		uploaded_at: string;
	}

	let mode = $state<'create' | 'introduce' | 'library'>('create');
	let selectedMotion = $state<string>('');
	let selectedLibraryFile = $state<number | null>(null);
	let libraryFiles = $state<LibraryFile[]>([]);
	let loadingLibraryFiles = $state(false);
	let libraryError = $state<string | null>(null);
	let importingFromLibrary = $state(false);
	
	// Governing document import state
	let alsoImportGoverning = $state(false);
	let selectedGoverningFile = $state<number | null>(null);
	let governingFiles = $state<LibraryFile[]>([]);
	let loadingGoverningFiles = $state(false);
	let governingError = $state<string | null>(null);

	// Load library files when library mode is selected
	$effect(() => {
		if (mode === 'library' && libraryFiles.length === 0 && !loadingLibraryFiles) {
			loadLibraryFiles();
		}
	});
	
	// Load governing files when "Also import governing" is checked
	$effect(() => {
		if (alsoImportGoverning && governingFiles.length === 0 && !loadingGoverningFiles) {
			loadGoverningFiles();
		}
	});

	async function loadLibraryFiles() {
		loadingLibraryFiles = true;
		libraryError = null;
		try {
			const response = await fetch('/api/library/list-motion-files');
			if (!response.ok) {
				throw new Error('Failed to load library files');
			}
			const data = await response.json();
			libraryFiles = data.files || [];
		} catch (err: any) {
			console.error('Error loading library files:', err);
			libraryError = err.message || 'Failed to load library files';
		} finally {
			loadingLibraryFiles = false;
		}
	}
	
	async function loadGoverningFiles() {
		loadingGoverningFiles = true;
		governingError = null;
		try {
			const response = await fetch('/api/library/list-governing-files');
			if (!response.ok) {
				throw new Error('Failed to load governing document files');
			}
			const data = await response.json();
			governingFiles = data.files || [];
		} catch (err: any) {
			console.error('Error loading governing files:', err);
			governingError = err.message || 'Failed to load governing document files';
		} finally {
			loadingGoverningFiles = false;
		}
	}

	async function importFromLibrary(e: Event) {
		e.preventDefault();
		if (!selectedLibraryFile) return;

		importingFromLibrary = true;
		try {
			// Step 1: Import motion from library into governance
			const importResponse = await fetch('/api/library/import-motion', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ library_file_id: selectedLibraryFile })
			});

			if (!importResponse.ok) {
				const errorData = await importResponse.json();
				throw new Error(errorData.message || 'Failed to import motion');
			}

			const { motion_uuid, slug } = await importResponse.json();
			
			// Step 2: Also import governing document if requested
			if (alsoImportGoverning && selectedGoverningFile) {
				const governingResponse = await fetch('/api/library/import-governing', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ library_file_id: selectedGoverningFile })
				});

				if (!governingResponse.ok) {
					const errorData = await governingResponse.json();
					console.warn('Failed to import governing document:', errorData.message);
					// Don't throw - motion already imported successfully
					alert(`Motion imported successfully, but governing document import failed: ${errorData.message}`);
				}
			}

			// Step 3: Reload page data to include the new draft, then switch to "From Drafts" tab
			await invalidateAll();
			mode = 'introduce';
			selectedLibraryFile = null;
			libraryFiles = [];
			alsoImportGoverning = false;
			selectedGoverningFile = null;
			governingFiles = [];
		} catch (err: any) {
			console.error('Error importing from library:', err);
			alert(err.message || 'Failed to import motion from library');
		} finally {
			importingFromLibrary = false;
		}
	}

	function closeModal() {
		show = false;
		selectedMotion = '';
		selectedLibraryFile = null;
		mode = 'create';
		libraryFiles = [];
		libraryError = null;
		alsoImportGoverning = false;
		selectedGoverningFile = null;
		governingFiles = [];
		governingError = null;
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			closeModal();
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

{#if show}
	<div class="modal-overlay" onclick={handleOverlayClick}>
		<div class="modal">
			<div class="modal__header">
				<h2>Introduce Motion to {bodyName}</h2>
				<button type="button" class="modal__close" onclick={closeModal}>×</button>
			</div>

		<div class="mode-tabs">
			<button 
				class="mode-tab"
				class:active={mode === 'create'}
				onclick={() => {
					closeModal();
					goto(`/governance/motions/new?body=${encodeURIComponent(bodyUuid)}`);
				}}
			>
				Create New
			</button>
			<button 
				class="mode-tab"
				class:active={mode === 'introduce'}
				onclick={() => mode = 'introduce'}
			>
				From Drafts {#if draftMotions.length > 0}({draftMotions.length}){/if}
			</button>
			<button 
				class="mode-tab"
				class:active={mode === 'library'}
				onclick={() => mode = 'library'}
			>
				From Library
			</button>
		</div>

			{#if mode === 'introduce'}
				<form method="POST" action="?/introduceMotion" use:enhance>
					<div class="motion-list">
						{#if draftMotions.length === 0}
							<div class="empty-state">
								<p>No draft motions available.</p>
								<p class="empty-state__hint">Create a draft motion first, then introduce it here.</p>
							</div>
						{:else}
							{#each draftMotions as motion}
								<label class="motion-card">
									<input 
										type="radio" 
										name="motion_slug" 
										value={motion.slug}
										bind:group={selectedMotion}
									/>
									<div class="motion-card__content">
										<div class="motion-card__title">{motion.title}</div>
										{#if motion.content.provisions.length > 0}
											<div class="motion-card__preview">
												{motion.content.provisions[0].text.slice(0, 150)}{motion.content.provisions[0].text.length > 150 ? '...' : ''}
											</div>
										{/if}
										<div class="motion-card__meta">
											Created {new Date(motion.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
										</div>
									</div>
								</label>
							{/each}
						{/if}
					</div>
					
					<div class="modal__actions">
						<Button variant="secondary" onclick={closeModal}>Cancel</Button>
						<Button type="submit" disabled={!selectedMotion}>Introduce Motion</Button>
					</div>
				</form>
			{:else if mode === 'library'}
				<form onsubmit={importFromLibrary}>
					<div class="motion-list">
						{#if loadingLibraryFiles}
							<div class="empty-state">
								<p>Loading your library files...</p>
							</div>
						{:else if libraryError}
							<div class="empty-state error">
								<p>Error: {libraryError}</p>
								<Button variant="secondary" onclick={loadLibraryFiles}>Retry</Button>
							</div>
						{:else if libraryFiles.length === 0}
							<div class="empty-state">
								<p>No motion files found in your library.</p>
								<p class="empty-state__hint">Upload JSON motion files to your library bucket to import them here.</p>
							</div>
						{:else}
							{#each libraryFiles as file}
								<label class="motion-card">
									<input 
										type="radio" 
										name="library_file_id" 
										value={file.id}
										bind:group={selectedLibraryFile}
									/>
									<div class="motion-card__content">
										<div class="motion-card__title">{file.filename}</div>
										<div class="motion-card__preview">
											{file.path}
										</div>
										<div class="motion-card__meta">
											{formatFileSize(file.size_bytes)} • Uploaded {new Date(file.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
										</div>
									</div>
								</label>
							{/each}
						{/if}
					</div>
					
					<!-- Optional governing document import -->
					{#if selectedLibraryFile}
						<div class="governing-import-section">
							<label class="checkbox-label">
								<input 
									type="checkbox" 
									bind:checked={alsoImportGoverning}
								/>
								<span>Also import a governing document</span>
							</label>
							
							{#if alsoImportGoverning}
								<div class="governing-list">
									{#if loadingGoverningFiles}
										<div class="empty-state small">
											<p>Loading governing documents...</p>
										</div>
									{:else if governingError}
										<div class="empty-state error small">
											<p>Error: {governingError}</p>
											<Button variant="secondary" size="sm" onclick={loadGoverningFiles}>Retry</Button>
										</div>
									{:else if governingFiles.length === 0}
										<div class="empty-state small">
											<p>No governing document files found in your library.</p>
										</div>
									{:else}
										{#each governingFiles as file}
											<label class="motion-card small">
												<input 
													type="radio" 
													name="governing_file_id" 
													value={file.id}
													bind:group={selectedGoverningFile}
												/>
												<div class="motion-card__content">
													<div class="motion-card__title">{file.filename}</div>
													<div class="motion-card__preview">
														{file.path}
													</div>
													<div class="motion-card__meta">
														{formatFileSize(file.size_bytes)} • {new Date(file.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
													</div>
												</div>
											</label>
										{/each}
									{/if}
								</div>
							{/if}
						</div>
					{/if}
					
					<div class="modal__actions">
						<Button variant="secondary" onclick={closeModal}>Cancel</Button>
						<Button type="submit" disabled={!selectedLibraryFile || importingFromLibrary}>
							{importingFromLibrary ? 'Importing...' : 'Import & View'}
						</Button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: var(--space-4);
	}

	.modal {
		background: var(--paper, #fafaf7);
		border-radius: var(--radius-lg);
		max-width: 700px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-5);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.modal__header h2 {
		margin: 0;
		font-size: var(--text-xl);
		font-family: var(--font-display);
		color: var(--ink);
	}

	.modal__close {
		background: none;
		border: none;
		font-size: var(--text-2xl);
		cursor: pointer;
		color: var(--ink-mid);
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal__close:hover {
		color: var(--ink);
	}

	.mode-tabs {
		display: flex;
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.mode-tab {
		flex: 1;
		padding: var(--space-3);
		background: none;
		border: none;
		font-family: var(--font-label);
		font-size: var(--text-sm);
		letter-spacing: 0.08em;
		color: var(--ink-mid);
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
	}

	.mode-tab:hover {
		color: var(--ink);
		background: var(--tint-gold);
	}

	.mode-tab.active {
		color: var(--ink);
		border-bottom-color: var(--gold);
		background: var(--tint-gold);
	}

	form {
		padding: var(--space-5);
	}

	.form-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-bottom: var(--space-5);
	}

	.motion-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-height: 60vh;
		overflow-y: auto;
		padding: var(--space-1);
		margin-bottom: var(--space-5);
	}

	.motion-card {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-4);
		border: 2px solid rgba(45, 90, 79, 0.15);
		border-radius: var(--radius-md);
		background: white;
		cursor: pointer;
		transition: all 0.2s;
	}

	.motion-card:hover {
		border-color: rgba(122, 92, 26, 0.4);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.motion-card:has(input:checked) {
		border-color: var(--gold);
		background: rgba(122, 92, 26, 0.03);
		box-shadow: 0 2px 8px rgba(122, 92, 26, 0.1);
	}

	.motion-card input[type="radio"] {
		flex-shrink: 0;
		margin-top: 0.25rem;
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
	}

	.motion-card__content {
		flex: 1;
	}

	.motion-card__title {
		font-family: var(--font-prose);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--ink);
		margin-bottom: var(--space-2);
	}

	.motion-card__preview {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
		line-height: 1.6;
		margin-bottom: var(--space-2);
	}

	.motion-card__meta {
		font-family: var(--font-label);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--gold);
	}

	.empty-state {
		padding: var(--space-8) var(--space-5);
		text-align: center;
	}

	.empty-state.error {
		color: var(--rust);
	}

	.empty-state p {
		font-family: var(--font-prose);
		color: var(--ink-mid);
		margin-bottom: var(--space-2);
	}

	.empty-state.error p {
		color: var(--rust);
	}

	.empty-state__hint {
		font-size: var(--text-sm);
		font-style: italic;
	}

	.modal__actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-4);
		border-top: 1px solid rgba(45, 90, 79, 0.1);
	}

	.governing-import-section {
		margin-top: var(--space-5);
		padding-top: var(--space-5);
		border-top: 2px solid rgba(45, 90, 79, 0.1);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--ink);
		margin-bottom: var(--space-4);
	}

	.checkbox-label input[type="checkbox"] {
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
	}

	.governing-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-height: 40vh;
		overflow-y: auto;
		padding: var(--space-1);
	}

	.motion-card.small {
		padding: var(--space-3);
	}

	.motion-card.small .motion-card__title {
		font-size: var(--text-base);
	}

	.motion-card.small .motion-card__preview {
		font-size: var(--text-xs);
	}

	.empty-state.small {
		padding: var(--space-4) var(--space-3);
	}
</style>
