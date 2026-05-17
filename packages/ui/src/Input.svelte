<script lang="ts">
	let {
		type = 'text',
		name = undefined,
		value = $bindable(''),
		label = undefined,
		placeholder = '',
		disabled = false,
		required = false,
		error = undefined,
		hint = undefined,
		...rest
	}: {
		type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'number' | 'search' | 'date';
		name?: string;
		value?: string | number;
		label?: string;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		error?: string;
		hint?: string;
		[key: string]: unknown;
	} = $props();

	const hasError = $derived(!!error);
</script>

<div class="input-wrapper">
	{#if label}
		<label class="input-label" for={name}>
			{label}
			{#if required}
				<span class="input-required" aria-label="required">*</span>
			{/if}
		</label>
	{/if}

	<input
		id={name}
		{type}
		{name}
		bind:value
		{placeholder}
		{disabled}
		{required}
		class="input"
		class:input--error={hasError}
		aria-invalid={hasError}
		aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
		{...rest}
	/>

	{#if error}
		<div class="input-error" id="{name}-error" role="alert">
			{error}
		</div>
	{:else if hint}
		<div class="input-hint" id="{name}-hint">
			{hint}
		</div>
	{/if}
</div>

<style>
	.input-wrapper {
		display: flex;
		flex-direction: column;
	}
	.input-label {
		display: block;
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text);
		margin-bottom: var(--space-2);
	}

	.input-required {
		color: var(--color-danger);
		margin-left: var(--space-1);
	}

	.input {
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
	}

	.input:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px var(--color-accent-subtle);
	}

	.input:disabled {
		background: var(--color-bg-muted);
		color: var(--color-text-muted);
		cursor: not-allowed;
		opacity: 0.7;
	}

	.input--error {
		border-color: var(--color-danger);
	}

	.input--error:focus {
		border-color: var(--color-danger);
		box-shadow: 0 0 0 3px var(--color-danger-subtle);
	}

	.input-error {
		margin-top: var(--space-1);
		font-size: var(--text-xs);
		color: var(--color-danger);
	}

	.input-hint {
		margin-top: var(--space-1);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
</style>
