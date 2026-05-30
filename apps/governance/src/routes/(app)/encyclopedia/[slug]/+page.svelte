<script lang="ts">
	import { Card, Badge } from '@bfs/ui';
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
		<span class="separator">/</span>
		<span class="current">{data.article.metadata.title}</span>
	</nav>

	<Card>
		<article class="article">
			<header class="article-header">
				<h1 class="article-title t-display">{data.article.metadata.title}</h1>
				<div class="article-meta">
					{#if data.article.metadata.category}
						<Badge variant="neutral">{data.article.metadata.category}</Badge>
					{/if}
					{#if data.article.metadata.author}
						<span class="meta-item">By {data.article.metadata.author}</span>
					{/if}
					{#if data.article.metadata.created}
						<span class="meta-item">{new Date(data.article.metadata.created).toLocaleDateString()}</span>
					{/if}
				</div>
			</header>

			<div class="article-content t-prose">
				{@html renderedContent}
			</div>
		</article>
	</Card>
</div>

<style>
	.article-page {
		max-width: 900px;
		margin: 0 auto;
		padding: var(--space-8) var(--space-4);
	}

	.breadcrumb {
		margin-bottom: var(--space-6);
		font-size: var(--text-xs);
		letter-spacing: 0.05em;
		text-transform: lowercase;
		color: var(--ink-mid);
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.breadcrumb a {
		color: var(--gold);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.breadcrumb a:hover {
		color: var(--gold-hover);
	}

	.breadcrumb .separator {
		color: var(--ink-faint);
	}

	.breadcrumb .current {
		color: var(--ink-mid);
	}

	.article-header {
		margin-bottom: var(--space-8);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid var(--border);
	}

	.article-title {
		font-size: clamp(2rem, 4vw, 3rem);
		margin: 0 0 var(--space-4) 0;
		color: var(--ink);
	}

	.article-meta {
		display: flex;
		gap: var(--space-4);
		align-items: center;
		flex-wrap: wrap;
	}

	.meta-item {
		font-size: var(--text-xs);
		letter-spacing: 0.05em;
		text-transform: lowercase;
		color: var(--ink-mid);
	}

	.article-content {
		font-size: var(--text-read);
		line-height: 1.8;
		color: var(--ink);
	}

	.article-content :global(h1) {
		font-size: var(--text-2xl);
		font-weight: 400;
		margin: var(--space-8) 0 var(--space-4) 0;
		color: var(--ink);
		line-height: 1.2;
	}

	.article-content :global(h2) {
		font-size: var(--text-xl);
		font-weight: 400;
		margin: var(--space-8) 0 var(--space-4) 0;
		color: var(--ink);
		line-height: 1.3;
	}

	.article-content :global(h3) {
		font-size: var(--text-lg);
		font-weight: 400;
		margin: var(--space-6) 0 var(--space-3) 0;
		color: var(--ink);
		line-height: 1.3;
	}

	.article-content :global(p) {
		margin: var(--space-4) 0;
		line-height: 1.8;
	}

	.article-content :global(ul) {
		margin: var(--space-4) 0;
		padding-left: var(--space-6);
	}

	.article-content :global(li) {
		margin: var(--space-2) 0;
		line-height: 1.8;
	}

	.article-content :global(code) {
		font-family: 'Courier New', monospace;
		font-size: var(--text-xs);
		color: var(--ink-mid);
		padding: var(--space-1) var(--space-2);
		background: var(--tint-green-mid);
		border: 1px solid var(--border-subtle);
		border-radius: 2px;
	}

	.article-content :global(pre) {
		background: var(--tint-green-mid);
		border: 1px solid var(--border-subtle);
		padding: var(--space-4);
		border-radius: 4px;
		overflow-x: auto;
		margin: var(--space-5) 0;
	}

	.article-content :global(pre code) {
		background: none;
		border: none;
		padding: 0;
	}

	.article-content :global(a) {
		color: var(--gold);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.article-content :global(a:hover) {
		color: var(--gold-hover);
		text-decoration: underline;
	}

	.article-content :global(.wiki-link) {
		color: var(--gold);
		font-weight: 500;
		border-bottom: 1px dotted var(--gold);
	}

	.article-content :global(.wiki-link:hover) {
		color: var(--gold-hover);
		border-bottom-color: var(--gold-hover);
	}

	.article-content :global(strong) {
		font-weight: 700;
		color: var(--ink);
	}

	.article-content :global(em) {
		font-style: italic;
	}
</style>
