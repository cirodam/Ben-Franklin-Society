<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		href,
		noBorder = false
	}: {
		children: Snippet;
		href?: string;
		noBorder?: boolean;
	} = $props();
</script>

{#if href}
	<a {href} class="list-item" class:list-item--no-border={noBorder}>
		{@render children()}
	</a>
{:else}
	<div class="list-item" class:list-item--no-border={noBorder}>
		{@render children()}
	</div>
{/if}

<style>
	.list-item {
		display: block;
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-border-faint);
		text-decoration: none;
		color: var(--color-text);
		font-size: var(--text-sm);
	}

	.list-item:last-child {
		border-bottom: none;
	}

	.list-item--no-border {
		border-bottom: none;
	}

	a.list-item:hover {
		background: var(--color-surface-alt, #f8fafc);
	}
</style>
