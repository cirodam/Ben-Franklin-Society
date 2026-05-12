<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { reports } = $derived(data);

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleString([], {
			month: 'short', day: 'numeric',
			hour: '2-digit', minute: '2-digit',
		});
	}
</script>

<div class="page">
	<div class="page-header">
		<h1>Pending Reports</h1>
		<span class="count">{reports.length} pending</span>
	</div>

	{#if reports.length === 0}
		<p class="empty">No pending reports. All clear.</p>
	{:else}
		<div class="report-list">
			{#each reports as report}
				<a href="/moderator/reports/{report.uuid}" class="report-row">
					<div class="report-row__subject">{report.message_subject}</div>
					<div class="report-row__from">from @{report.message_from_handle}</div>
					<div class="report-row__meta">
						<span class="report-row__reporter">A member</span>
						<span class="report-row__date">{fmtDate(report.created_at)}</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-6); }

	.page-header {
		display: flex;
		align-items: baseline;
		gap: var(--space-4);
	}
	.page-header h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }

	.count {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

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
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--color-border-faint);
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-surface);
		font-size: var(--text-sm);
	}
	.report-row:last-child { border-bottom: none; }
	.report-row:hover { background: #f0f9f0; }

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
