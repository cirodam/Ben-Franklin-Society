<script lang="ts">
	import { PageHeader, Card, Button, EmptyState } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { account, allAccounts, recentTransactions } = $derived(data);

	// Format cents as currency (e.g., 1254 -> "12.54")
	function fmtCurrency(cents: number): string {
		return (cents / 100).toFixed(2);
	}

	function date(s: string) {
		return s.slice(0, 16).replace('T', ' ');
	}

	function typeLabel(t: string) {
		return {
			transfer: 'Transfer',
			issuance: 'Issuance',
			demurrage: 'Demurrage',
			dues: 'Dues',
			payroll: 'Payroll',
			allowance: 'Allowance'
		}[t] ?? t;
	}
</script>

<div class="page">
	<div class="header-section">
		<a href="/" class="back-link">← All Accounts</a>
		<PageHeader title={account.name} />
	</div>

	<!-- Account Summary Card -->
	<Card class="summary-card {account.is_frozen === 1 ? 'summary-card--frozen' : ''}">
		<div class="summary-header">
			<div class="summary-label">Account Balances</div>
			{#if account.is_frozen === 1}
				<div class="status-badge frozen">Frozen</div>
			{:else}
				<div class="status-badge active">Active</div>
			{/if}
		</div>
		<div class="balances-container">
			<div class="balance-detail franks">
				<div class="balance-icon">🟢</div>
				<div class="balance-info">
					<div class="balance-label">Franks</div>
					<div class="balance-value t-balance" class:negative={account.franks_balance < 0} class:positive={account.franks_balance > 0}>
					{fmtCurrency(account.franks_balance)}
				</div>
			</div>
		</div>
		<div class="balance-detail florens">
			<div class="balance-icon">🟡</div>
			<div class="balance-info">
				<div class="balance-label">Florens</div>
				<div class="balance-value t-balance" class:negative={account.florens_balance < 0} class:positive={account.florens_balance > 0}>
					{fmtCurrency(account.florens_balance)}
					</div>
				</div>
			</div>
		</div>
		<div class="summary-meta">
			<span class="meta-item">{account.uuid.slice(0, 8)}</span>
		</div>
	</Card>

	<!-- Action Buttons -->
	{#if account.is_frozen === 0}
		<div class="action-buttons">
			<Button href="/send?from={account.uuid}">Send Franks</Button>
			{#if allAccounts.length > 1}
				<Button href="/transfer?from={account.uuid}" variant="secondary">Transfer Between Accounts</Button>
			{/if}
		</div>
	{/if}

	<!-- Recent Transactions -->
	<div class="transactions-section">
		<div class="section-header">
			<h2 class="section-title">Recent Transactions</h2>
			<a href="/history?account={account.uuid}" class="view-all-link">View All →</a>
		</div>

		{#if recentTransactions.length === 0}
			<Card>
				<EmptyState title="No transactions yet" />
			</Card>
		{:else}
			<div class="transaction-list">
				{#each recentTransactions as tx}
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
		{/if}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		max-width: 900px;
	}

	.header-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.back-link {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-accent);
		text-decoration: none;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: var(--color-accent-hover);
		text-decoration: underline;
	}

	/* Summary Card */
	:global(.summary-card) {
		padding: var(--space-5);
		background: var(--parchment);
	}

	.summary-card--frozen :global(.card) {
		border-color: var(--color-danger);
		background: var(--color-danger-subtle);
	}

	.summary-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-2);
	}

	.summary-label {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text-subtle);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-badge {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.25rem var(--space-3);
		border-radius: var(--radius);
	}

	.status-badge.active {
		background: var(--olive);
		color: white;
	}

	.status-badge.frozen {
		background: var(--color-danger);
		color: white;
	}

	.balances-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.balance-detail {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: var(--radius);
	}

	.balance-detail.franks {
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.balance-detail.florens {
		background: rgba(234, 179, 8, 0.1);
		border: 1px solid rgba(234, 179, 8, 0.3);
	}

	.balance-icon {
		font-size: 2rem;
		line-height: 1;
	}

	.balance-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.balance-label {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--color-text-subtle);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.balance-value {
		font-size: var(--text-2xl);
		font-weight: 600;
		color: var(--ink);
	}

	.balance-value.negative {
		color: var(--color-danger);
	}

	.balance-value.positive {
		color: var(--olive);
	}

	.summary-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--color-text-subtle);
	}

	.meta-item {
		color: var(--color-text);
	}

	.meta-separator {
		color: var(--color-text-subtle);
	}

	/* Action Buttons */
	.action-buttons {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	/* Transactions Section */
	.transactions-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-title {
		margin: 0;
		font-family: var(--font-sans);
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--ink);
	}

	.view-all-link {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-accent);
		text-decoration: none;
		transition: color 0.2s;
	}

	.view-all-link:hover {
		color: var(--color-accent-hover);
		text-decoration: underline;
	}

	/* Transaction List */
	.transaction-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.transaction-item {
		background: var(--parchment);
		border: 2px solid var(--border);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.transaction-item:hover {
		border-color: var(--copper);
		box-shadow: 0 2px 8px rgba(139, 90, 60, 0.1);
	}

	.transaction-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-2);
	}

	.transaction-date {
		font-size: var(--text-sm);
		color: var(--color-text-subtle);
	}

	.transaction-type {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem var(--space-2);
		border-radius: var(--radius-sm);
	}

	.type-badge--transfer { background: var(--copper); color: white; }
	.type-badge--issuance { background: var(--olive); color: white; }
	.type-badge--demurrage { background: var(--rust); color: white; }
	.type-badge--dues { background: var(--slate); color: white; }
	.type-badge--payroll { background: var(--sage); color: white; }
	.type-badge--allowance { background: var(--sage); color: white; }

	.transaction-flow {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
	}

	.transaction-party {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.party-label {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--color-text-subtle);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.party-handle {
		font-size: var(--text-sm);
		color: var(--ink);
	}

	.party-name {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--color-text-subtle);
	}

	.transaction-arrow {
		font-size: var(--text-xl);
		color: var(--color-text-subtle);
		flex-shrink: 0;
	}

	.transaction-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--space-2);
		border-top: 1px solid var(--border);
	}

	.transaction-amount {
		font-family: var(--font-mono);
		font-size: var(--text-lg);
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.transaction-amount.in {
		color: var(--olive);
	}

	.transaction-amount.out {
		color: var(--rust);
	}

	.currency-badge {
		font-size: var(--text-base);
		line-height: 1;
	}

	.transaction-memo {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--color-text-subtle);
		font-style: italic;
		max-width: 50%;
		text-align: right;
	}
</style>
