<script lang="ts">
	let {
		size = 'md',
		variant = 'primary',
		label = undefined,
		...rest
	}: {
		size?: 'sm' | 'md' | 'lg';
		variant?: 'primary' | 'secondary' | 'white';
		label?: string;
		[key: string]: unknown;
	} = $props();

	const sizeMap = {
		sm: 16,
		md: 24,
		lg: 40
	};

	const spinnerSize = $derived(sizeMap[size]);
</script>

<div class="spinner-container" {...rest}>
	<svg
		class="spinner spinner--{size} spinner--{variant}"
		width={spinnerSize}
		height={spinnerSize}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		role="status"
		aria-label={label || 'Loading'}
	>
		<circle
			class="spinner__track"
			cx="12"
			cy="12"
			r="10"
			stroke-width="3"
		/>
		<circle
			class="spinner__circle"
			cx="12"
			cy="12"
			r="10"
			stroke-width="3"
			stroke-linecap="round"
		/>
	</svg>
	{#if label}
		<span class="spinner-label spinner-label--{size}">
			{label}
		</span>
	{/if}
</div>

<style>
	.spinner-container {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.spinner {
		animation: spinner-rotate 1s linear infinite;
	}

	@keyframes spinner-rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.spinner__track {
		stroke: currentColor;
		opacity: 0.15;
	}

	.spinner__circle {
		stroke: currentColor;
		stroke-dasharray: 63;
		stroke-dashoffset: 47;
		transform-origin: center;
		animation: spinner-dash 1.5s ease-in-out infinite;
	}

	@keyframes spinner-dash {
		0% {
			stroke-dashoffset: 63;
		}
		50% {
			stroke-dashoffset: 16;
		}
		100% {
			stroke-dashoffset: 63;
		}
	}

	/* Variants */
	.spinner--primary {
		color: var(--color-accent);
	}

	.spinner--secondary {
		color: var(--color-text-muted);
	}

	.spinner--white {
		color: #fff;
	}

	/* Label */
	.spinner-label {
		color: var(--color-text);
		font-size: var(--text-sm);
	}

	.spinner-label--sm {
		font-size: var(--text-xs);
	}

	.spinner-label--md {
		font-size: var(--text-sm);
	}

	.spinner-label--lg {
		font-size: var(--text-base);
	}
</style>
