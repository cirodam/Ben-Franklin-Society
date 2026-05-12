<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { messages, page, hasMore } = $derived(data);

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
		<h1>Sent</h1>
	</div>

	{#if messages.length === 0}
		<p class="empty">No sent messages.</p>
	{:else}
		<div class="msg-list">
			{#each messages as msg}
				<a href="/thread/{msg.thread_id}" class="msg-row">
					<span class="msg-row__subject">{msg.subject}</span>
					<span class="msg-row__date">{fmtDate(msg.sent_at)}</span>
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
	.page { display: flex; flex-direction: column; gap: var(--space-6); }
	.page-header h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }
	.empty { color: var(--color-text-muted); font-size: var(--text-sm); }

	.msg-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.msg-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--color-border-faint);
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-surface);
		font-size: var(--text-sm);
	}
	.msg-row:last-child { border-bottom: none; }
	.msg-row:hover { background: var(--color-accent-subtle); }

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
