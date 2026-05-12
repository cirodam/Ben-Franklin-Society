<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { treasury, sif, account, transactions, view, offset, hasMore } = $derived(data);

	const PAGE_SIZE = 50;
	function fmt(n: number) { return n.toLocaleString(); }
	function date(s: string) { return s.slice(0, 16).replace('T', ' '); }
	function typeLabel(t: string) {
		return { transfer: 'Transfer', issuance: 'Issuance', demurrage: 'Demurrage',
		         dues: 'Dues', payroll: 'Payroll', allowance: 'Allowance' }[t] ?? t;
	}

	function pageUrl(off: number) {
		const p = new URLSearchParams({ view });
		if (off > 0) p.set('offset', String(off));
		return `/treasury?${p}`;
	}
</script>

<div class="page">
	<div class="page-header">
		<h1>Treasury &amp; Social Insurance Fund</h1>
		<p class="subtitle">Community funds are open to inspection by all members.</p>
	</div>

	<!-- Balance cards -->
	<div class="balance-row">
		<a href="/treasury?view=treasury"
		   class="balance-card {view === 'treasury' ? 'balance-card--active' : ''}">
			<div class="balance-card__label">Treasury</div>
			<div class="balance-card__value {(treasury?.balance ?? 0) < 0 ? 'negative' : ''}">
				{fmt(treasury?.balance ?? 0)} ƒ
			</div>
		</a>
		<a href="/treasury?view=sif"
		   class="balance-card {view === 'sif' ? 'balance-card--active' : ''}">
			<div class="balance-card__label">Social Insurance Fund</div>
			<div class="balance-card__value {(sif?.balance ?? 0) < 0 ? 'negative' : ''}">
				{fmt(sif?.balance ?? 0)} ƒ
			</div>
		</a>
	</div>

	<!-- Transaction history for selected account -->
	{#if !account}
		<div class="card"><p class="empty">Account not found. Has the database been seeded?</p></div>
	{:else if transactions.length === 0}
		<div class="card"><p class="empty">No transactions yet.</p></div>
	{:else}
		<div class="card table-wrap">
			<div class="card__label">{account.name} — Transaction History</div>
			<table class="table">
				<thead>
					<tr>
						<th>Date</th>
						<th>Type</th>
						<th>From</th>
						<th>To</th>
						<th class="num">Amount</th>
						<th>Memo</th>
					</tr>
				</thead>
				<tbody>
					{#each transactions as tx}
						<tr>
							<td class="mono">{date(tx.created_at)}</td>
							<td><span class="type-badge">{typeLabel(tx.type)}</span></td>
							<td class="mono">@{tx.from_handle} · {tx.from_name}</td>
							<td class="mono">@{tx.to_handle} · {tx.to_name}</td>
							<td class="num {tx.to_uuid === account.uuid ? 'in' : 'out'}">
								{tx.to_uuid === account.uuid ? '+' : '−'}{fmt(tx.amount)} ƒ
							</td>
							<td>{tx.memo ?? ''}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="pagination">
			{#if offset > 0}
				<a href={pageUrl(Math.max(0, offset - PAGE_SIZE))} class="btn btn--sm">← Newer</a>
			{/if}
			{#if hasMore}
				<a href={pageUrl(offset + PAGE_SIZE)} class="btn btn--sm">Older →</a>
			{/if}
		</div>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-6); }
	.page-header { display: flex; flex-direction: column; gap: var(--space-1); }
	.page-header h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }
	.subtitle { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); }

	.balance-row { display: flex; gap: var(--space-4); flex-wrap: wrap; }

	.balance-card {
		flex: 1; min-width: 200px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5) var(--space-6);
		text-decoration: none;
		display: flex; flex-direction: column; gap: var(--space-1);
		transition: border-color 0.1s;
	}
	.balance-card--active { border-color: var(--color-accent); }
	.balance-card:hover { border-color: var(--color-accent); }

	.balance-card__label {
		font-size: var(--text-xs); font-weight: var(--weight-medium);
		text-transform: uppercase; letter-spacing: 0.06em;
		color: var(--color-text-muted);
	}
	.balance-card__value {
		font-size: 1.75rem; font-weight: var(--weight-bold);
		font-variant-numeric: tabular-nums; color: var(--color-text);
	}
	.balance-card__value.negative { color: var(--color-danger); }

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	.card__label {
		font-size: var(--text-xs); font-weight: var(--weight-medium);
		text-transform: uppercase; letter-spacing: 0.06em;
		color: var(--color-text-muted);
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--color-border-faint);
	}
	.table-wrap { overflow-x: auto; }

	.table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
	.table th { text-align: left; padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
	.table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-faint); vertical-align: top; }
	.table tr:last-child td { border-bottom: none; }

	.mono { font-family: var(--font-mono); font-size: var(--text-xs); }
	.num { text-align: right; font-variant-numeric: tabular-nums; font-family: var(--font-mono); }
	.in  { color: var(--color-success); }
	.out { color: var(--color-danger); }

	.type-badge { font-size: var(--text-xs); padding: 1px var(--space-2); border-radius: var(--radius); background: var(--color-bg-subtle); color: var(--color-text-muted); }

	.empty { color: var(--color-text-muted); padding: var(--space-6); text-align: center; margin: 0; }
	.pagination { display: flex; gap: var(--space-3); }

	.btn { display: inline-flex; align-items: center; font-size: var(--text-sm); padding: var(--space-2) var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-surface); text-decoration: none; color: var(--color-text); }
	.btn--sm { font-size: var(--text-xs); padding: var(--space-1) var(--space-3); }
	.btn:hover { background: var(--color-bg-subtle); }
</style>
