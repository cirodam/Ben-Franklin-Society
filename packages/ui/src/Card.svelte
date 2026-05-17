<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		href = undefined,
		padding = 'md',
		hover = false,
		children,
		...rest
	}: {
		href?: string;
		padding?: 'sm' | 'md' | 'lg';
		hover?: boolean;
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	const paddingClass = `card--padding-${padding}`;
	const hoverClass = hover ? 'card--hover' : '';
</script>

{#if href}
	<a {href} class="card {paddingClass} {hoverClass}" {...rest}>
		{@render children()}
	</a>
{:else}
	<div class="card {paddingClass} {hoverClass}" {...rest}>
		{@render children()}
	</div>
{/if}

<style>
	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		display: flex;
		flex-direction: column;
		color: inherit;
		text-decoration: none;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.card--padding-sm {
		padding: var(--space-3);
	}

	.card--padding-md {
		padding: var(--space-5);
	}

	.card--padding-lg {
		padding: var(--space-8);
	}

	.card--hover {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.card--hover:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
</style>
