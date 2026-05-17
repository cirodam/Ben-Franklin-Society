<script lang="ts">
	import { EmptyState, List, ListItem, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { reports } = $derived(data);

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString([], { dateStyle: 'medium' });
	}
</script>

<div class="page">
	<PageHeader title="Pending Reports" />

	{#if reports.length === 0}
		<EmptyState title="No pending reports." />
	{:else}
		<List>
			{#each reports as report}
				<ListItem href="/administrator/reports/{report.uuid}">
					<div class="report-row-content">
					<div class="report-row__type">{report.listing_type}</div>
					<div class="report-row__title">{report.listing_title}</div>
					<div class="report-row__seller">@{report.seller_handle}</div>
						<div class="report-row__reporter">A member</div>
						<div class="report-row__date">{fmtDate(report.created_at)}</div>
						<div class="report-row__arrow">→</div>
					</div>
				</ListItem>
			{/each}
		</List>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 860px; }

	.report-row-content {
		display: grid;
		grid-template-columns: 80px 1fr 140px 100px 110px 20px;
		align-items: center;
		gap: var(--space-4);
	}

	.report-row__type { font-size: var(--text-xs); text-transform: capitalize; color: var(--color-text-muted); }
	.report-row__title { font-weight: var(--weight-medium); }
	.report-row__seller { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-muted); }
	.report-row__reporter { color: var(--color-text-muted); font-size: var(--text-xs); }
	.report-row__date { color: var(--color-text-muted); font-size: var(--text-xs); }
	.report-row__arrow { color: var(--color-text-muted); }
</style>
