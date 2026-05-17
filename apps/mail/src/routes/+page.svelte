<script lang="ts">
	import { PageHeader, EmptyState, List, ListItem, formatRelativeDate } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { threads, page, hasMore } = $derived(data);
</script>

<div class="page">
	<PageHeader title="Inbox" />

	{#if threads.length === 0}
		<EmptyState
			icon="📭"
			title="Your inbox is empty"
		/>
	{:else}
		<List>
			{#each threads as thread}
				<ListItem href="/thread/{thread.thread_id}">
					<div class="thread-row-content" class:thread-row--unread={thread.unread_count > 0}>
						<span class="thread-row__from">@{thread.from_handle_cache}</span>
						<span class="thread-row__subject">{thread.subject}</span>
						<span class="thread-row__meta">
							{#if thread.unread_count > 0}
								<span class="badge">{thread.unread_count}</span>
							{/if}
							<span class="thread-row__date">{formatRelativeDate(thread.latest_at)}</span>
						</span>
					</div>
				</ListItem>
			{/each}
		</List>
		<div class="pagination">			{#if page > 0}
				<a href="?page={page - 1}" class="btn-inline">← Prev</a>
			{/if}
			{#if hasMore}
				<a href="?page={page + 1}" class="btn-inline">Next →</a>
			{/if}
		</div>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.thread-row-content {
		display: grid;
		grid-template-columns: 140px 1fr auto;
		align-items: center;
		gap: var(--space-4);
	}

	.thread-row--unread .thread-row__subject {
		font-weight: var(--weight-bold);
	}

	.thread-row__from {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	:global(.thread-row--unread) .thread-row__from {
		color: var(--color-text);
	.thread-row--unreadedium);
	}

	.thread-row__subject {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.thread-row__meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		white-space: nowrap;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 4px;
		border-radius: 9px;
		background: var(--color-accent);
		color: #fff;
		font-size: 11px;
		font-weight: var(--weight-bold);
	}

	.thread-row__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.pagination {
		display: flex;
		gap: var(--space-4);
	}

	.btn-inline {
		font-size: var(--text-sm);
		color: var(--color-accent);
		text-decoration: none;
	}
	.btn-inline:hover { text-decoration: underline; }
</style>
