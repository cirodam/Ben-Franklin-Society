<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { reports } = $derived(data);

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString([], { dateStyle: 'medium' });
	}
</script>

<div class="page">
	<h1>Pending Reports</h1>

	{#if reports.length === 0}
		<p class="empty">No pending reports.</p>
	{:else}
		<div class="report-list">
			{#each reports as report}
				<a href="/administrator/reports/{report.uuid}" class="report-row">
					<div class="report-row__type">{report.listing_type}</div>
					<div class="report-row__title">{report.listing_title}</div>
					<div class="report-row__seller">@{report.seller_handle}</div>
					<div class="report-row__reporter">A member</div>
					<div class="report-row__date">{fmtDate(report.created_at)}</div>
					<div class="report-row__arrow">→</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 860px; }
	h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }
	.empty { color: var(--color-text-muted); font-size: var(--text-sm); }

	.report-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.report-row {
		display: grid;
		grid-template-columns: 80px 1fr 140px 100px 110px 20px;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--color-border-faint);
		text-decoration: none;
		color: var(--color-text);
		font-size: var(--text-sm);
	}
	.report-row:last-child { border-bottom: none; }
	.report-row:hover { background: var(--color-surface-alt, #f8fafc); }

	.report-row__type { font-size: var(--text-xs); text-transform: capitalize; color: var(--color-text-muted); }
	.report-row__title { font-weight: var(--weight-medium); }
	.report-row__seller { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-muted); }
	.report-row__reporter { color: var(--color-text-muted); font-size: var(--text-xs); }
	.report-row__date { color: var(--color-text-muted); font-size: var(--text-xs); }
	.report-row__arrow { color: var(--color-text-muted); }
</style>
