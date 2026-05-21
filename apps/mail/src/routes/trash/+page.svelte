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
		<div class="message-list">
			{#each messages as msg}
				<div class="message-envelope message-envelope--trash">
					<div class="envelope-content">
						<a href="/thread/{msg.thread_id}" class="envelope-subject">{msg.subject}</a>
						<span class="envelope-from t-address">@{msg.from_handle_cache}</span>
						<span class="envelope-date t-meta">{formatRelativeDate(msg.trashed_at)}</span>
					</div>
					<div class="envelope-actions">
						<form method="POST" action="?/restore" use:enhance>
							<input type="hidden" name="message_uuid" value={msg.uuid} />
							<Button type="submit" variant="secondary" size="sm">Restore</Button>
						</form>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="message_uuid" value={msg.uuid} />
							<Button type="submit" variant="danger" size="sm">Delete</Button>
						</form>
					</div>
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

	.message-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.message-envelope {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-5);
		padding: var(--space-4) var(--space-5);
		background: var(--envelope-cream);
		border: 2px solid var(--border-strong);
		border-radius: var(--radius);
		transition: all 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.message-envelope--trash {
		opacity: 0.75;
		background: var(--border-faint);
	}

	.message-envelope:hover {
		opacity: 1;
		border-color: var(--postal-blue);
		box-shadow: 0 2px 8px rgba(43, 76, 126, 0.12);
	}

	.envelope-content {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: var(--space-4);
		min-width: 0;
	}

	.envelope-subject {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--ink-navy);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-decoration: none;
		transition: color 0.2s;
	}

	.envelope-subject:hover {
		color: var(--postal-blue);
		text-decoration: underline;
	}

	.envelope-from {
		white-space: nowrap;
	}

	.envelope-date {
		white-space: nowrap;
	}

	.envelope-actions {
		display: flex;
		gap: var(--space-2);
		flex-shrink: 0;
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

	@media (max-width: 768px) {
		.message-envelope {
			flex-direction: column;
			align-items: stretch;
		}

		.envelope-content {
			grid-template-columns: 1fr;
			gap: var(--space-2);
		}

		.envelope-actions {
			justify-content: flex-end;
		}
	}
</style>
