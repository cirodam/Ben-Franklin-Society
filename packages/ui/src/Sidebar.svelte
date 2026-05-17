<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		brand = undefined,
		nav,
		footer = undefined,
		...rest
	}: {
		brand?: Snippet;
		nav: Snippet;
		footer?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<aside class="sidebar" {...rest}>
	{#if brand}
		<div class="sidebar__brand">
			{@render brand()}
		</div>
	{/if}

	<nav class="sidebar__nav">
		{@render nav()}
	</nav>

	{#if footer}
		<div class="sidebar__footer">
			{@render footer()}
		</div>
	{/if}
</aside>

<style>
	.sidebar {
		width: 220px;
		flex-shrink: 0;
		background: var(--color-surface);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		position: sticky;
		top: 0;
		height: 100vh;
	}

	.sidebar__brand {
		font-weight: var(--weight-bold);
		font-size: var(--text-sm);
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		padding: var(--space-5) var(--space-4);
		border-bottom: 1px solid var(--color-border-faint);
	}

	.sidebar__nav {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: var(--space-3) 0;
		gap: 2px;
		overflow-y: auto;
	}

	.sidebar__footer {
		border-top: 1px solid var(--color-border-faint);
		padding: var(--space-4);
	}
</style>
