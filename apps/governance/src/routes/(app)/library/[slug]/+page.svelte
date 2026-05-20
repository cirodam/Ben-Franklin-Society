<script lang="ts">
	import type { PageData } from './$types.js';
	import GoverningDocumentView from './views/GoverningDocumentView.svelte';
	import ProseDocumentView from './views/ProseDocumentView.svelte';
	import ContractDocumentView from './views/ContractDocumentView.svelte';
	import MotionDocumentView from './views/MotionDocumentView.svelte';

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
	<a href="/library" class="back">← Library</a>
	{#if canEdit && (documentType === 'prose' || documentType === 'contract')}
		<a href="/library/{doc.slug}/edit" class="edit-link">Edit</a>
	{/if}
</div>

{#if documentType === 'prose'}
	<ProseDocumentView document={doc as unknown as import('$lib/server/documents/library-types.js').ProseDocument} />
{:else if documentType === 'contract'}
	<ContractDocumentView document={doc as unknown as import('$lib/server/documents/library-types.js').ContractDocument} />
{:else if documentType === 'motion'}
	<MotionDocumentView document={doc as unknown as import('$lib/server/documents/library-types.js').MotionDocument} />
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
		padding: 0 var(--space-4);
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		color: var(--ink-mid);
		text-decoration: none;
		background: transparent;
		border: 1px solid var(--border);
		transition: all 0.2s;
	}

	.back:hover {
		background: var(--paper);
		color: var(--ink);
		border-color: var(--gold-hover);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.edit-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		color: var(--gold);
		text-decoration: none;
		background: transparent;
		border: 1px solid var(--border);
		transition: all 0.2s;
	}

	.edit-link:hover {
		background: var(--paper);
		color: var(--gold);
		border-color: var(--gold-hover);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}
</style>
