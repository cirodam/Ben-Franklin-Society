<script lang="ts">
	import { Badge, Breadcrumb, DescriptionList, EmptyState, PageHeader, formatDate, formatDateTime } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { marketplace, sessions, stallCount } = $derived(data);
</script>

<div class="page">
	<Breadcrumb items={[{ label: '← Markets', href: '/markets' }]} />

	<PageHeader title={marketplace.name}>
		{#snippet actions()}
			{#if marketplace.status === 'closed'}
				<Badge variant="danger">Closed</Badge>
			{/if}
		{/snippet}
		<div class="market-location">{marketplace.location}</div>
	</PageHeader>

	{#if marketplace.description}
		<p class="market-description">{marketplace.description}</p>
	{/if}

	<DescriptionList
		items={[
			{ label: 'Usual schedule', value: marketplace.default_schedule },
			{ label: 'Stalls available', value: stallCount }
		]}
	/>

	<section class="sessions-section">
		<h2>Upcoming Sessions</h2>

		{#if sessions.length === 0}
			<EmptyState title="No upcoming sessions scheduled." />
		{:else}
			<div class="session-list">
				{#each sessions as session}
					<a href="/markets/{marketplace.uuid}/sessions/{session.uuid}" class="session-row">
						<div class="session-date">{formatDate(session.starts_at)}</div>
						<div class="session-time">{formatDateTime(session.starts_at)} – {formatDateTime(session.ends_at)}</div>
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

	.market-location { color: var(--color-text-muted); font-size: var(--text-sm); margin-top: var(--space-1); }
	.market-description { margin: 0; font-size: var(--text-sm); color: var(--color-text); line-height: 1.6; }

	h2 { margin: 0; font-size: var(--text-lg); font-weight: var(--weight-semibold); }

	.info-row { display: flex; gap: var(--space-3); align-items: center; font-size: var(--text-sm); }
	.info-label { color: var(--color-text-muted); font-weight: var(--weight-medium); }

	.sessions-section { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-2); }

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
