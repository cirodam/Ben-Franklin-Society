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
		<div class="thread-list">
			{#each threads as thread}
				<a href="/thread/{thread.thread_id}" class="thread-envelope" class:thread-envelope--unread={thread.unread_count > 0}>
					<div class="envelope-header">
						<span class="envelope-from t-sender">@{thread.from_handle_cache}</span>
						<span class="envelope-date t-meta">{formatRelativeDate(thread.latest_at)}</span>
					</div>
					
					<div class="envelope-subject t-subject">{thread.subject}</div>
					
					{#if thread.unread_count > 0}
						<div class="stamp-badge">{thread.unread_count}</div>
					{/if}
				</a>
			{/each}
		</div>

		<div class="pagination">
			{#if page > 0}
				<a href="?page={page - 1}" class="btn-inline">← Newer</a>
			{/if}
			{#if hasMore}
				<a href="?page={page + 1}" class="btn-inline">Older →</a>
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

	/* Envelope-style thread list */
	.thread-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.thread-envelope {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-5);
		background: var(--envelope-cream);
		border: 2px solid var(--border-strong);
		border-radius: var(--radius);
		text-decoration: none;
		transition: all 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.thread-envelope:hover {
		border-color: var(--postal-blue);
		box-shadow: 0 2px 8px rgba(43, 76, 126, 0.12);
		transform: translateY(-1px);
	}

	.thread-envelope--unread {
		background: white;
		border-color: var(--postal-blue);
		border-left-width: 4px;
	}

	.thread-envelope--unread:hover {
		box-shadow: 0 3px 12px rgba(43, 76, 126, 0.18);
	}

	.envelope-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
	}

	.envelope-from {
		flex: 0 0 auto;
		color: var(--postal-blue-dark);
	}

	.thread-envelope--unread .envelope-from {
		font-weight: 600;
		color: var(--postal-blue);
	}

	.envelope-date {
		margin-left: auto;
		white-space: nowrap;
	}

	.envelope-subject {
		color: var(--ink-navy);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.thread-envelope--unread .envelope-subject {
		font-weight: 600;
	}

	/* Stamp badge (unread count) */
	.stamp-badge {
		position: absolute;
		top: var(--space-3);
		right: var(--space-3);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 24px;
		height: 24px;
		padding: 0 var(--space-2);
		background: var(--postal-blue);
		color: white;
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 700;
		border-radius: var(--radius-sm);
		border: 2px dashed white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	/* Pagination */
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

	@media (max-width: 640px) {
		.envelope-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.envelope-date {
			margin-left: 0;
		}
	}
</style>
