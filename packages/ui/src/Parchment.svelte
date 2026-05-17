<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		maxWidth = 'readable',
		padding = 'md',
		...rest
	}: {
		children: Snippet;
		maxWidth?: 'readable' | 'wide' | 'full';
		padding?: 'sm' | 'md' | 'lg';
		[key: string]: unknown;
	} = $props();

	const maxWidthClass = $derived(`parchment--${maxWidth}`);
	const paddingClass = $derived(`parchment--padding-${padding}`);
</script>

<article class="parchment {maxWidthClass} {paddingClass}" {...rest}>
	{@render children()}
</article>

<style>
	.parchment {
		background: linear-gradient(to bottom, #fdfdf8 0%, #f9f9f4 100%);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 4px 12px rgba(0, 0, 0, 0.08),
			0 8px 24px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(139, 115, 85, 0.15);
		border-radius: 2px;
		margin: 0 auto;
		position: relative;
		box-sizing: border-box;
		width: 100%;
	}

	.parchment::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: 
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 1.5rem,
				rgba(139, 115, 85, 0.03) 1.5rem,
				rgba(139, 115, 85, 0.03) calc(1.5rem + 1px)
			);
		pointer-events: none;
		border-radius: 2px;
	}

	.parchment--readable {
		max-width: 1000px;
	}

	.parchment--wide {
		max-width: 900px;
	}

	.parchment--full {
		max-width: none;
		width: 100%;
	}

	.parchment--padding-sm {
		padding: var(--space-6);
	}

	.parchment--padding-md {
		padding: var(--space-8);
	}

	.parchment--padding-lg {
		padding: var(--space-10);
	}

	@media (max-width: 768px) {
		.parchment--padding-sm {
			padding: var(--space-4);
		}

		.parchment--padding-md {
			padding: var(--space-6);
		}

		.parchment--padding-lg {
			padding: var(--space-8);
		}
	}
</style>
