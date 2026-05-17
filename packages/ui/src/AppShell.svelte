<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		sidebar = undefined,
		children,
		maxWidth = 'none',
		...rest
	}: {
		sidebar?: Snippet;
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

	<main class="app-shell__main" style="max-width: {mainMaxWidth};">
		{@render children()}
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
		padding: var(--space-8);
	}
</style>
