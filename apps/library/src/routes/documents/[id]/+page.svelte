<script lang="ts">
	import type { PageData } from './$types.js';
	import { MotionDocument, GoverningDocument } from '@bfs/ui';
	import type { MotionDocument as MotionDocType, GoverningDocument as GoverningDocType } from '@bfs/types';
	import { goto } from '$app/navigation';

	const { data } = $props<{ data: PageData }>();

	let document = $state(data.document);
	let saving = $state(false);

	async function handleSave(updates: Partial<MotionDocType | GoverningDocType>) {
		document = { ...document, ...updates, updated_at: new Date().toISOString() };
		saving = true;

		try {
			const formData = new FormData();
			formData.append('document', JSON.stringify(document));

			const response = await fetch('?/save', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type !== 'success') {
				throw new Error('Save failed');
			}
		} catch (err) {
			console.error('Failed to save document:', err);
			throw err;
		} finally {
			saving = false;
		}
	}

	function handleBack() {
		goto('/');
	}
</script>

<svelte:head>
	<style>
		:global(.app-shell__main) {
			background: linear-gradient(135deg, #e8e4d9 0%, #d4cfc0 100%) !important;
		}
		:global(.app-shell__content) {
			padding: 0 !important;
		}
	</style>
</svelte:head>

<div class="document-page">
	<button onclick={handleBack} class="back-button">
		← back to library
	</button>

	<div class="document-wrapper">
		{#if document.type === 'motion'}
			<MotionDocument
				motion={document as MotionDocType}
				editable={true}
				onSave={handleSave}
			/>
		{:else if document.type === 'governing'}
			<GoverningDocument
				document={document as GoverningDocType}
				editable={true}
				onSave={handleSave}
			/>
		{:else}
			<div class="unsupported">
				<p>Unsupported document type: {document.type}</p>
				<pre>{JSON.stringify(document, null, 2)}</pre>
			</div>
		{/if}
	</div>
</div>

<style>
	.document-page {
		min-height: 100vh;
		padding: var(--space-8, 2rem);
		display: flex;
		flex-direction: column;
		gap: var(--space-6, 1.5rem);
	}

	.back-button {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 0.875rem;
		padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
		border: 1px solid rgba(45, 90, 79, 0.3);
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.8);
		color: #2d5a4f;
		cursor: pointer;
		transition: all 0.15s;
		align-self: flex-start;
	}

	.back-button:hover {
		background: white;
		border-color: rgba(45, 90, 79, 0.5);
	}

	.document-wrapper {
		display: flex;
		justify-content: center;
	}

	.unsupported {
		max-width: 1000px;
		margin: 0 auto;
		padding: var(--space-8, 2rem);
		background: white;
		border-radius: 4px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.unsupported pre {
		font-family: monospace;
		background: #f5f5f5;
		padding: var(--space-4, 1rem);
		border-radius: 4px;
		overflow: auto;
	}
</style>
