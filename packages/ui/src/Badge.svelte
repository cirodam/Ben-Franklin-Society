<script lang="ts">
	// Maps arbitrary string values to semantic color variants.
	// Pass `variant` directly, or pass `value` + a `map` to derive it.

	type Variant = 'neutral' | 'success' | 'warn' | 'danger' | 'accent';

	let {
		label,
		variant = 'neutral',
	}: {
		label: string;
		variant?: Variant;
	} = $props();
</script>

<span class="badge badge--{variant}">{label}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		line-height: 1;
		padding: 2px 7px;
		border-radius: 999px;
		white-space: nowrap;
		letter-spacing: 0.02em;
	}

	.badge--neutral {
		background: var(--color-border-faint);
		color: var(--color-text-muted);
	}
	.badge--success {
		background: var(--color-success-subtle);
		color: var(--color-success);
	}
	.badge--warn {
		background: var(--color-warn-subtle);
		color: var(--color-warn);
	}
	.badge--danger {
		background: var(--color-danger-subtle);
		color: var(--color-danger);
	}
	.badge--accent {
		background: var(--color-accent-subtle);
		color: var(--color-accent);
	}
</style>
