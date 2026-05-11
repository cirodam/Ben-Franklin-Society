<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		error,
		hint,
		children,
	}: {
		label: string;
		error?: string | null;
		hint?: string;
		children: Snippet;
	} = $props();
</script>

<div class="field" class:field--error={!!error}>
	<label class="field__label">{label}</label>
	<div class="field__control">
		{@render children()}
	</div>
	{#if error}
		<p class="field__error">{error}</p>
	{:else if hint}
		<p class="field__hint">{hint}</p>
	{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.field__label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	/* Style inputs/selects/textareas placed inside the control slot */
	.field__control :global(input),
	.field__control :global(select),
	.field__control :global(textarea) {
		width: 100%;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--color-text);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-2) var(--space-3);
		transition: border-color 120ms, box-shadow 120ms;
		outline: none;
	}

	.field__control :global(input:focus),
	.field__control :global(select:focus),
	.field__control :global(textarea:focus) {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px var(--color-accent-subtle);
	}

	.field--error .field__control :global(input),
	.field--error .field__control :global(select),
	.field--error .field__control :global(textarea) {
		border-color: var(--color-danger);
	}

	.field--error .field__control :global(input:focus),
	.field--error .field__control :global(select:focus),
	.field--error .field__control :global(textarea:focus) {
		box-shadow: 0 0 0 3px var(--color-danger-subtle);
	}

	.field__error {
		font-size: var(--text-xs);
		color: var(--color-danger);
	}

	.field__hint {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
</style>
