<script lang="ts">
	import { Badge, Breadcrumb, EmptyState, PageHeader, formatDateTime } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { marketplace, session, stalls } = $derived(data);
</script>

<div class="page">
	<Breadcrumb items={[
		{ label: 'Markets', href: '/markets' },
		{ label: marketplace.name, href: `/markets/${marketplace.uuid}` },
		{ label: 'Session' }
	]} />

	<PageHeader title={formatDateTime(session.starts_at)}>
		{#snippet actions()}
			<Badge variant={session.status === 'cancelled' ? 'danger' : 'success'}>{session.status}</Badge>
		{/snippet}
		<div class="session-ends">Ends: {formatDateTime(session.ends_at)}</div>
	</PageHeader>

	{#if session.notes}
		<p class="session-notes">{session.notes}</p>
	{/if}

	<section class="stalls-section">
		<h2>Stall Assignments</h2>

		{#if stalls.length === 0}
			<EmptyState title="No stalls registered for this marketplace." />
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
	.page { display: flex; flex-direction: column; gap: var(--space-5); }

	.session-ends  { font-size: var(--text-sm); color: var(--color-text-muted); }
	.session-notes { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); font-style: italic; }

	h2 { margin: 0; font-size: var(--text-lg); font-weight: var(--weight-semibold); }
	.stalls-section { display: flex; flex-direction: column; gap: var(--space-3); }

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
