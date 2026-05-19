<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		fullWidth = false,
		href = undefined,
		children,
		...rest
	}: {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md';
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		fullWidth?: boolean;
		href?: string;
		children: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

{#if href}
	<a
		{href}
		class="btn btn--{variant} btn--{size}"
		class:btn--full={fullWidth}
		class:btn--disabled={disabled}
		aria-disabled={disabled}
		{...rest}
	>
		{@render children()}
	</a>
{:else}
	<button
		{type}
		{disabled}
		class="btn btn--{variant} btn--{size}"
		class:btn--full={fullWidth}
		{...rest}
	>
		{@render children()}
	</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-family: var(--font-sans);
		font-weight: var(--weight-medium);
		border-radius: var(--radius);
		border: 1px solid transparent;
		cursor: pointer;
		white-space: nowrap;
		text-decoration: none;
		transition: background 120ms, color 120ms, border-color 120ms;
	}

	.btn:disabled,
	.btn--disabled {
		opacity: 0.45;
		cursor: not-allowed;
		pointer-events: none;
	}

	.btn--full {
		width: 100%;
		justify-content: center;
	}

	/* Sizes */
	.btn--sm {
		font-size: var(--text-sm);
		padding: 3px var(--space-3);
	}
	.btn--md {
		font-size: var(--text-sm);
		padding: var(--space-2) var(--space-4);
	}

	/* Variants */
	.btn--primary {
		background: var(--color-accent);
		color: #fff;
		border-color: var(--color-accent);
	}
	.btn--primary:hover:not(:disabled) {
		background: var(--color-accent-hover);
		border-color: var(--color-accent-hover);
	}

	.btn--secondary {
		background: var(--color-surface);
		color: var(--color-text);
		border-color: var(--color-border);
	}
	.btn--secondary:hover:not(:disabled) {
		background: var(--color-bg);
	}

	.btn--danger {
		background: var(--color-danger);
		color: #fff;
		border-color: var(--color-danger);
	}
	.btn--danger:hover:not(:disabled) {
		background: var(--color-danger-hover);
		border-color: var(--color-danger-hover);
	}

	.btn--ghost {
		background: transparent;
		color: var(--color-accent);
		border-color: transparent;
	}
	.btn--ghost:hover:not(:disabled) {
		background: var(--color-accent-subtle);
	}
</style>
