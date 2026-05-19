<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		children,
		...rest
	}: {
		label: string;
		children: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<div class="sidebar-group" {...rest}>
	<div class="sidebar-group__label">{label}</div>
	<div class="sidebar-group__links">
		{@render children()}
	</div>
</div>

<style>
	.sidebar-group {
		display: flex;
		flex-direction: column;
	}

	.sidebar-group__label {
		padding: var(--space-3) var(--space-4);
		padding-bottom: var(--space-1);
	}

	.sidebar-group__links {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
</style>
