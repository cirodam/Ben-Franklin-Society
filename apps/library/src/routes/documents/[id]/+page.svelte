<script lang="ts">
	import type { PageData } from './$types.js';
	import { MotionEditor, GoverningDocEditor } from '@bfs/ui';
	import type { MotionDocument, GoverningDocument } from '@bfs/types';
	import { goto } from '$app/navigation';

	const { data } = $props<{ data: PageData }>();

	let document = $state(data.document);
	let saving = $state(false);
	let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let editorRef: any;

	// Auto-save debouncing
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	function scheduleSave() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
		saveTimeout = setTimeout(() => {
			handleSave();
		}, 2000); // Auto-save after 2 seconds of no changes
	}

	async function handleSave() {
		// Get current state from editor
		if (editorRef) {
			const updates = editorRef.getUpdates();
			document = { ...document, ...updates, updated_at: new Date().toISOString() };
		}

		saving = true;
		saveStatus = 'saving';

		try {
			const formData = new FormData();
			formData.append('document', JSON.stringify(document));

			const response = await fetch('?/save', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success') {
				saveStatus = 'saved';
				setTimeout(() => {
					if (saveStatus === 'saved') {
						saveStatus = 'idle';
					}
				}, 2000);
			} else {
				saveStatus = 'error';
			}
		} catch (err) {
			console.error('Failed to save document:', err);
			saveStatus = 'error';
		} finally {
			saving = false;
		}
	}

	function handleBack() {
		goto('/');
	}
</script>

<div class="document-workspace">
	<header class="workspace-header">
		<div class="header-left">
			<button onclick={handleBack} class="btn btn--sm">
				← back to library
			</button>
		</div>
		<div class="header-center">
			<h1 class="workspace-title">{document.title || 'Untitled Document'}</h1>
			<span class="document-type-badge">{document.type}</span>
		</div>
		<div class="header-right">
			{#if saveStatus === 'saving'}
				<span class="save-status saving">saving...</span>
			{:else if saveStatus === 'saved'}
				<span class="save-status saved">saved</span>
			{:else if saveStatus === 'error'}
				<span class="save-status error">error saving</span>
			{:else}
				<button onclick={handleSave} class="btn btn--primary btn--sm" disabled={saving}>
					save
				</button>
			{/if}
		</div>
	</header>

	<div class="workspace-content">
		{#if document.type === 'motion'}
			<MotionEditor bind:this={editorRef} motion={document as MotionDocument} />
		{:else if document.type === 'governing'}
			<GoverningDocEditor bind:this={editorRef} document={document as GoverningDocument} />
		{:else}
			<div class="unsupported">
				<p>Unsupported document type: {document.type}</p>
				<pre>{JSON.stringify(document, null, 2)}</pre>
			</div>
		{/if}
	</div>
</div>

<style>
	.document-workspace {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--paper);
	}

	.workspace-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-6);
		border-bottom: 1px solid var(--border);
		background: var(--paper);
	}

	.header-left,
	.header-right {
		flex: 0 0 200px;
	}

	.header-center {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
	}

	.workspace-title {
		font-family: var(--font-display);
		font-size: 1.5rem;
		color: var(--ink);
		margin: 0;
	}

	.document-type-badge {
		font-family: var(--font-label);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.125rem var(--space-2);
		background: var(--tint-green);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--ink-muted);
		white-space: nowrap;
	}

	.save-status {
		font-family: var(--font-label);
		font-size: 0.875rem;
		padding: var(--space-2) var(--space-3);
	}

	.save-status.saving {
		color: var(--ink-muted);
	}

	.save-status.saved {
		color: var(--green);
	}

	.save-status.error {
		color: var(--red);
	}

	.workspace-content {
		flex: 1;
		overflow: auto;
		padding: var(--space-6);
	}

	.unsupported {
		font-family: var(--font-prose);
		padding: var(--space-6);
	}

	.unsupported pre {
		font-family: monospace;
		background: var(--tint-gray);
		padding: var(--space-4);
		border-radius: var(--radius-sm);
		overflow: auto;
	}
</style>
