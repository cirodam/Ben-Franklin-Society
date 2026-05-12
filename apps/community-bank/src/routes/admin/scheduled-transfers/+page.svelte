<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { transfers } = $derived(data);

	function fmt(n: number) { return n.toLocaleString(); }
	function date(s: string) { return s.slice(0, 10); }

	const statusOrder = ['active', 'paused', 'cancelled'];
	const sorted = $derived([...transfers].sort((a, b) => {
		const ia = statusOrder.indexOf(a.status);
		const ib = statusOrder.indexOf(b.status);
		return ia !== ib ? ia - ib : a.name.localeCompare(b.name);
	}));
</script>

<div class="page">
	<h1>Scheduled Transfers</h1>
	<p class="subtitle">View, pause, or cancel recurring transfers. Creation requires a governance motion.</p>

	{#if form?.error}
		<div class="error-banner">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="success-banner">Transfer updated.</div>
	{/if}

	{#if transfers.length === 0}
		<div class="card"><p class="empty">No scheduled transfers configured.</p></div>
	{:else}
		<div class="card table-card">
			<table class="table">
				<thead>
					<tr>
						<th>Name</th>
						<th>From</th>
						<th>To</th>
						<th class="num">Amount (ƒ)</th>
						<th>Type</th>
						<th>Schedule</th>
						<th>Status</th>
						<th>Created</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each sorted as t}
						<tr class="row--{t.status}">
							<td>{t.name}</td>
							<td class="mono">@{t.from_handle}<br /><span class="acct-name">{t.from_name}</span></td>
							<td class="mono">@{t.to_handle}<br /><span class="acct-name">{t.to_name}</span></td>
							<td class="num">{fmt(t.amount)}</td>
							<td>{t.type}</td>
							<td class="mono">{t.schedule}</td>
							<td><span class="badge badge--{t.status}">{t.status}</span></td>
							<td class="mono">{date(t.created_at)}</td>
							<td class="actions-cell">
								{#if t.status === 'active'}
									<form method="POST" action="?/pause" use:enhance>
										<input type="hidden" name="uuid" value={t.uuid} />
										<button type="submit" class="btn-sm btn-sm--warn">Pause</button>
									</form>
									<form method="POST" action="?/cancel" use:enhance>
										<input type="hidden" name="uuid" value={t.uuid} />
										<button type="submit" class="btn-sm btn-sm--danger">Cancel</button>
									</form>
								{:else if t.status === 'paused'}
									<form method="POST" action="?/unpause" use:enhance>
										<input type="hidden" name="uuid" value={t.uuid} />
										<button type="submit" class="btn-sm btn-sm--primary">Resume</button>
									</form>
									<form method="POST" action="?/cancel" use:enhance>
										<input type="hidden" name="uuid" value={t.uuid} />
										<button type="submit" class="btn-sm btn-sm--danger">Cancel</button>
									</form>
								{:else}
									<span class="cancelled-note">Cancelled {t.cancelled_at ? date(t.cancelled_at) : ''}</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }
	.page { display: flex; flex-direction: column; gap: var(--space-5); }
	.subtitle { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); }

	.error-banner { background: var(--color-danger-subtle); color: var(--color-danger); border-radius: var(--radius); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); }
	.success-banner { background: var(--color-success-subtle); color: var(--color-success); border-radius: var(--radius); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); }

	.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
	.table-card { overflow-x: auto; }
	.table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
	.table th { text-align: left; padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
	.table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-faint); vertical-align: middle; }
	.table tr:last-child td { border-bottom: none; }
	.row--paused td { opacity: 0.7; }
	.row--cancelled td { opacity: 0.45; }

	.mono { font-family: var(--font-mono); font-size: var(--text-xs); }
	.acct-name { color: var(--color-text-muted); }
	.num { text-align: right; font-variant-numeric: tabular-nums; font-family: var(--font-mono); }

	.badge { font-size: var(--text-xs); padding: 2px var(--space-2); border-radius: var(--radius); font-weight: var(--weight-medium); }
	.badge--active { background: var(--color-success-subtle, #e6f4ea); color: var(--color-success); }
	.badge--paused { background: #fef3c7; color: #92400e; }
	.badge--cancelled { background: var(--color-surface); color: var(--color-text-muted); border: 1px solid var(--color-border); }

	.actions-cell { display: flex; gap: var(--space-2); align-items: center; }
	.btn-sm { display: inline-flex; align-items: center; font-family: var(--font-sans); font-size: var(--text-xs); padding: 2px var(--space-3); border: 1px solid transparent; border-radius: var(--radius); cursor: pointer; font-weight: var(--weight-medium); }
	.btn-sm--primary { background: var(--color-accent); color: #fff; }
	.btn-sm--warn { background: #b45309; color: #fff; }
	.btn-sm--danger { background: var(--color-danger); color: #fff; }
	.btn-sm:hover { opacity: 0.85; }

	.cancelled-note { font-size: var(--text-xs); color: var(--color-text-muted); }

	.empty { padding: var(--space-6); text-align: center; color: var(--color-text-muted); margin: 0; }
</style>
