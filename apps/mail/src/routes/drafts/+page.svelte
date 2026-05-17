<script lang="ts">
	import { PageHeader, EmptyState, List, ListItem, formatRelativeDate } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { drafts, page, hasMore } = $derived(data);
</script>

<div class="page">
	<PageHeader title="Drafts" />

	{#if drafts.length === 0}
		<EmptyState
			icon="📋"
			title="No drafts"
		/>
	{:else}
		<List>
			{#each drafts as draft}
				<ListItem href="/compose?draft={draft.uuid}">
					<div class="msg-row-content">
						<span class="msg-row__subject">{draft.subject || '(no subject)'}</span>
						<span class="msg-row__date">{formatRelativeDate(draft.created_at)}</span>
					</div>
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

	.msg-row-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: var(--color-text-muted);
		font-style: italic;
	}

	.msg-row__subject {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.msg-row__date {
		font-size: var(--text-xs);
		white-space: nowrap;
		margin-left: var(--space-4);
	}

	.pagination { display: flex; gap: var(--space-4); }
	.btn-inline { font-size: var(--text-sm); color: var(--color-accent); text-decoration: none; }
	.btn-inline:hover { text-decoration: underline; }
</style>
