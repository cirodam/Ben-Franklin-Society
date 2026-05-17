<script lang="ts">
	import { PageHeader, Card, EmptyState, Button } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { accounts, account, transactions, typeFilter, offset, hasMore } = $derived(data);

	const PAGE_SIZE = 50;

	const TX_TYPES = ['', 'transfer', 'issuance', 'demurrage', 'dues', 'payroll', 'allowance'];

	function fmt(n: number) { return n.toLocaleString(); }
	function date(s: string) { return s.slice(0, 16).replace('T', ' '); }

	function typeLabel(t: string) {
		return { transfer: 'Transfer', issuance: 'Issuance', demurrage: 'Demurrage',
		         dues: 'Dues', payroll: 'Payroll', allowance: 'Allowance' }[t] ?? t;
	}

	function pageUrl(off: number) {
		const p = new URLSearchParams();
		if (account) p.set('account', account.uuid);
		if (typeFilter) p.set('type', typeFilter);
		if (off > 0) p.set('offset', String(off));
		return `/history?${p}`;
	}
</script>

<div class="page">
	<PageHeader title="Transaction History" />

	<!-- Account picker -->
	{#if accounts.length > 1}
		<div class="filters">
			<div class="filter-group">
				<span class="filter-label">Account</span>
				{#each accounts as a}
					<a href="/history?account={a.uuid}{typeFilter ? '&type=' + typeFilter : ''}"
					   class="filter-chip {account?.uuid === a.uuid ? 'filter-chip--active' : ''}">
						{a.name}
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Type filter -->
	<div class="filters">
		<div class="filter-group">
			<span class="filter-label">Type</span>
			{#each TX_TYPES as t}
				<a href={pageUrl(0).replace(typeFilter ? `type=${typeFilter}` : '', t ? `type=${t}` : '')}
				   class="filter-chip {typeFilter === t ? 'filter-chip--active' : ''}">
					{t === '' ? 'All' : typeLabel(t)}
				</a>
			{/each}
		</div>
	</div>

	{#if !account}
		<Card><EmptyState title="No accounts found." /></Card>
	{:else if transactions.length === 0}
		<Card><EmptyState title="No transactions yet." /></Card>
	{:else}
		<Card class="table-wrap">
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
							<td><span class="type-badge type-badge--{tx.type}">{typeLabel(tx.type)}</span></td>
							<td class="mono">@{tx.from_handle} · {tx.from_name}</td>
							<td class="mono">@{tx.to_handle} · {tx.to_name}</td>
							<td class="num {tx.from_uuid === account.uuid ? 'out' : 'in'}">
								{tx.from_uuid === account.uuid ? '−' : '+'}{fmt(tx.amount)} ƒ
							</td>
							<td>{tx.memo ?? ''}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</Card>

		<div class="pagination">
			{#if offset > 0}
				<Button href={pageUrl(Math.max(0, offset - PAGE_SIZE))} variant="secondary" size="sm">← Newer</Button>
			{/if}
			{#if hasMore}
				<Button href={pageUrl(offset + PAGE_SIZE)} variant="secondary" size="sm">Older →</Button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-6); }

	.filters { display: flex; flex-direction: column; gap: var(--space-3); }
	.filter-group { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
	.filter-label { font-size: var(--text-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; min-width: 56px; }

	.filter-chip {
		font-size: var(--text-xs);
		padding: 2px var(--space-2);
		border-radius: var(--radius);
		border: 1px solid var(--color-border);
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-surface);
	}
	.filter-chip--active { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }

	:global(.table-wrap) { overflow-x: auto; }

	.table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
	.table th { text-align: left; padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
	.table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-faint); vertical-align: top; }
	.table tr:last-child td { border-bottom: none; }

	.mono { font-family: var(--font-mono); font-size: var(--text-xs); }
	.num { text-align: right; font-variant-numeric: tabular-nums; font-family: var(--font-mono); }
	.in  { color: var(--color-success); }
	.out { color: var(--color-danger); }

	.type-badge {
		font-size: var(--text-xs);
		padding: 1px var(--space-2);
		border-radius: var(--radius);
		background: var(--color-bg-subtle);
		color: var(--color-text-muted);
	}

	.pagination { display: flex; gap: var(--space-3); }
</style>
