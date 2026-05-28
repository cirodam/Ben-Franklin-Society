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
		max-width: 900px;
		margin: var(--space-12) auto;
		padding: var(--space-16) 0;
		background: #fffef8;
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.04),
			0 4px 12px rgba(0, 0, 0, 0.08),
			0 16px 48px rgba(0, 0, 0, 0.12);
		position: relative;
		box-sizing: border-box;
		min-height: 11in;
	}

	.document::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: 
			radial-gradient(circle at 2px 2px, rgba(45, 90, 79, 0.015) 1px, transparent 1px);
		background-size: 32px 32px;
		pointer-events: none;
		opacity: 0.5;
	}

	.document::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: 
			linear-gradient(
				90deg,
				transparent 0%,
				transparent calc(50% - 1px),
				rgba(122, 92, 26, 0.03) calc(50% - 1px),
				rgba(122, 92, 26, 0.03) calc(50% + 1px),
				transparent calc(50% + 1px),
				transparent 100%
			);
		pointer-events: none;
		opacity: 0.3;
	}

	.document-header {
		padding: var(--space-8) var(--space-12) var(--space-8);
		border-bottom: 2px solid rgba(122, 92, 26, 0.15);
		position: relative;
		z-index: 1;
	}

	.document-body {
		padding: var(--space-10) var(--space-12);
		position: relative;
		z-index: 1;
	}

	@media (max-width: 768px) {
		.document {
			margin: var(--space-6) auto;
			padding: var(--space-8) var(--space-6);
		}

		.document-header {
			padding: 0 0 var(--space-6);
		}

		.document-body {
			padding: var(--space-6) 0 0;
		}
	}

	@media print {
		.document {
			max-width: none;
			margin: 0;
			padding: 1in;
			box-shadow: none;
			background: white;
		}

		.document::before,
		.document::after {
			display: none;
		}
	}

	/* Typography */
	:global(.document .document-title-block) {
		margin-bottom: var(--space-6);
		padding-top: 0;
	}

	:global(.document .document-title) {
		font-family: 'IM Fell English', serif;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 400;
		line-height: 1.15;
		color: #151c1a;
		margin: var(--space-8) 0 var(--space-5);
		text-align: center;
		letter-spacing: -0.01em;
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
