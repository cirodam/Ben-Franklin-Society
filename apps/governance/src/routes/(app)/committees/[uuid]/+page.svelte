<script lang="ts">
	import Badge from '@bfs/ui/src/Badge.svelte';
	import RoleManagement from '$lib/components/RoleManagement.svelte';
	import OrgChart from '$lib/components/OrgChart.svelte';
	import Sections from '$lib/components/Sections.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { association, config, sourceCollege, termHolders, draws, roles, roleHierarchy, sections, members, canAssign, enactedMotions, motions, canVacate, record } = $derived(data);

	const statusVariant = (s: string) => s === 'active' ? 'success' : 'neutral';

	const motionVariant = (s: string) =>
		s === 'enacted' ? 'success'
		: s === 'rejected' ? 'danger'
		: s === 'vote' ? 'warn'
		: 'neutral';
</script>

<div class="page">
	<div class="page-header">
		<div class="page-header__top">
			<h1>{association.name}</h1>
			<div class="page-header__badges">
				<Badge label={config?.is_permanent ? 'Permanent' : 'Ad Hoc'} variant="neutral" />
				<Badge label={association.status} variant={statusVariant(association.status)} />
			</div>
		</div>
		<p class="handle">{association.handle}</p>
	</div>

	<div class="stats">
		<div class="stat">
			<div class="stat__value">{config?.seat_count ?? '—'}</div>
			<div class="stat__label">Seats</div>
		</div>
		<div class="stat">
			<div class="stat__value">{termHolders.length}</div>
			<div class="stat__label">Currently Seated</div>
		</div>
		<div class="stat">
			<div class="stat__value">{config?.term_days ?? '—'}</div>
			<div class="stat__label">Term (days)</div>
		</div>
		<div class="stat">
			<div class="stat__value">{sourceCollege ? sourceCollege.name : 'Community'}</div>
			<div class="stat__label">Draw Pool</div>
		</div>
	</div>

	<div class="sections">
		<section class="card">
			<h2>Current Seat Holders</h2>
			{#if termHolders.length === 0}
				<p class="empty">No seats currently filled. A sortition draw is needed.</p>
			{:else}
				<table class="roster">
					<thead>
						<tr>
							<th>Member</th>
							<th>Term Start</th>
							<th>Term End</th>
							{#if canVacate}<th></th>{/if}
						</tr>
					</thead>
					<tbody>
						{#each termHolders as t}
							<tr>
								<td>
									{#if t.person}
										<a href="/people/{t.person.uuid}">{t.person.given_name} {t.person.family_name}</a>
										<span class="handle-inline">{t.person.handle}</span>
									{:else}
										<span class="empty">Unknown</span>
									{/if}
								</td>
								<td>{t.started_at}</td>
								<td>{t.ends_at}</td>
								{#if canVacate}
									<td>
										<form method="POST" action="?/vacateTerm">
											<input type="hidden" name="term_uuid" value="{t.uuid}" />
											<button class="btn-vacate">Vacate</button>
										</form>
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>

		<section class="card">
			<h2>Draw History</h2>
			{#if draws.length === 0}
				<p class="empty">No draws conducted yet.</p>
			{:else}
				<table class="roster">
					<thead>
						<tr>
							<th>Conducted</th>
							<th>Pool Size</th>
							<th>Notes</th>
						</tr>
					</thead>
					<tbody>
						{#each draws as d}
							<tr>
								<td>{d.conducted_at}</td>
								<td>{d.pool_size}</td>
								<td>{d.notes ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>

		<Sections {sections} />

		<RoleManagement {roles} {members} {canAssign} {enactedMotions} />

		<OrgChart {roleHierarchy} />

		<section class="card">
			<h2>Recent Motions</h2>
			{#if motions.length === 0}
				<p class="empty">No motions yet.</p>
			{:else}
				<ul class="motion-list">
					{#each motions as m}
						<li class="motion">
							<a href="/motions/{m.uuid}" class="motion__title">{m.title}</a>
							<div class="motion__meta">
								<Badge label={m.status} variant={motionVariant(m.status)} />
								<span class="motion__date">{m.created_at.slice(0, 10)}</span>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

	<section class="card">
		<h2>The Record <a href="/record" class="record-all">View full record →</a></h2>
		{#if record.length === 0}
			<p class="empty">No entries yet.</p>
		{:else}
			<div class="record-feed">
				{#each record as e}
					<div class="record-entry">
						<div class="record-entry__body">{e.body}</div>
						<div class="record-entry__meta">
							{#if e.recorder_handle}<span>@{e.recorder_handle}</span><span class="meta-sep">·</span>{/if}
							<time>{e.created_at.slice(0, 10)}</time>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
	</div>
</div>

<style>
	.page-header__top { display: flex; align-items: center; gap: var(--space-3); }
	.page-header__badges { display: flex; gap: var(--space-2); }
	.handle { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-1); }

	.stats { display: flex; gap: var(--space-6); flex-wrap: wrap; }
	.stat { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-5) var(--space-6); min-width: 140px; }
	.stat__value { font-size: var(--text-2xl); font-weight: var(--weight-bold); }
	.stat__label { font-size: var(--text-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: var(--space-1); }

	.sections { display: flex; flex-direction: column; gap: var(--space-6); }
	.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-6); }
	.card h2 { font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-4); display: flex; align-items: center; gap: var(--space-2); }
	.count { font-size: var(--text-xs); font-weight: var(--weight-normal); color: var(--color-text-muted); background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 999px; padding: 1px 8px; }
	.empty { font-size: var(--text-sm); color: var(--color-text-muted); }

    .btn-vacate {
        padding: var(--space-1) var(--space-2);
        font-size: var(--text-xs);
        background: #fee2e2;
        color: #991b1b;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
    }
	.roster { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
	.roster th { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); color: var(--color-text-muted); font-weight: var(--weight-medium); text-transform: uppercase; font-size: var(--text-xs); letter-spacing: 0.05em; }
	.roster td { padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); }
	.roster tr:last-child td { border-bottom: none; }
	.handle-inline { color: var(--color-text-muted); font-size: var(--text-xs); margin-left: var(--space-2); }

	.tag-list { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: var(--space-2); }
	.tag { font-size: var(--text-xs); background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 999px; padding: var(--space-1) var(--space-3); }

	.motion-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-3); }
	.motion { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); }
	.motion__title { font-size: var(--text-sm); color: var(--color-text); text-decoration: none; }
	.motion__title:hover { text-decoration: underline; }
	.motion__meta { display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0; }
	.motion__date { font-size: var(--text-xs); color: var(--color-text-muted); }

	/* Record */
	.record-all {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-decoration: none;
		font-weight: var(--weight-normal);
		margin-left: var(--space-3);
	}
	.record-all:hover { text-decoration: underline; }
	.record-feed { display: flex; flex-direction: column; }
	.record-entry {
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--color-border);
	}
	.record-entry:first-child { padding-top: 0; }
	.record-entry:last-child { border-bottom: none; padding-bottom: 0; }
	.record-entry__body { font-size: var(--text-sm); line-height: 1.5; margin-bottom: var(--space-1); }
	.record-entry__meta {
		display: flex;
		gap: var(--space-2);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
	.meta-sep { color: var(--color-border); }
</style>
