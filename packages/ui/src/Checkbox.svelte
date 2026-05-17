<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		name = undefined,
		checked = $bindable(false),
		disabled = false,
		required = false,
		error = undefined,
		hint = undefined,
		value = undefined,
		children,
		...rest
	}: {
		name?: string;
		checked?: boolean;
		disabled?: boolean;
		required?: boolean;
		error?: string;
		hint?: string;
		value?: string;
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	const hasError = $derived(!!error);
	const id = $derived(name ? `checkbox-${name}` : undefined);
</script>

<div class="checkbox-wrapper" class:checkbox-wrapper--error={hasError}>
	<label class="checkbox-label" class:checkbox-label--disabled={disabled}>
		<input
			type="checkbox"
			{name}
			bind:checked
			{disabled}
			{required}
			{value}
			{id}
			class="checkbox-input"
			aria-invalid={hasError}
			aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
			{...rest}
		/>
		<span class="checkbox-box" class:checkbox-box--checked={checked}>
			{#if checked}
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			{/if}
		</span>
		<span class="checkbox-text">
			{@render children()}
		</span>
	</label>

	{#if error}
		<div class="checkbox-error" id="{id}-error" role="alert">
			{error}
		</div>
	{:else if hint}
		<div class="checkbox-hint" id="{id}-hint">
			{hint}
		</div>
	{/if}
</div>

<style>
	.checkbox-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.checkbox-wrapper--error .checkbox-box {
		border-color: var(--color-danger);
	}

	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		cursor: pointer;
		user-select: none;
	}

	.checkbox-label--disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.checkbox-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.checkbox-box {
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 120ms;
		margin-top: 2px;
	}

	.checkbox-input:focus-visible + .checkbox-box {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.checkbox-box--checked {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: white;
	}

	.checkbox-label:hover .checkbox-box:not(.checkbox-box--checked) {
		border-color: var(--color-accent);
	}

	.checkbox-label--disabled .checkbox-box {
		background: var(--color-bg-muted);
		border-color: var(--color-border);
		cursor: not-allowed;
	}

	.checkbox-label--disabled .checkbox-box--checked {
		background: var(--color-text-muted);
		border-color: var(--color-text-muted);
	}

	.checkbox-text {
		font-size: var(--text-sm);
		color: var(--color-text);
		line-height: 1.5;
	}

	.checkbox-label--disabled .checkbox-text {
		color: var(--color-text-muted);
	}

	.checkbox-error {
		margin-left: calc(18px + var(--space-2));
		font-size: var(--text-xs);
		color: var(--color-danger);
	}

	.checkbox-hint {
		margin-left: calc(18px + var(--space-2));
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
</style>
