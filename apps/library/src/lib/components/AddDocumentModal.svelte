<!--
  @component AddDocumentModal
  Modal for creating new documents or uploading existing JSON files.
  
  @prop {boolean} open - Whether modal is open
  @prop {string | null} currentBucketKey - Current bucket key for upload
  @prop {number | null} currentFolderId - Current folder ID for upload
  @prop {() => void} onClose - Close modal callback
  @prop {(event: Event) => Promise<void>} onUpload - Handle file upload
  @prop {boolean} uploading - Whether upload is in progress
  @prop {string | null} uploadError - Upload error message if any
-->
<script lang="ts">
	import { Modal } from '@bfs/ui';
	import { goto } from '$app/navigation';
	
	interface Props {
		open: boolean;
		currentBucketKey: string | null;
		currentFolderId: number | null;
		onClose: () => void;
		onUpload: (event: Event) => Promise<void>;
		uploading: boolean;
		uploadError: string | null;
	}
	
	let {
		open = $bindable(),
		currentBucketKey,
		currentFolderId,
		onClose,
		onUpload,
		uploading,
		uploadError
	}: Props = $props();
	
	let activeTab = $state<'create' | 'upload'>('create');
	
	// Reset upload error when changing tabs or closing modal
	$effect(() => {
		if (!open || activeTab === 'create') {
			// uploadError is managed by parent
		}
	});
</script>

<Modal bind:open title="Add Document" size="md">
	<div class="modal-tabs">
		<button 
			class="modal-tab"
			class:active={activeTab === 'create'}
			onclick={() => activeTab = 'create'}
		>
			create
		</button>
		<button 
			class="modal-tab"
			class:active={activeTab === 'upload'}
			onclick={() => activeTab = 'upload'}
		>
			upload
		</button>
	</div>

	{#if activeTab === 'create'}
		<div class="create-content">
			<p class="create-description">
				Choose a document type to create:
			</p>
			<div class="document-type-buttons">
				<button onclick={() => goto('/documents/new/motion')} class="btn btn--primary">
					new motion
				</button>
				<button onclick={() => goto('/documents/new/governing')} class="btn btn--primary">
					new governing document
				</button>
			</div>
		</div>
	{:else}
		<form onsubmit={onUpload} class="upload-content">
			<input type="hidden" name="bucket_key" value={currentBucketKey} />
			{#if currentFolderId}
				<input type="hidden" name="folder_id" value={currentFolderId} />
			{/if}
			
			<p class="upload-description">
				Upload a JSON document file to your library.
			</p>
			
			<div class="upload-form">
				<input 
					type="file" 
					id="modal_file" 
					name="file" 
					accept=".json"
					required 
					disabled={uploading}
				/>
			</div>
			
			{#if uploadError}
				<div style="padding: 0.75rem; background: #fdd; border: 1px solid var(--red); border-radius: var(--radius-sm);">
					{uploadError}
				</div>
			{/if}
			
			<div style="display: flex; justify-content: flex-end; gap: var(--space-3);">
				<button 
					type="button" 
					class="btn btn--secondary" 
					onclick={onClose}
					disabled={uploading}
				>
					cancel
				</button>
				<button 
					type="submit" 
					class="btn btn--primary" 
					disabled={uploading}
				>
					{uploading ? 'uploading...' : 'upload'}
				</button>
			</div>
		</form>
	{/if}
</Modal>

<style>
	/* Modal tabs */
	.modal-tabs {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-6);
		border-bottom: 1px solid var(--border);
	}

	.modal-tab {
		font-family: var(--font-label);
		font-size: 0.875rem;
		text-transform: lowercase;
		letter-spacing: 0.025em;
		padding: var(--space-3) var(--space-4);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		color: var(--ink-muted);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.modal-tab:hover {
		color: var(--ink);
	}

	.modal-tab.active {
		color: var(--ink);
		border-bottom-color: var(--accent);
	}

	/* Create content */
	.create-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.create-description {
		font-family: var(--font-prose);
		font-size: 0.875rem;
		color: var(--ink-muted);
		line-height: 1.5;
	}

	.document-type-buttons {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	/* Upload content */
	.upload-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.upload-description {
		font-family: var(--font-prose);
		font-size: 0.875rem;
		color: var(--ink-muted);
		margin-top: calc(-1 * var(--space-2));
	}

	.upload-form input[type='file'] {
		padding: var(--space-4);
		border: 2px dashed var(--border-heavy);
		border-radius: var(--radius-sm);
		background: var(--paper);
		cursor: pointer;
	}

	.upload-form input[type='file']:hover {
		border-color: var(--accent);
		background: var(--tint-green);
	}
</style>
