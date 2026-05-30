<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		header,
		body,
		maxWidth = '1400px'
	}: {
		header: Snippet;
		body: Snippet;
		maxWidth?: string;
	} = $props();
</script>

<article class="document" style="--document-max-width: {maxWidth};">
	<div class="document-header">
		{@render header()}
	</div>

	<div class="document-body">
		{@render body()}
	</div>
</article>

<style>
	.document {
		max-width: var(--document-max-width, 1400px);
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
		padding: var(--space-8) var(--space-12);
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
			padding: var(--space-8) 0;
		}

		.document-header,
		.document-body {
			padding: var(--space-6) var(--space-4);
		}
	}
</style>
