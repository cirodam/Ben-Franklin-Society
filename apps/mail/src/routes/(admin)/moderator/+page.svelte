<script lang="ts">
	import { EmptyState, List, ListItem, PageHeader, formatDateTime } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { reports } = $derived(data);
</script>

<div class="page">
	<PageHeader title="Pending Reports" description="{reports.length} pending" />

	{#if reports.length === 0}
		<EmptyState title="No pending reports. All clear." />
	{:else}
		<List>
			{#each reports as report}
				<ListItem href="/moderator/reports/{report.uuid}">
					<div class="report-row-content">
					<div class="report-row__subject">{report.message_subject}</div>
					<div class="report-row__from">from @{report.message_from_handle}</div>
					<div class="report-row__meta">
							<span class="report-row__reporter">A member</span>
							<span class="report-row__date">{formatDateTime(report.created_at)}</span>
						</div>
					</div>
				</ListItem>
			{/each}
		</List>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-6); }

	.report-row-content {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: var(--space-6);
	}

	.report-row__subject {
		font-weight: var(--weight-medium);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.report-row__from {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		white-space: nowrap;
	}

	.report-row__meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
	}

	.report-row__reporter {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.report-row__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		white-space: nowrap;
	}
</style>
