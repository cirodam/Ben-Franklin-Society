<script lang="ts">
	import { PageHeader, EmptyState, formatRelativeDate } from '@bfs/ui';
	import type { PageData } from './$types.js';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();
	const { threads, page, hasMore } = $derived(data);
</script>

<div class="page">
	<PageHeader title="Archive" />

	{#if threads.length === 0}
		<EmptyState
			icon="📦"
			title="No archived messages"
			message="Archived threads will appear here"
		/>
	{:else}
		<div class="thread-list">
			{#each threads as thread}
				<div class="thread-envelope">
					<a href="/thread/{thread.thread_id}" class="thread-link">
						<div class="envelope-header">
							<span class="envelope-from t-sender">@{thread.from_handle_cache}</span>
							<span class="envelope-date t-meta">{formatRelativeDate(thread.latest_at)}</span>
						</div>
						
						<div class="envelope-subject t-subject">{thread.subject}</div>
						
						{#if thread.unread_count > 0}
							<div class="stamp-badge">{thread.unread_count}</div>
						{/if}
					</a>
					
					<form method="POST" action="?/unarchive" use:enhance>
						<input type="hidden" name="thread_id" value={thread.thread_id} />
						<button type="submit" class="unarchive-btn" title="Move to Inbox">
							↩ Inbox
						</button>
					</form>
				</div>
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

	.thread-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.thread-envelope {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-5);
		background: var(--envelope-cream);
		border: 2px solid var(--border-strong);
		border-radius: var(--radius);
		transition: all 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.thread-envelope:hover {
		border-color: var(--postal-blue);
		box-shadow: 0 2px 8px rgba(61, 90, 128, 0.12);
	}

	.thread-link {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		text-decoration: none;
		min-width: 0;
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

	.unarchive-btn {
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 600;
		background: var(--postal-blue-light);
		color: var(--postal-blue-dark);
		border: 1px solid var(--postal-blue-mid);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.unarchive-btn:hover {
		background: var(--postal-blue-mid);
		color: white;
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
