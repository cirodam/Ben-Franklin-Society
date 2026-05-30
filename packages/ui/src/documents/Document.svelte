<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		documentId,
		title,
		header,
		children
	}: {
		documentId?: string | null;
		title: string;
		header?: Snippet;
		children: Snippet;
	} = $props();
</script>

<article class="document">
	<div class="document-header">
		<div class="document-title-block">
			<div class="document-letterhead">
				<div class="letterhead-body">The Ben Franklin Society</div>
				<div class="letterhead-doc-number">
					{documentId || '#--------'}
				</div>
			</div>
			<h1 class="document-title">{title}</h1>
		</div>

		{#if header}
			{@render header()}
		{/if}
	</div>

	<div class="document-body">
		{@render children()}
	</div>
</article>

<style>
	/* Base document paper styling */
	.document {
		max-width: 1400px;
		margin: var(--space-12, 3rem) auto;
		padding: var(--space-16, 4rem) 0;
		background: #fefefe;
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.04),
			0 4px 12px rgba(0, 0, 0, 0.08),
			0 16px 48px rgba(0, 0, 0, 0.12);
		position: relative;
		box-sizing: border-box;
		min-height: 11in;
		width: 100%;
	}

	/* Subtle lined paper texture */
	.document::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: 
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 1.5rem,
				rgba(45, 90, 79, 0.02) 1.5rem,
				rgba(45, 90, 79, 0.02) calc(1.5rem + 1px)
			);
		pointer-events: none;
	}

	.document-header {
		padding: var(--space-10, 2.5rem);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
		position: relative;
		z-index: 1;
	}

	.document-body {
		padding: var(--space-10, 2.5rem);
		position: relative;
		z-index: 1;
	}

	/* Letterhead styling */
	.document-letterhead {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-4, 1rem);
		font-family: 'IM Fell English SC', serif;
	}

	.letterhead-body {
		font-size: var(--text-xs, 0.75rem);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	.letterhead-doc-number {
		font-size: var(--text-xs, 0.75rem);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	/* Document title styling */
	.document-title {
		font-family: 'IM Fell English', serif;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 400;
		line-height: 1.15;
		color: #151c1a;
		margin: var(--space-8, 2rem) 0 var(--space-5, 1.25rem);
		text-align: center;
		letter-spacing: -0.01em;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.document {
			padding: var(--space-4, 1rem);
			margin: var(--space-4, 1rem) auto;
		}

		.document-header,
		.document-body {
			padding: var(--space-6, 1.5rem);
		}
	}
</style>
