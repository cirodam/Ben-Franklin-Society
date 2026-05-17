<script lang="ts">
	import { enhance } from '$app/forms';
	import { PageHeader, EmptyState, Button, formatRelativeDate } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { messages, page, hasMore } = $derived(data);
</script>

<div class="page">
	<PageHeader title="Trash" />

	{#if messages.length === 0}
		<EmptyState
			icon="🗑️"
			title="Trash is empty"
		/>
	{:else}
		<div class="msg-list">
			{#each messages as msg}
				<div class="msg-row">
					<a href="/thread/{msg.thread_id}" class="msg-row__subject">{msg.subject}</a>
					<span class="msg-row__from">@{msg.from_handle_cache}</span>
					<span class="msg-row__date">{formatRelativeDate(msg.trashed_at)}</span>
					<div class="msg-row__actions">
						<form method="POST" action="?/restore" use:enhance>
							<input type="hidden" name="message_uuid" value={msg.uuid} />
							<Button type="submit" variant="secondary" size="sm">Restore</Button>
						</form>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="message_uuid" value={msg.uuid} />
							<Button type="submit" variant="danger" size="sm">Delete Forever</Button>
						</form>
					</div>
				</div>
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
	.page { display: flex; flex-direction: column; gap: var(--space-6); }

	.msg-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.msg-row {
		display: grid;
		grid-template-columns: 1fr 140px 80px auto;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--color-border-faint);
		background: var(--color-surface);
		font-size: var(--text-sm);
	}
	.msg-row:last-child { border-bottom: none; }

	.msg-row__subject {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-decoration: none;
		color: var(--color-text);
	}
	.msg-row__subject:hover { text-decoration: underline; color: var(--color-accent); }

	.msg-row__from {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.msg-row__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.msg-row__actions {
		display: flex;
		gap: var(--space-3);
	}

	.pagination { display: flex; gap: var(--space-4); }
	.btn-inline { font-size: var(--text-sm); color: var(--color-accent); text-decoration: none; }
	.btn-inline:hover { text-decoration: underline; }
</style>
