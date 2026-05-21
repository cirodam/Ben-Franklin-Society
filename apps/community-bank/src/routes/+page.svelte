<script lang="ts">
	import { Card, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { accounts } = $derived(data);

	function fmt(n: number) {
		return n.toLocaleString();
	}
</script>

<div class="page">
	<PageHeader title="My Account" />

	<div class="account-grid">
		{#each accounts as acct}
			<Card class="account-card {acct.status === 'frozen' ? 'account-card--frozen' : ''}">
				<div class="account-card__name t-label">{acct.name}</div>
				<div class="account-card__balance t-balance" class:negative={acct.balance < 0} class:positive={acct.balance > 0}>
					{fmt(acct.balance)} ƒ
				</div>
				{#if acct.status === 'frozen'}
					<div class="account-card__badge frozen">Frozen</div>
				{/if}
				<div class="account-card__actions">
					<a href="/history?account={acct.uuid}" class="btn-inline">View History</a>
					{#if acct.status === 'active'}
						<span class="separator">·</span>
						<a href="/send?from={acct.uuid}" class="btn-inline">Send Franks</a>
					{/if}
				</div>
			</Card>
		{/each}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.account-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 520px;
	}

	:global(.account-card) {
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	:global(.account-card:hover) {
		border-color: var(--copper);
		box-shadow: 0 2px 8px rgba(139, 90, 60, 0.1);
	}

	.account-card--frozen :global(.card) {
		border-color: var(--color-danger);
		background: var(--color-danger-subtle);
	}

	.account-card__name {
		margin-bottom: var(--space-2);
	}

	.account-card__balance {
		font-size: var(--text-3xl);
		margin-bottom: var(--space-3);
		color: var(--ink);
	}
	
	.account-card__balance.negative {
		color: var(--color-danger);
	}
	
	.account-card__balance.positive {
		color: var(--olive);
	}

	.account-card__badge {
		display: inline-block;
		margin-top: var(--space-2);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.25rem var(--space-3);
		border-radius: var(--radius);
	}
	
	.account-card__badge.frozen {
		background: var(--color-danger);
		color: white;
		border: 1.5px solid var(--color-danger);
	}

	.account-card__actions {
		margin-top: var(--space-5);
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.separator {
		color: var(--color-text-subtle);
		user-select: none;
	}

	.btn-inline {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-accent);
		text-decoration: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: color 0.2s;
	}
	
	.btn-inline:hover {
		color: var(--color-accent-hover);
		text-decoration: underline;
	}
</style>
