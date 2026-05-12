<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { marketplace, sessions, stallCount } = $derived(data);

	function fmtDatetime(iso: string): string {
		return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
	}
	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString([], { dateStyle: 'medium' });
	}
</script>

<div class="page">
	<div class="breadcrumb"><a href="/markets">← Markets</a></div>

	<div class="market-header">
		<div>
			<h1>{marketplace.name}</h1>
			<div class="market-location">{marketplace.location}</div>
		</div>
		{#if marketplace.status === 'closed'}
			<span class="status-badge status-closed">Closed</span>
		{/if}
	</div>

	{#if marketplace.description}
		<p class="market-description">{marketplace.description}</p>
	{/if}

	{#if marketplace.default_schedule}
		<div class="info-row">
			<span class="info-label">Usual schedule:</span>
			<span>{marketplace.default_schedule}</span>
		</div>
	{/if}

	<div class="info-row">
		<span class="info-label">Stalls available:</span>
		<span>{stallCount}</span>
	</div>

	<section class="sessions-section">
		<h2>Upcoming Sessions</h2>

		{#if sessions.length === 0}
			<p class="empty">No upcoming sessions scheduled.</p>
		{:else}
			<div class="session-list">
				{#each sessions as session}
					<a href="/markets/{marketplace.uuid}/sessions/{session.uuid}" class="session-row">
						<div class="session-date">{fmtDate(session.starts_at)}</div>
						<div class="session-time">{fmtDatetime(session.starts_at)} – {fmtDatetime(session.ends_at)}</div>
						{#if session.notes}
							<div class="session-notes">{session.notes}</div>
						{/if}
						<div class="session-arrow">→</div>
					</a>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 700px; }
	.breadcrumb a { color: var(--color-text-muted); font-size: var(--text-sm); text-decoration: none; }
	.breadcrumb a:hover { text-decoration: underline; }

	.market-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); }
	h1 { margin: 0; font-size: var(--text-2xl); font-weight: var(--weight-bold); }
	h2 { margin: 0; font-size: var(--text-lg); font-weight: var(--weight-semibold); }
	.market-location { color: var(--color-text-muted); font-size: var(--text-sm); margin-top: var(--space-1); }
	.market-description { margin: 0; font-size: var(--text-sm); color: var(--color-text); line-height: 1.6; }

	.status-badge { padding: 2px 10px; border-radius: 9999px; font-size: var(--text-xs); font-weight: var(--weight-medium); }
	.status-closed { background: #fee2e2; color: #7f1d1d; }

	.info-row { display: flex; gap: var(--space-3); align-items: center; font-size: var(--text-sm); }
	.info-label { color: var(--color-text-muted); font-weight: var(--weight-medium); }

	.sessions-section { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-2); }
	.empty { color: var(--color-text-muted); font-size: var(--text-sm); }

	.session-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	.session-row {
		display: grid;
		grid-template-columns: 110px 1fr auto 20px;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--color-border-faint);
		text-decoration: none;
		color: var(--color-text);
		font-size: var(--text-sm);
	}
	.session-row:last-child { border-bottom: none; }
	.session-row:hover { background: var(--color-surface-alt, #f8fafc); }

	.session-date  { font-weight: var(--weight-medium); }
	.session-time  { color: var(--color-text-muted); font-size: var(--text-xs); }
	.session-notes { font-size: var(--text-xs); color: var(--color-text-muted); font-style: italic; }
	.session-arrow { color: var(--color-text-muted); }
</style>
