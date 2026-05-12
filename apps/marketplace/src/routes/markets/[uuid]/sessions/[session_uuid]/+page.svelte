<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { marketplace, session, stalls } = $derived(data);

	function fmtDatetime(iso: string): string {
		return new Date(iso).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' });
	}
</script>

<div class="page">
	<div class="breadcrumb">
		<a href="/markets">Markets</a>
		<span>›</span>
		<a href="/markets/{marketplace.uuid}">{marketplace.name}</a>
	</div>

	<div class="session-header">
		<h1>{fmtDatetime(session.starts_at)}</h1>
		<span class="status-badge status-{session.status}">{session.status}</span>
	</div>
	<div class="session-ends">Ends: {fmtDatetime(session.ends_at)}</div>

	{#if session.notes}
		<p class="session-notes">{session.notes}</p>
	{/if}

	<section class="stalls-section">
		<h2>Stall Assignments</h2>

		{#if stalls.length === 0}
			<p class="empty">No stalls registered for this marketplace.</p>
		{:else}
			<div class="stall-table">
				<div class="stall-table-header">
					<span>Stall</span>
					<span>Assigned To</span>
				</div>
				{#each stalls as stall}
					<div class="stall-row">
						<div class="stall-name">{stall.name}</div>
						<div class="stall-assignee">
							{#if stall.assignment}
								<span class="handle">@{stall.assignment.assignee_handle_cache}</span>
								{#if stall.assignment.notes}
									<span class="assignment-notes">— {stall.assignment.notes}</span>
								{/if}
							{:else}
								<span class="unassigned">Unassigned</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 640px; }

	.breadcrumb { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); }
	.breadcrumb a { color: var(--color-text-muted); text-decoration: none; }
	.breadcrumb a:hover { text-decoration: underline; }
	.breadcrumb span { color: var(--color-text-muted); }

	.session-header { display: flex; align-items: center; gap: var(--space-3); }
	h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }
	h2 { margin: 0; font-size: var(--text-lg); font-weight: var(--weight-semibold); }

	.status-badge { padding: 2px 10px; border-radius: 9999px; font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: capitalize; }
	.status-scheduled { background: #d1fae5; color: #065f46; }
	.status-cancelled { background: #fee2e2; color: #7f1d1d; }

	.session-ends  { font-size: var(--text-sm); color: var(--color-text-muted); }
	.session-notes { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); font-style: italic; }

	.stalls-section { display: flex; flex-direction: column; gap: var(--space-3); }
	.empty { color: var(--color-text-muted); font-size: var(--text-sm); }

	.stall-table { border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
	.stall-table-header {
		display: grid; grid-template-columns: 160px 1fr;
		padding: var(--space-2) var(--space-5);
		background: var(--color-surface-alt, #f8fafc);
		font-size: var(--text-xs); font-weight: var(--weight-semibold);
		color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em;
		border-bottom: 1px solid var(--color-border);
	}
	.stall-row {
		display: grid; grid-template-columns: 160px 1fr;
		align-items: center; gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--color-border-faint);
		font-size: var(--text-sm);
	}
	.stall-row:last-child { border-bottom: none; }

	.stall-name     { font-weight: var(--weight-medium); }
	.handle         { font-family: var(--font-mono); font-size: var(--text-xs); }
	.assignment-notes { font-size: var(--text-xs); color: var(--color-text-muted); }
	.unassigned     { color: var(--color-text-muted); font-style: italic; font-size: var(--text-xs); }
</style>
