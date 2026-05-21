<script lang="ts">
	import { EmptyState } from '@bfs/ui';
	import SearchResultCard from './SearchResultCard.svelte';

	interface SearchResult {
		thread_id: string;
		from_handle_cache: string;
		sent_at?: string;
		created_at: string;
		subject: string;
		snippet: string;
	}

	let {
		query,
		results,
		total,
		page,
		hasMore
	}: {
		query: string;
		results: SearchResult[];
		total: number;
		page: number;
		hasMore: boolean;
	} = $props();
</script>

{#if query && results.length > 0}
	<div class="results-summary">
		Found {total}
		{total === 1 ? 'message' : 'messages'}
	</div>

	<div class="results-list">
		{#each results as result}
			<SearchResultCard {result} />
		{/each}
	</div>

	<div class="pagination">
		{#if page > 0}
			<a href="/search?q={encodeURIComponent(query)}&page={page - 1}" class="btn-inline">
				← Previous
			</a>
		{/if}
		{#if hasMore}
			<a href="/search?q={encodeURIComponent(query)}&page={page + 1}" class="btn-inline">
				Next →
			</a>
		{/if}
	</div>
{:else if query}
	<EmptyState
		icon="🔍"
		title="No messages found"
		message="Try different search terms or adjust your filters"
	/>
{:else}
	<EmptyState
		icon="🔍"
		title="Search your messages"
		message="Enter a search term to find messages by subject, content, or sender"
	/>
{/if}

<style>
	.results-summary {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--ink-slate);
		padding: var(--space-2) 0;
	}

	.results-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.pagination {
		display: flex;
		gap: var(--space-4);
		justify-content: center;
		margin-top: var(--space-2);
	}

	.btn-inline {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--postal-blue);
		text-decoration: none;
		transition: color 0.2s;
	}

	.btn-inline:hover {
		color: var(--postal-blue-mid);
		text-decoration: underline;
	}
</style>
