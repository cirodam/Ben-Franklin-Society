<script lang="ts">
	import { Card, Badge } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Sort articles alphabetically by title
	const sortedArticles = $derived.by(() => {
		return [...data.articles].sort((a, b) => 
			a.metadata.title.localeCompare(b.metadata.title)
		);
	});
</script>

<div class="encyclopedia">
	<header class="header">
		<h1 class="t-display">Encyclopedia</h1>
		<p class="t-prose subtitle">Knowledge base of philosophical and institutional foundations</p>
	</header>

	<div class="content">
		{#if data.articles.length === 0}
			<Card>
				<p class="t-prose">No articles yet. Add markdown files to <code>data/encyclopedia/</code> to get started.</p>
			</Card>
		{:else}
			<div class="articles-grid">
				{#each sortedArticles as article}
					<Card>
						<a href="/encyclopedia/{article.slug}" class="article-card">
							<h3 class="article-title">{article.metadata.title}</h3>
							<div class="article-meta">
								{#if article.metadata.category}
									<Badge variant="neutral">{article.metadata.category}</Badge>
								{/if}
								{#if article.metadata.author}
									<span class="meta-item">By {article.metadata.author}</span>
								{/if}
								{#if article.metadata.created}
									<span class="meta-item">{new Date(article.metadata.created).toLocaleDateString()}</span>
								{/if}
							</div>
						</a>
					</Card>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.encyclopedia {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-8) var(--space-4);
	}

	.header {
		text-align: center;
		margin-bottom: var(--space-10);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid var(--border);
	}

	.header h1 {
		margin: 0 0 var(--space-3) 0;
		font-size: clamp(2.25rem, 5vw, 3.5rem);
		color: var(--ink);
	}

	.subtitle {
		margin: 0;
		font-size: var(--text-md);
		color: var(--ink-mid);
	}

	.articles-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: var(--space-4);
	}

	.article-card {
		display: block;
		text-decoration: none;
		color: inherit;
		padding: var(--space-1);
		transition: background-color 0.15s ease;
	}

	.article-card:hover {
		background: var(--tint-gold);
	}

	.article-card:hover .article-title {
		color: var(--gold);
	}

	.article-title {
		font-size: var(--text-lg);
		font-weight: 400;
		margin: 0 0 var(--space-2) 0;
		color: var(--ink);
		transition: color 0.15s ease;
	}

	.article-meta {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.meta-item {
		font-size: var(--text-xs);
		letter-spacing: 0.05em;
		text-transform: lowercase;
		color: var(--ink-mid);
	}

	code {
		font-family: 'Courier New', monospace;
		font-size: var(--text-xs);
		color: var(--ink-mid);
		padding: var(--space-1) var(--space-2);
		background: var(--tint-green-mid);
		border: 1px solid var(--border-subtle);
		border-radius: 2px;
	}
</style>
