<script lang="ts">
	import { PageHeader, EmptyState, List, ListItem, formatRelativeDate } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { messages, page, hasMore } = $derived(data);
</script>

<div class="page">
	<PageHeader title="Sent" />

	{#if messages.length === 0}
		<EmptyState
			icon="✉️"
			title="No sent messages"
		/>
	{:else}
		<div class="message-list">
			{#each messages as msg}
				<a href="/thread/{msg.thread_id}" class="message-envelope">
					<div class="envelope-content">
						<span class="envelope-subject t-subject">{msg.subject}</span>
						<span class="envelope-date t-meta">{formatRelativeDate(msg.sent_at)}</span>
					</div>
					<div class="stamp-badge stamp-badge--sent">Sent</div>
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

	.message-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.message-envelope {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-5);
		background: var(--envelope-cream);
		border: 2px solid var(--border-strong);
		border-radius: var(--radius);
		text-decoration: none;
		transition: all 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.message-envelope:hover {
		border-color: var(--postal-blue);
		box-shadow: 0 2px 8px rgba(43, 76, 126, 0.12);
		transform: translateY(-1px);
	}

	.envelope-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		min-width: 0;
	}

	.envelope-subject {
		flex: 1;
		color: var(--ink-navy);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.envelope-date {
		white-space: nowrap;
	}

	.stamp-badge {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.25rem var(--space-2);
		border-radius: var(--radius-sm);
		border: 1.5px dashed var(--border-strong);
	}

	.stamp-badge--sent {
		background: var(--stamp-green-light);
		color: var(--stamp-green);
		border-color: var(--stamp-green);
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
