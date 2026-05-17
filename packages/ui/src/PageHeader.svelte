<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description = undefined,
		actions = undefined
	}: {
		title: string;
		description?: string;
		actions?: Snippet;
	} = $props();
</script>

<div class="page-header">
	<div class="page-header-content">
		<h1>{title}</h1>
		{#if description}
			<p class="page-header-description">{description}</p>
		{/if}
	</div>
	{#if actions}
		<div class="page-header-actions">
			{@render actions()}
		</div>
	{/if}
</div>

<style>
	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
	}

	.page-header-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		flex: 1;
	}

	.page-header h1 {
		margin: 0;
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		color: var(--color-text);
	}

	.page-header-description {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.page-header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.page-header-actions {
			justify-content: flex-start;
		}
	}
</style>
