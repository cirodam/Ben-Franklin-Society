<script lang="ts">
	import Card from '@bfs/ui/Card.svelte';
	import Badge from '@bfs/ui/Badge.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Group articles by category
	const articlesByCategory = $derived(() => {
		const grouped = new Map<string, typeof data.articles>();
		
		data.articles.forEach(article => {
			const category = article.metadata.category || 'Uncategorized';
			if (!grouped.has(category)) {
				grouped.set(category, []);
			}
			grouped.get(category)!.push(article);
		});

		return grouped;
	})();
</script>

<div class="encyclopedia">
	<header class="header">
		<h1>Encyclopedia</h1>
		<p>Society knowledge base and documentation</p>
	</header>

	<div class="content">
		{#if data.articles.length === 0}
			<Card>
				<p>No articles yet. Add markdown files to <code>data/encyclopedia/</code> to get started.</p>
			</Card>
		{:else}
			{#each articlesByCategory as [category, articles]}
				<section class="category-section">
					<h2>{category}</h2>
					<div class="articles-grid">
						{#each articles as article}
							<Card>
								<a href="/encyclopedia/{article.slug}" class="article-link">
									<h3>{article.metadata.title}</h3>
									{#if article.metadata.author}
										<p class="meta">By {article.metadata.author}</p>
									{/if}
									{#if article.metadata.created}
										<p class="meta">{new Date(article.metadata.created).toLocaleDateString()}</p>
									{/if}
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
		padding: 2rem;
	}

	.header {
		margin-bottom: 2rem;
		border-bottom: 1px solid var(--border);
		padding-bottom: 1rem;
	}

	.header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}

	.header p {
		margin: 0;
		color: var(--text-secondary);
	}

	.category-section {
		margin-bottom: 3rem;
	}

	.category-section h2 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}

	.articles-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.article-link {
		display: block;
		text-decoration: none;
		color: inherit;
	}

	.article-link:hover h3 {
		color: var(--accent);
	}

	.article-link h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		transition: color 0.2s;
	}

	.meta {
		margin: 0.25rem 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	code {
		background: var(--bg-secondary);
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		font-size: 0.875rem;
	}
</style>
