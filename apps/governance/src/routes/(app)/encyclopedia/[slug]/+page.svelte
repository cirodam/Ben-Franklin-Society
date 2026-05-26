<script lang="ts">
	import Card from '@bfs/ui/Card.svelte';
	import Badge from '@bfs/ui/Badge.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Simple markdown to HTML conversion
	// This is very basic - you can replace with a proper markdown library later
	function renderMarkdown(md: string): string {
		let html = md;

		// Headers
		html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
		html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
		html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

		// Bold
		html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

		// Italic
		html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

		// Code blocks
		html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

		// Inline code
		html = html.replace(/`(.*?)`/g, '<code>$1</code>');

		// Links - regular markdown links
		html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

		// Wiki links [[Article Name]] -> /encyclopedia/article-name
		html = html.replace(/\[\[([^\]]+)\]\]/g, (match, title) => {
			const slug = title.toLowerCase().replace(/\s+/g, '-');
			return `<a href="/encyclopedia/${slug}" class="wiki-link">${title}</a>`;
		});

		// Lists
		html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
		html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

		// Paragraphs
		html = html.split('\n\n').map(para => {
			if (para.startsWith('<') || para.trim() === '') return para;
			return `<p>${para}</p>`;
		}).join('\n');

		return html;
	}

	const renderedContent = $derived(renderMarkdown(data.article.content));
</script>

<svelte:head>
	<title>{data.article.metadata.title} - Encyclopedia</title>
</svelte:head>

<div class="article-page">
	<nav class="breadcrumb">
		<a href="/encyclopedia">Encyclopedia</a>
		<span>/</span>
		<span>{data.article.metadata.title}</span>
	</nav>

	<Card>
		<article class="article">
			<header class="article-header">
				{#if data.article.metadata.category}
					<Badge variant="neutral">{data.article.metadata.category}</Badge>
				{/if}
				{#if data.article.metadata.author}
					<p class="meta">By {data.article.metadata.author}</p>
				{/if}
				{#if data.article.metadata.created}
					<p class="meta">{new Date(data.article.metadata.created).toLocaleDateString()}</p>
				{/if}
			</header>

			<div class="article-content">
				{@html renderedContent}
			</div>
		</article>
	</Card>
</div>

<style>
	.article-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.breadcrumb {
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.breadcrumb a {
		color: var(--accent);
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.breadcrumb span {
		margin: 0 0.5rem;
	}

	.article-header {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
	}

	.meta {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.article-content :global(h1) {
		font-size: 2rem;
		margin: 2rem 0 1rem 0;
	}

	.article-content :global(h2) {
		font-size: 1.5rem;
		margin: 1.5rem 0 0.75rem 0;
	}

	.article-content :global(h3) {
		font-size: 1.25rem;
		margin: 1.25rem 0 0.5rem 0;
	}

	.article-content :global(p) {
		margin: 1rem 0;
		line-height: 1.6;
	}

	.article-content :global(ul) {
		margin: 1rem 0;
		padding-left: 1.5rem;
	}

	.article-content :global(li) {
		margin: 0.5rem 0;
		line-height: 1.6;
	}

	.article-content :global(code) {
		background: var(--bg-secondary);
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		font-size: 0.875rem;
		font-family: 'Courier New', monospace;
	}

	.article-content :global(pre) {
		background: var(--bg-secondary);
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		margin: 1rem 0;
	}

	.article-content :global(pre code) {
		background: none;
		padding: 0;
	}

	.article-content :global(a) {
		color: var(--accent);
		text-decoration: none;
	}

	.article-content :global(a:hover) {
		text-decoration: underline;
	}

	.article-content :global(.wiki-link) {
		color: var(--accent);
		font-weight: 500;
	}
</style>
