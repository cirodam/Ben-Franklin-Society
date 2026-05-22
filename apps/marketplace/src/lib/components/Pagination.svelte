<script lang="ts">
	import { Button } from '@bfs/ui';

	interface Props {
		currentPage: number;
		totalPages: number;
		buildUrl: (page: number) => string;
	}

	let { currentPage, totalPages, buildUrl }: Props = $props();
</script>

{#if totalPages > 1}
	<div class="pagination">
		{#if currentPage > 1}
			<Button href={buildUrl(currentPage - 1)} variant="secondary">← Prev</Button>
		{/if}
		<span class="pagination__info">Page {currentPage} of {totalPages}</span>
		{#if currentPage < totalPages}
			<Button href={buildUrl(currentPage + 1)} variant="secondary">Next →</Button>
		{/if}
	</div>
{/if}

<style>
	.pagination {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding-top: var(--space-4);
	}

	.pagination__info {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		flex: 1;
		text-align: center;
	}
</style>
