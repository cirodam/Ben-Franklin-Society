<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		columns = 2,
		gap = 'var(--space-4)'
	}: {
		children: Snippet;
		columns?: number;
		gap?: string;
	} = $props();
</script>

<div class="field-row" style="--field-columns: {columns}; --field-gap: {gap};">
	{@render children()}
</div>

<style>
	.field-row {
		display: grid;
		grid-template-columns: repeat(var(--field-columns), 1fr);
		gap: var(--field-gap);
	}
</style>
