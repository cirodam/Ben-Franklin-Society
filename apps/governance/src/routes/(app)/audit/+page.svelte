<script lang="ts">
	import { EmptyState, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { entries, actorMap, motionMap, offset, hasMore } = $derived(data);

	const PAGE_SIZE = 50;
</script>

<div class="page">
	<PageHeader 
		title="Audit Log"
		description="Every write action recorded in the system."
	/>

	{#if entries.length === 0}
		<EmptyState 
			icon="📋"
			title="No entries yet"
			description="Write actions will appear here."
		/>
	{:else}
		<div class="log">
			{#each entries as entry}
				<div class="entry">
					<div class="entry__meta">
						<span class="entry__action">{entry.action}</span>
						<span class="entry__actor">
							<a href="/people/{actorMap[entry.actor_uuid] ?? entry.actor_uuid}">
								@{actorMap[entry.actor_uuid] ?? entry.actor_uuid}
							</a>
						</span>
						<span class="entry__time">{entry.created_at.slice(0, 19).replace('T', ' ')}</span>
					</div>
					<p class="entry__detail">{entry.detail ?? '—'}</p>
					{#if entry.motion_uuid}
						<div class="entry__motion">
							via motion:
							<a href="/motions/{entry.motion_uuid}">
								{motionMap[entry.motion_uuid] ?? entry.motion_uuid}
							</a>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<div class="pagination">
			{#if offset > 0}
				<a href="?offset={Math.max(0, offset - PAGE_SIZE)}" class="btn">← Newer</a>
			{/if}
			{#if hasMore}
				<a href="?offset={offset + PAGE_SIZE}" class="btn">Older →</a>
			{/if}
		</div>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 860px;
		margin: 0 auto;
	}

	.log {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.entry {
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.entry:last-child { border-bottom: none; }

	.entry__meta {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.entry__action {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 1px var(--space-2);
		color: var(--color-text);
	}

	.entry__actor a {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text);
		text-decoration: none;
	}
	.entry__actor a:hover { text-decoration: underline; }

	.entry__time {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		margin-left: auto;
		white-space: nowrap;
	}

	.entry__detail {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.entry__motion {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
	.entry__motion a {
		color: var(--color-text-muted);
		text-decoration: underline;
	}
	.entry__motion a:hover { color: var(--color-text); }

	.pagination {
		display: flex;
		gap: var(--space-3);
		justify-content: center;
	}
</style>
