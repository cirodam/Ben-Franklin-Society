<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		header,
		body
	}: {
		header: Snippet;
		body: Snippet;
	} = $props();
</script>

<article class="document">
	<div class="document-header">
		{@render header()}
	</div>

	<div class="document-body">
		{@render body()}
	</div>
</article>

<style>
	.document {
		max-width: 1000px;
		margin: 0 auto;
		background: var(--paper);
		box-shadow: 
			0 2px 4px rgba(0, 0, 0, 0.06),
			0 8px 24px rgba(0, 0, 0, 0.10),
			0 24px 64px rgba(0, 0, 0, 0.14),
			0 48px 96px rgba(0, 0, 0, 0.08);
		position: relative;
		width: 100%;
		box-sizing: border-box;
	}

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
				rgba(45, 90, 79, 0.03) 1.5rem,
				rgba(45, 90, 79, 0.03) calc(1.5rem + 1px)
			);
		pointer-events: none;
	}

	.document-header {
		padding: var(--space-12) var(--space-10) var(--space-8);
		border-bottom: 2px solid rgba(45, 90, 79, 0.2);
		position: relative;
		z-index: 1;
	}

	.document-body {
		padding: var(--space-10);
		position: relative;
		z-index: 1;
	}

	@media (max-width: 768px) {
		.document-header {
			padding: var(--space-8) var(--space-6) var(--space-6);
		}

		.document-body {
			padding: var(--space-6);
		}
	}

	/* Typography */
	:global(.document .document-title-block) {
		margin-bottom: var(--space-6);
	}

	:global(.document .document-title) {
		font-family: 'IM Fell English', serif;
		font-size: 2.5rem;
		font-weight: 400;
		line-height: 1.2;
		color: #151c1a;
		margin: 0 0 var(--space-4);
		text-align: center;
		letter-spacing: -0.02em;
	}

	:global(.document .document-meta) {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	/* Badges */
	:global(.document .type-badge),
	:global(.document .status-badge),
	:global(.document .seniority-badge) {
		display: inline-block;
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		padding: var(--space-2) var(--space-4);
		border-radius: 2px;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		border: 1.5px solid;
	}

	:global(.document .type-badge) {
		padding: var(--space-1) var(--space-3);
		background: rgba(91, 140, 184, 0.15);
		border: 1px solid rgba(91, 140, 184, 0.3);
		border-radius: 4px;
		font-weight: 400;
		letter-spacing: 0.2em;
	}

	/* Status variants */
	:global(.document .status--draft) {
		background: rgba(100, 100, 100, 0.1);
		color: #555;
	}

	:global(.document .status--published) {
		background: rgba(76, 175, 80, 0.15);
		color: #2e7d32;
	}

	:global(.document .status--archived) {
		background: rgba(158, 158, 158, 0.15);
		color: #616161;
	}

	:global(.document .status--active) {
		background: rgba(33, 150, 243, 0.15);
		color: #1565c0;
	}

	:global(.document .status--completed) {
		background: rgba(76, 175, 80, 0.15);
		color: #2e7d32;
	}

	:global(.document .status--terminated) {
		background: rgba(244, 67, 54, 0.15);
		color: #c62828;
	}

	:global(.document .status--adopted) {
		background: #e8f5eb;
		border-color: #6cb88b;
		color: #28704a;
	}

	:global(.document .status--repealed) {
		background: #f8e8eb;
		border-color: #b86c6c;
		color: #702828;
	}

	/* Dates */
	:global(.document .document-dates) {
		display: flex;
		justify-content: center;
		gap: var(--space-8);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		margin-top: var(--space-4);
	}

	:global(.document .date-line) {
		display: flex;
		gap: var(--space-2);
		color: #5a5a50;
	}

	:global(.document .date-line--warn) {
		color: #b45309;
	}

	:global(.document .date-label) {
		font-weight: 600;
		font-style: italic;
	}

	:global(.document .date-value) {
		font-variant-numeric: oldstyle-nums;
	}

	/* Common text colors */
	:global(.document .prose-paragraph),
	:global(.document .contract-text p) {
		color: #151c1a;
		font-size: var(--text-base);
		line-height: 1.8;
		text-align: justify;
		hyphens: auto;
	}

	@media (max-width: 768px) {
		:global(.document .document-title) {
			font-size: 1.75rem;
		}
	}
</style>
