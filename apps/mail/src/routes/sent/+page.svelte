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
		<List>
			{#each messages as msg}
				<ListItem href="/thread/{msg.thread_id}">
					<span class="msg-row__subject">{msg.subject}</span>
					<span class="msg-row__date">{formatRelativeDate(msg.sent_at)}</span>
				</ListItem>
			{/each}
		</List>

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
	.page { display: flex; flex-direction: column; gap: var(--space-6); }

	:global(.page .list-item) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: var(--text-sm);
	}

	.msg-row__subject {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.msg-row__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		white-space: nowrap;
		margin-left: var(--space-4);
	}

	.pagination { display: flex; gap: var(--space-4); }
	.btn-inline { font-size: var(--text-sm); color: var(--color-accent); text-decoration: none; }
	.btn-inline:hover { text-decoration: underline; }
</style>
