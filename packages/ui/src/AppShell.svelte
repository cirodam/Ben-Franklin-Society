<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		sidebar = undefined,
		footer = undefined,
		children,
		maxWidth = 'none',
		...rest
	}: {
		sidebar?: Snippet;
		footer?: Snippet;
		children: Snippet;
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
		[key: string]: unknown;
	} = $props();

	const maxWidthMap = {
		sm: '640px',
		md: '860px',
		lg: '1000px',
		xl: '1280px',
		none: 'none'
	};

	const mainMaxWidth = $derived(maxWidthMap[maxWidth]);
</script>

<div class="app-shell" {...rest}>
	{#if sidebar}
		{@render sidebar()}
	{/if}

	<main class="app-shell__main">
		<div class="app-shell__content" style="max-width: {mainMaxWidth};">
			{@render children()}
		</div>
		{#if footer}
			<footer class="app-shell__footer">
				{@render footer()}
			</footer>
		{/if}
	</main>
</div>

<style>
	.app-shell {
		display: flex;
		min-height: 100vh;
	}

	.app-shell__main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.app-shell__content {
		width: 100%;
		padding: var(--space-8);
		flex: 1;
	}

	.app-shell__footer {
		width: 100%;
		padding: var(--space-6) var(--space-8);
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}
</style>
