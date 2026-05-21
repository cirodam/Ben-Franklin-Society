<script lang="ts">
	import { PageHeader, Card, Button, Input } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { q, result, recentTxs } = $derived(data);

	function fmt(n: number) { return n.toLocaleString(); }
	function date(s: string) { return s.slice(0, 16).replace('T', ' '); }
</script>

<div class="page">
	<PageHeader title="Teller Desk" />

	<form method="GET" action="/teller" class="lookup-form">
		<div class="lookup-field">
			<Input
				name="q"
				type="text"
				placeholder="Search by handle (e.g. jane_smith or food-service)"
				value={q}
			/>
		</div>
		<Button type="submit" variant="primary">Look Up</Button>
	</form>

	{#if q && !result}
		<Card class="empty-card">
			<p class="empty-message">No account found for <code class="handle-code">@{q}</code></p>
		</Card>
	{/if}

	{#if result}
		<div class="result-section">
			<div class="result-header">
				<h2 class="result-label">{result.label}</h2>
				<span class="result-handle t-mono">@{q}</span>
			</div>

			<div class="account-list">
				{#each result.accounts as acct}
				<div class="account-card {acct.is_frozen === 1 ? 'account-card--frozen' : ''}">
					<div class="account-info">
						<span class="account-name t-label">{acct.name}</span>
						<span class="account-balance t-balance" class:negative={acct.balance < 0} class:positive={acct.balance > 0}>
							{fmt(acct.balance)} ƒ
						</span>
					</div>
					{#if acct.is_frozen === 1}
					</div>
				{/each}
			</div>

			{#if recentTxs.length > 0}
				<Card class="transactions-card">
					<h3 class="transactions-title">Recent Transactions</h3>
					<div class="transactions-list">
						{#each recentTxs as tx}
							{@const primary = result.accounts.find(a => a.name === 'Primary') ?? result.accounts[0]}
							<div class="transaction-row">
								<span class="tx-date t-mono">{date(tx.created_at)}</span>
								<span class="tx-type">{tx.type}</span>
								<span class="tx-parties t-mono">
									@{tx.from_handle} → @{tx.to_handle}
								</span>
								<span class="tx-amount {tx.from_uuid === primary.uuid ? 'out' : 'in'}">
									{tx.from_uuid === primary.uuid ? '−' : '+'}{fmt(tx.amount)} ƒ
								</span>
								{#if tx.memo}
									<span class="tx-memo">{tx.memo}</span>
								{/if}
							</div>
						{/each}
					</div>
				</Card>
			{/if}
		</div>
	{/if}
</div>

<style>
	.page { 
		display: flex; 
		flex-direction: column; 
		gap: var(--space-6);
	}

	.lookup-form { 
		display: flex; 
		gap: var(--space-3); 
		max-width: 640px; 
		align-items: flex-end;
	}
	
	.lookup-field {
		flex: 1;
	}

	.empty-card { 
		padding: var(--space-6); 
		max-width: 520px; 
	}
	
	.empty-message { 
		margin: 0; 
		font-family: var(--font-serif);
		font-size: var(--text-md); 
		color: var(--ink-mid);
		line-height: 1.6;
	}
	
	.handle-code {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--copper);
		background: var(--copper-light);
		padding: 0.125rem var(--space-2);
		border-radius: var(--radius-sm);
	}

	.result-section { 
		display: flex; 
		flex-direction: column; 
		gap: var(--space-5);
	}
	
	.result-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	
	.result-label { 
		font-family: var(--font-sans);
		font-size: var(--text-xl); 
		font-weight: 600;
		color: var(--ink);
	}
	
	.result-handle {
		font-size: var(--text-sm);
		color: var(--copper);
	}

	/* Account cards */
	.account-list { 
		display: flex; 
		flex-direction: column; 
		gap: var(--space-3); 
		max-width: 520px; 
	}
	
	.account-card {
		display: flex; 
		align-items: center; 
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-5);
		background: var(--ledger); 
		border: 1.5px solid var(--border); 
		border-radius: var(--radius);
		transition: border-color 0.2s, box-shadow 0.2s;
	}
	
	.account-card:hover {
		border-color: var(--copper);
		box-shadow: 0 2px 6px rgba(139, 90, 60, 0.1);
	}
	
	.account-card--frozen { 
		border-color: var(--alert-red); 
		background: var(--alert-red-light);
	}
	
	.account-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.account-name {
		color: var(--ink-mid);
	}
	
	.account-balance { 
		font-size: var(--text-2xl);
		color: var(--ink);
	}
	
	.account-balance.negative { 
		color: var(--alert-red); 
	}
	
	.account-balance.positive {
		color: var(--olive);
	}
	
	.badge-frozen { 
		font-family: var(--font-sans);
		font-size: var(--text-xs); 
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.25rem var(--space-3); 
		border-radius: var(--radius); 
		background: var(--alert-red); 
		color: white;
	}

	/* Transactions card */
	.transactions-card {
		max-width: 800px;
	}
	
	.transactions-title {
		font-family: var(--font-sans);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--ink);
		margin-bottom: var(--space-4);
	}
	
	.transactions-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.transaction-row {
		display: grid;
		grid-template-columns: auto auto 1fr auto;
		gap: var(--space-4);
		align-items: center;
		padding: var(--space-3) var(--space-4);
		background: var(--ledger-lined);
		border: 1px solid var(--border-faint);
		border-radius: var(--radius-sm);
	}
	
	.tx-date {
		font-size: var(--text-xs);
		color: var(--ink-faint);
	}
	
	.tx-type {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.125rem var(--space-2);
		background: var(--copper-light);
		color: var(--copper);
		border-radius: var(--radius-sm);
	}
	
	.tx-parties {
		font-size: var(--text-sm);
		color: var(--ink-mid);
	}
	
	.tx-amount {
		font-family: var(--font-sans);
		font-size: var(--text-base);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
	
	.tx-amount.in { color: var(--olive); }
	.tx-amount.out { color: var(--ink); }
	
	.tx-memo {
		grid-column: 2 / -1;
		font-family: var(--font-serif);
		font-size: var(--text-sm);
		font-style: italic;
		color: var(--ink-mid);
		padding-left: var(--space-3);
		border-left: 2px solid var(--border-faint);
	}

	@media (max-width: 768px) {
		.transaction-row {
			grid-template-columns: 1fr;
			gap: var(--space-2);
		}
		
		.tx-memo {
			grid-column: 1;
			padding-left: 0;
			padding-top: var(--space-2);
			border-left: none;
			border-top: 2px solid var(--border-faint);
		}
	}
</style>
