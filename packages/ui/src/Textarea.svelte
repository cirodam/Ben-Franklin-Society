<script lang="ts">
	let {
		name = undefined,
		value = $bindable(''),
		label = undefined,
		placeholder = '',
		disabled = false,
		required = false,
		rows = 4,
		error = undefined,
		hint = undefined,
		...rest
	}: {
		name?: string;
		value?: string;
		label?: string;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		rows?: number;
		error?: string;
		hint?: string;
		[key: string]: unknown;
	} = $props();

	const hasError = $derived(!!error);
</script>

<div class="textarea-wrapper">
	{#if label}
		<label class="textarea-label" for={name}>
			{label}
			{#if required}
				<span class="textarea-required" aria-label="required">*</span>
			{/if}
		</label>
	{/if}

	<textarea
		id={name}
		{name}
		bind:value
		{placeholder}
		{disabled}
		{required}
		{rows}
		class="textarea"
		class:textarea--error={hasError}
		aria-invalid={hasError}
		aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
		{...rest}
	></textarea>

	{#if error}
		<div class="textarea-error" id="{name}-error" role="alert">
			{error}
		</div>
	{:else if hint}
		<div class="textarea-hint" id="{name}-hint">
			{hint}
		</div>
	{/if}
</div>

<style>
	.textarea-wrapper {
		display: flex;
		flex-direction: column;
	}
	.textarea-label {
		display: block;
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text);
		margin-bottom: var(--space-2);
	}

	.textarea-required {
		color: var(--color-danger);
		margin-left: var(--space-1);
	}

	.textarea {
		width: 100%;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--color-text);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-2) var(--space-3);
		outline: none;
		transition: border-color 120ms, box-shadow 120ms;
		resize: vertical;
		line-height: 1.5;
	}

	.textarea:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px var(--color-accent-subtle);
	}

	.textarea:disabled {
		background: var(--color-bg-muted);
		color: var(--color-text-muted);
		cursor: not-allowed;
		opacity: 0.7;
	}

	.textarea--error {
		border-color: var(--color-danger);
	}

	.textarea--error:focus {
		border-color: var(--color-danger);
		box-shadow: 0 0 0 3px var(--color-danger-subtle);
	}

	.textarea-error {
		margin-top: var(--space-1);
		font-size: var(--text-xs);
		color: var(--color-danger);
	}

	.textarea-hint {
		margin-top: var(--space-1);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
</style>
