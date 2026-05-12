<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { threads, page, hasMore } = $derived(data);

	function fmtDate(iso: string | null): string {
		if (!iso) return '';
		const d = new Date(iso);
		const now = new Date();
		if (d.toDateString() === now.toDateString()) {
			return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		}
		return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
	}
</script>

<div class="page">
	<div class="page-header">
		<h1>Inbox</h1>
	</div>

	{#if threads.length === 0}
		<p class="empty">Your inbox is empty.</p>
	{:else}
		<div class="thread-list">
			{#each threads as thread}
				<a
					href="/thread/{thread.thread_id}"
					class="thread-row"
					class:thread-row--unread={thread.unread_count > 0}
				>
					<span class="thread-row__from">@{thread.from_handle_cache}</span>
					<span class="thread-row__subject">{thread.subject}</span>
					<span class="thread-row__meta">
						{#if thread.unread_count > 0}
							<span class="badge">{thread.unread_count}</span>
						{/if}
						<span class="thread-row__date">{fmtDate(thread.latest_at)}</span>
					</span>
				</a>
			{/each}
		</div>

		<div class="pagination">
			{#if page > 0}
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

	.page-header h1 {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
	}

	.empty {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.thread-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.thread-row {
		display: grid;
		grid-template-columns: 140px 1fr auto;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--color-border-faint);
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-surface);
		font-size: var(--text-sm);
		transition: background 0.1s;
	}
	.thread-row:last-child { border-bottom: none; }
	.thread-row:hover { background: var(--color-accent-subtle); }

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
	.thread-row--unread .thread-row__from {
		color: var(--color-text);
		font-weight: var(--weight-medium);
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
