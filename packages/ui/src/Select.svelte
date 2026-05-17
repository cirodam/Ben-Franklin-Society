<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		name = undefined,
		value = $bindable(''),
		disabled = false,
		required = false,
		error = undefined,
		hint = undefined,
		children,
		...rest
	}: {
		name?: string;
		value?: string | number;
		disabled?: boolean;
		required?: boolean;
		error?: string;
		hint?: string;
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	const hasError = $derived(!!error);
</script>

<select
	{name}
	bind:value
	{disabled}
	{required}
	class="select"
	class:select--error={hasError}
	aria-invalid={hasError}
	aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
	{...rest}
>
	{@render children()}
</select>

{#if error}
	<div class="select-error" id="{name}-error" role="alert">
		{error}
	</div>
{:else if hint}
	<div class="select-hint" id="{name}-hint">
		{hint}
	</div>
{/if}

<style>
	.select {
		width: 100%;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--color-text);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-2) var(--space-3);
		outline: none;
		cursor: pointer;
		transition: border-color 120ms, box-shadow 120ms;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right var(--space-2) center;
		padding-right: var(--space-8);
	}

	.select:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px var(--color-accent-subtle);
	}

	.select:disabled {
		background: var(--color-bg-muted);
		color: var(--color-text-muted);
		cursor: not-allowed;
		opacity: 0.7;
	}

	.select--error {
		border-color: var(--color-danger);
	}

	.select--error:focus {
		box-shadow: 0 0 0 3px var(--color-danger-subtle);
	}

	.select-error {
		margin-top: var(--space-1);
		font-size: var(--text-xs);
		color: var(--color-danger);
	}

	.select-hint {
		margin-top: var(--space-1);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
</style>
