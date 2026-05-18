<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		name,
		value,
		groupValue = $bindable(),
		disabled = false,
		required = false,
		error = undefined,
		hint = undefined,
		children,
		...rest
	}: {
		name: string;
		value: string | number;
		groupValue?: string | number;
		disabled?: boolean;
		required?: boolean;
		error?: string;
		hint?: string;
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	const checked = $derived(groupValue === value);
	const hasError = $derived(!!error);
	const id = $derived(`radio-${name}-${value}`);

	function handleChange() {
		if (!disabled) {
			groupValue = value;
		}
	}
</script>

<div class="radio-wrapper" class:radio-wrapper--error={hasError}>
	<label class="radio-label" class:radio-label--disabled={disabled}>
		<input
			type="radio"
			{name}
			{value}
			{checked}
			{disabled}
			{required}
			{id}
			class="radio-input"
			onchange={handleChange}
			aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
			{...rest}
		/>
		<span class="radio-circle" class:radio-circle--checked={checked}>
			{#if checked}
				<span class="radio-dot"></span>
			{/if}
		</span>
		<span class="radio-text">
			{@render children()}
		</span>
	</label>

	{#if error}
		<div class="radio-error" id="{id}-error" role="alert">
			{error}
		</div>
	{:else if hint}
		<div class="radio-hint" id="{id}-hint">
			{hint}
		</div>
	{/if}
</div>

<style>
	.radio-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.radio-wrapper--error .radio-circle {
		border-color: var(--color-danger);
	}

	.radio-label {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		cursor: pointer;
		user-select: none;
	}

	.radio-label--disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.radio-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.radio-circle {
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		border: 2px solid var(--color-border);
		border-radius: 50%;
		background: var(--color-surface);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 120ms;
		margin-top: 2px;
	}

	.radio-input:focus-visible + .radio-circle {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.radio-circle--checked {
		border-color: var(--color-accent);
	}

	.radio-label:hover .radio-circle:not(.radio-circle--checked) {
		border-color: var(--color-accent);
	}

	.radio-label--disabled .radio-circle {
		background: var(--color-bg-muted);
		border-color: var(--color-border);
		cursor: not-allowed;
	}

	.radio-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-accent);
		animation: radio-pop 150ms ease-out;
	}

	@keyframes radio-pop {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}

	.radio-label--disabled .radio-dot {
		background: var(--color-text-muted);
	}

	.radio-text {
		font-size: var(--text-sm);
		color: var(--color-text);
		line-height: 1.5;
	}

	.radio-label--disabled .radio-text {
		color: var(--color-text-muted);
	}

	.radio-error {
		margin-left: calc(18px + var(--space-2));
		font-size: var(--text-xs);
		color: var(--color-danger);
	}

	.radio-hint {
		margin-left: calc(18px + var(--space-2));
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
</style>
