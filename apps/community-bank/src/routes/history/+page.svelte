<script lang="ts">
	import { PageHeader, Card, EmptyState, Button } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { accounts, account, transactions, typeFilter, offset, hasMore } = $derived(data);

	const PAGE_SIZE = 50;

	const TX_TYPES = ['', 'transfer', 'issuance', 'demurrage', 'dues', 'payroll', 'allowance'];

	// Format cents as currency (e.g., 1254 -> "12.54")
	function fmtCurrency(cents: number): string {
		return (cents / 100).toFixed(2);
	}
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
		<div class="transaction-list">
			{#each transactions as tx}
				<div class="transaction-item">
					<div class="transaction-header">
						<span class="transaction-date t-mono">{date(tx.created_at)}</span>
						<span class="transaction-type type-badge--{tx.type}">{typeLabel(tx.type)}</span>
					</div>
					
					<div class="transaction-flow">
						<div class="transaction-party">
							<span class="party-label">From</span>
							<span class="party-handle t-mono">@{tx.from_handle}</span>
							<span class="party-name">{tx.from_name}</span>
						</div>
						
						<div class="transaction-arrow">→</div>
						
						<div class="transaction-party">
							<span class="party-label">To</span>
							<span class="party-handle t-mono">@{tx.to_handle}</span>
							<span class="party-name">{tx.to_name}</span>
						</div>
					</div>
					
					<div class="transaction-footer">
						<div class="transaction-amount {tx.from_uuid === account.uuid ? 'out' : 'in'}">
							<span class="currency-badge {tx.currency}">{tx.currency === 'franks' ? '🟢' : '🟡'}</span>
							{tx.from_uuid === account.uuid ? '−' : '+'}{fmtCurrency(tx.amount)}
						</div>
						{#if tx.memo}
							<div class="transaction-memo">{tx.memo}</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

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
	.page { 
		display: flex; 
		flex-direction: column; 
		gap: var(--space-6);
		max-width: 800px;
	}

	.filters { 
		display: flex; 
		flex-direction: column; 
		gap: var(--space-3); 
	}
	
	.filter-group { 
		display: flex; 
		align-items: center; 
		gap: var(--space-2); 
		flex-wrap: wrap; 
	}
	
	.filter-label { 
		font-family: var(--font-sans);
		font-size: var(--text-xs); 
		font-weight: 600;
		color: var(--ink-mid); 
		text-transform: uppercase; 
		letter-spacing: 0.08em; 
		min-width: 64px; 
	}

	.filter-chip {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 500;
		padding: 0.375rem var(--space-3);
		border-radius: var(--radius);
		border: 1.5px solid var(--border);
		text-decoration: none;
		color: var(--ink);
		background: var(--ledger);
		transition: all 0.15s;
	}
	
	.filter-chip:hover {
		border-color: var(--copper);
		background: var(--copper-light);
	}
	
	.filter-chip--active { 
		background: var(--copper); 
		color: white; 
		border-color: var(--copper);
		font-weight: 600;
	}

	/* Transaction list - receipt style */
	.transaction-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.transaction-item {
		background: var(--ledger);
		border: 1px solid var(--border);
		border-top: 3px dashed var(--border-strong);
		border-radius: var(--radius);
		padding: var(--space-5);
		position: relative;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.transaction-item:hover {
		border-color: var(--copper);
		box-shadow: 0 2px 8px rgba(139, 90, 60, 0.1);
	}

	/* Subtle ledger lines background */
	.transaction-item::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image: repeating-linear-gradient(
			transparent,
			transparent 1.5rem,
			rgba(139, 90, 60, 0.03) 1.5rem,
			rgba(139, 90, 60, 0.03) calc(1.5rem + 1px)
		);
		pointer-events: none;
		border-radius: inherit;
	}

	.transaction-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
		position: relative;
		z-index: 1;
	}

	.transaction-date {
		font-size: var(--text-xs);
		color: var(--ink-faint);
	}

	.transaction-type {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.25rem var(--space-3);
		border-radius: var(--radius-sm);
		background: var(--ledger-lined);
		color: var(--ink-mid);
	}

	.type-badge--transfer { background: var(--copper-light); color: var(--copper); }
	.type-badge--issuance { background: var(--olive-light); color: var(--olive); }
	.type-badge--payroll { background: var(--olive-light); color: var(--olive); }
	.type-badge--allowance { background: var(--olive-light); color: var(--olive); }
	.type-badge--demurrage { background: var(--alert-amber-light); color: var(--alert-amber); }
	.type-badge--dues { background: var(--alert-amber-light); color: var(--alert-amber); }

	.transaction-flow {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: var(--space-4);
		align-items: center;
		margin-bottom: var(--space-4);
		position: relative;
		z-index: 1;
	}

	.transaction-party {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.party-label {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ink-faint);
	}

	.party-handle {
		font-size: var(--text-sm);
		color: var(--copper);
		font-weight: 500;
	}

	.party-name {
		font-family: var(--font-serif);
		font-size: var(--text-sm);
		color: var(--ink-mid);
	}

	.transaction-arrow {
		font-size: var(--text-xl);
		color: var(--border-strong);
		text-align: center;
	}

	.transaction-footer {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: var(--space-4);
		position: relative;
		z-index: 1;
	}

	.transaction-amount {
		font-family: var(--font-sans);
		font-size: var(--text-2xl);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.01em;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.transaction-amount.in { color: var(--olive); }
	.transaction-amount.out { color: var(--ink); }

	.currency-badge {
		font-size: var(--text-lg);
		line-height: 1;
	}

	.transaction-memo {
		flex: 1;
		font-family: var(--font-serif);
		font-size: var(--text-sm);
		font-style: italic;
		color: var(--ink-mid);
		padding-left: var(--space-4);
		border-left: 2px solid var(--border-faint);
		line-height: 1.6;
	}

	.pagination { 
		display: flex; 
		gap: var(--space-3); 
		justify-content: center;
	}

	@media (max-width: 640px) {
		.transaction-flow {
			grid-template-columns: 1fr;
			gap: var(--space-3);
		}
		
		.transaction-arrow {
			transform: rotate(90deg);
		}
		
		.transaction-footer {
			flex-direction: column;
			align-items: flex-start;
		}
		
		.transaction-memo {
			padding-left: 0;
			padding-top: var(--space-2);
			border-left: none;
			border-top: 2px solid var(--border-faint);
		}
	}
</style>
