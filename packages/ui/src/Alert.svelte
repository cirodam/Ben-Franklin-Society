<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'info',
		children,
		...rest
	}: {
		variant?: 'info' | 'success' | 'warning' | 'danger';
		children: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<div class="alert alert--{variant}" role="alert" {...rest}>
	{@render children()}
</div>

<style>
	.alert {
		padding: var(--space-4);
		border-radius: var(--radius);
		border-left: 4px solid;
		font-size: var(--text-sm);
		line-height: 1.5;
	}

	.alert--info {
		background: var(--color-accent-subtle);
		border-color: var(--color-accent);
		color: var(--color-text);
	}

	.alert--success {
		background: var(--color-success-subtle);
		border-color: var(--color-success);
		color: var(--color-text);
	}

	.alert--warning {
		background: var(--color-warn-subtle);
		border-color: var(--color-warn);
		color: var(--color-text);
	}

	.alert--danger {
		background: var(--color-danger-subtle);
		border-color: var(--color-danger);
		color: var(--color-text);
	}
</style>
