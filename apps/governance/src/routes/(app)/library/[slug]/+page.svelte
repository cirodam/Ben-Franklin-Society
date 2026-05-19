<script lang="ts">
	import type { PageData } from './$types.js';
	import GoverningDocumentView from './views/GoverningDocumentView.svelte';
	import ProseDocumentView from './views/ProseDocumentView.svelte';
	import ContractDocumentView from './views/ContractDocumentView.svelte';

	let { data }: { data: PageData } = $props();

	const { document: doc, canEdit, documentType } = $derived(data);
</script>

<svelte:head>
	<style>
		html {
			scroll-behavior: smooth;
		}
	</style>
</svelte:head>

<div class="document-controls">
	<a href="/library" class="back">← Back to Library</a>
	{#if canEdit && (documentType === 'prose' || documentType === 'contract')}
		<a href="/library/{doc.slug}/edit" class="edit-link">✏️ Edit</a>
	{/if}
</div>

{#if documentType === 'prose'}
	<ProseDocumentView document={doc as unknown as import('$lib/server/documents/library-types.js').ProseDocument} />
{:else if documentType === 'contract'}
	<ContractDocumentView document={doc as unknown as import('$lib/server/documents/library-types.js').ContractDocument} />
{:else}
	<GoverningDocumentView document={doc as unknown as import('$lib/server/documents/library-types.js').GoverningDocument} {canEdit} />
{/if}

<style>
	.document-controls {
		max-width: 1000px;
		margin: 0 auto var(--space-6);
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius);
		transition: all 0.2s;
	}

	.back:hover {
		background: rgba(255, 255, 255, 0.9);
		color: var(--color-text);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.edit-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		text-decoration: none;
		font-size: var(--text-sm);
		transition: all 0.15s;
	}

	.edit-link:hover {
		background: var(--color-background-hover);
		border-color: var(--color-border-hover);
	}
</style>
