<script lang="ts">
	import type { ProseDocument } from '$lib/server/documents/library-types.js';
	import DocumentView from './DocumentView.svelte';

	let { document: doc }: { document: ProseDocument } = $props();
</script>

<DocumentView>
	{#snippet header()}
		<div class="document-title-block">
			<h1 class="document-title">{doc.title}</h1>
			<div class="document-meta">
				<span class="type-badge">📄 Document</span>
				<span class="status-badge status--{doc.content.status}">
					{doc.content.status}
				</span>
			</div>
		</div>
		{#if doc.content.summary}
			<p class="document-summary">{doc.content.summary}</p>
		{/if}
		{#if doc.content.published_at}
			<div class="document-dates">
				<div class="date-line">
					<span class="date-label">Published:</span>
					<span class="date-value">{doc.content.published_at.slice(0, 10)}</span>
				</div>
			</div>
		{/if}
		{#if doc.content.tags && doc.content.tags.length > 0}
			<div class="document-tags">
				{#each doc.content.tags as tag}
					<span class="tag">{tag}</span>
				{/each}
			</div>
		{/if}
	{/snippet}

	{#snippet body()}
		<div class="prose-body">
			{#each doc.content.paragraphs as paragraph}
				<p class="prose-paragraph">{paragraph}</p>
			{/each}
		</div>
	{/snippet}
</DocumentView>

<style>
	.document-summary {
		font-size: var(--text-base);
		font-style: italic;
		color: #5a4a2a;
		margin: var(--space-4) 0;
		padding: var(--space-4);
		background: rgba(212, 162, 74, 0.1);
		border-left: 3px solid #d4a24a;
		border-radius: 2px;
	}

	.document-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-top: var(--space-4);
		justify-content: center;
	}

	.tag {
		display: inline-block;
		padding: var(--space-1) var(--space-3);
		background: rgba(212, 162, 74, 0.2);
		border: 1px solid rgba(139, 115, 85, 0.3);
		border-radius: 12px;
		font-size: var(--text-xs);
		color: #5a4a2a;
		font-weight: 500;
	}

	.prose-body {
		max-width: 65ch;
		margin: 0 auto;
		font-family: 'Libre Baskerville', Georgia, serif;
		color: #2c2416;
	}

	.prose-paragraph {
		margin-bottom: var(--space-6);
	}

	.prose-paragraph:first-child {
		margin-top: 0;
	}

	.prose-paragraph:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 768px) {
		.prose-paragraph {
			text-align: left;
		}
	}
</style>
