<script lang="ts">
	import Badge from '@bfs/ui/src/Badge.svelte';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();

	const motionVariant = (s: string) =>
		s === 'enacted'    ? 'success'
		: s === 'rejected' ? 'danger'
		: s === 'vote'     ? 'warn'
		: 'neutral';
</script>

<div class="page">
	<div class="page-header">
		<h1>General Assembly</h1>
		<p class="subtitle">The sovereign governing body of the society, seated by sortition.</p>
	</div>

	<div class="stats">
		<div class="stat">
			<div class="stat__value">{data.config?.seat_count ?? '—'}</div>
			<div class="stat__label">Seats</div>
		</div>
		<div class="stat">
			<div class="stat__value">{data.termHolders.length}</div>
			<div class="stat__label">Currently Seated</div>
		</div>
		<div class="stat">
			<div class="stat__value">{data.config?.term_days ?? '—'}</div>
			<div class="stat__label">Term (days)</div>
		</div>
		<div class="stat">
			<div class="stat__value">{data.association.created_at.slice(0, 10)}</div>
			<div class="stat__label">Established</div>
		</div>
	</div>

	<section class="card">
		<h2>Current Seat Holders</h2>
		{#if data.termHolders.length === 0}
			<p class="empty">No seats currently filled. A sortition draw is needed.</p>
		{:else}
			<table class="roster">
				<thead>
					<tr>
						<th>Member</th>
						<th>Term Start</th>
						<th>Term End</th>
						{#if data.canVacate}<th></th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each data.termHolders as t}
						<tr>
							<td>
								{#if t.person}
									{t.person.given_name} {t.person.family_name}
									<span class="handle">{t.person.handle}</span>
								{:else}
									<span class="empty">Unknown</span>
								{/if}
							</td>
							<td>{t.started_at}</td>
							<td>{t.ends_at}</td>
							{#if data.canVacate}
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
		{#if data.draws.length === 0}
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
					{#each data.draws as d}
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

	<section class="card">
		<h2>Recent Motions</h2>
		{#if data.recentMotions.length === 0}
			<p class="empty">No motions yet.</p>
		{:else}
			<ul class="motion-list">
				{#each data.recentMotions as m}
					<li class="motion-item">
						<span class="motion-title">{m.title}</span>
						<Badge label={m.status} variant={motionVariant(m.status)} />
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="card">
		<h2>The Record <a href="/record" class="record-all">View full record →</a></h2>
		{#if data.record.length === 0}
			<p class="empty">No entries yet.</p>
		{:else}
			<div class="record-feed">
				{#each data.record as e}
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

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}
	.page-header h1 { margin-bottom: var(--space-1); }
	.subtitle { color: var(--color-text-muted); font-size: var(--text-sm); }

	.stats {
		display: flex;
		gap: var(--space-6);
		flex-wrap: wrap;
	}
	.stat {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5) var(--space-6);
		min-width: 140px;
	}
	.stat__value {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
	}
	.stat__label {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: var(--space-1);
	}

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}
	.card h2 { margin-bottom: var(--space-4); font-size: var(--text-base); }

	.roster {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}
	.roster th {
		text-align: left;
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		font-size: var(--text-xs);
		letter-spacing: 0.05em;
	}
	.roster td {
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid var(--color-border);
	}
	.roster tr:last-child td { border-bottom: none; }

	.handle {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		margin-left: var(--space-2);
	}
	.empty { color: var(--color-text-muted); font-size: var(--text-sm); }

	.btn-vacate {
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-xs);
		background: #fee2e2;
		color: #991b1b;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.motion-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-2); }
	.motion-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--color-border);
		font-size: var(--text-sm);
	}
	.motion-item:last-child { border-bottom: none; }
	.motion-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Record */
	h2 { display: flex; align-items: baseline; gap: var(--space-3); margin: 0 0 var(--space-4); }
	.record-all {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-decoration: none;
		font-weight: var(--weight-normal);
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
