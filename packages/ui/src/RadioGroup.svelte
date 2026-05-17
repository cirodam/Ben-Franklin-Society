<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label = undefined,
		error = undefined,
		hint = undefined,
		required = false,
		children,
		...rest
	}: {
		label?: string;
		error?: string;
		hint?: string;
		required?: boolean;
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	const hasError = $derived(!!error);
</script>

<fieldset class="radio-group" class:radio-group--error={hasError} {...rest}>
	{#if label}
		<legend class="radio-group__label">
			{label}{#if required}<span class="required">*</span>{/if}
		</legend>
	{/if}

	<div class="radio-group__options">
		{@render children()}
	</div>

	{#if error}
		<div class="radio-group__error" role="alert">
			{error}
		</div>
	{:else if hint}
		<div class="radio-group__hint">
			{hint}
		</div>
	{/if}
</fieldset>

<style>
	.radio-group {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.radio-group__label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text);
		padding: 0;
		margin-bottom: var(--space-1);
	}

	.required {
		color: var(--color-danger);
		margin-left: 2px;
	}

	.radio-group__options {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.radio-group__error {
		font-size: var(--text-xs);
		color: var(--color-danger);
	}

	.radio-group__hint {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
</style>
