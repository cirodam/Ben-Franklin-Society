<script lang="ts">
	import { Card, Badge } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Group articles by category
	const articlesByCategory = $derived.by(() => {
		const grouped = new Map<string, typeof data.articles>();
		
		data.articles.forEach(article => {
			const category = article.metadata.category || 'Uncategorized';
			if (!grouped.has(category)) {
				grouped.set(category, []);
			}
			grouped.get(category)!.push(article);
		});

		return grouped;
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
			{#each articlesByCategory as [category, articles]}
				<section class="category-section">
					<h2 class="category-title">{category}</h2>
					<div class="articles-grid">
						{#each articles as article}
							<Card>
								<a href="/encyclopedia/{article.slug}" class="article-card">
									<h3 class="article-title">{article.metadata.title}</h3>
									<div class="article-meta">
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
				</section>
			{/each}
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

	.category-section {
		margin-bottom: var(--space-10);
	}

	.category-title {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-xl);
		font-weight: 400;
		margin: 0 0 var(--space-5) 0;
		color: var(--ink);
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
		font-family: 'IM Fell English', serif;
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
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
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
