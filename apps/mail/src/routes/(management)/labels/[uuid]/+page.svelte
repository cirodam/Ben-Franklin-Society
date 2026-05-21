<script lang="ts">
	import type { PageData } from './$types.js';
	import { PageHeader, formatDateTime } from '@bfs/ui';

	let { data }: { data: PageData } = $props();
	const { label, threads } = $derived(data);
</script>

<div class="label-view">
	<div class="label-header">
		<a href="/labels" class="back-link">← Labels</a>
		<PageHeader title={label.name}>
			{#snippet subtitle()}
				<span class="label-badge" style="background-color: {label.color || '#999'}">
					{threads.length} thread{threads.length !== 1 ? 's' : ''}
				</span>
			{/snippet}
		</PageHeader>
	</div>

	{#if threads.length === 0}
		<div class="empty-state">
			<p>No threads with this label yet.</p>
		</div>
	{:else}
		<div class="thread-list">
			{#each threads as thread}
				<a href="/thread/{thread.thread_id}" class="thread-item" class:thread-item--unread={thread.unread_count > 0}>
					<div class="thread-main">
						<div class="thread-subject">{thread.subject}</div>
						<div class="thread-from">@{thread.from_handle_cache}</div>
					</div>
					<div class="thread-meta">
						<span class="thread-date">{formatDateTime(thread.sent_at)}</span>
						{#if thread.unread_count > 0}
							<span class="unread-badge">{thread.unread_count}</span>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.label-view {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
	}

	.label-header {
		margin-bottom: 2rem;
	}

	.back-link {
		display: inline-block;
		margin-bottom: 1rem;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--postal-blue);
		text-decoration: none;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: var(--postal-blue-mid);
		text-decoration: underline;
	}

	.label-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 500;
		color: white;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-secondary);
	}

	.thread-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.thread-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border-faint);
		text-decoration: none;
		color: inherit;
		transition: background 0.2s;
	}

	.thread-item:hover {
		background: var(--paper-light-blue);
	}

	.thread-item--unread {
		background: var(--background-highlight, #f0f4f8);
		font-weight: 600;
	}

	.thread-main {
		flex: 1;
		min-width: 0;
	}

	.thread-subject {
		font-family: var(--font-sans);
		font-size: var(--text-base);
		color: var(--ink-navy);
		margin-bottom: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.thread-from {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--text-secondary);
	}

	.thread-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.thread-date {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--text-secondary);
	}

	.unread-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 0.375rem;
		background: var(--postal-blue);
		color: white;
		border-radius: 10px;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
	}
</style>
