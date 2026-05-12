<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { accounts } = $derived(data);

	function fmt(n: number) {
		return n.toLocaleString();
	}
</script>

<div class="page">
	<div class="page-header">
		<h1>My Account</h1>
	</div>

	<div class="account-grid">
		{#each accounts as acct}
			<div class="card account-card {acct.status === 'frozen' ? 'account-card--frozen' : ''}">
				<div class="account-card__name">{acct.name}</div>
				<div class="account-card__balance" class:negative={acct.balance < 0}>
					{fmt(acct.balance)} ƒ
				</div>
				{#if acct.status === 'frozen'}
					<div class="account-card__badge frozen">Frozen</div>
				{/if}
				<div class="account-card__actions">
					<a href="/history?account={acct.uuid}" class="btn-inline">History</a>
					{#if acct.status === 'active'}
						<a href="/send?from={acct.uuid}" class="btn-inline">Send</a>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.page-header h1 {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
	}

	.account-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 480px;
	}

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5) var(--space-6);
	}

	.account-card--frozen {
		border-color: var(--color-warn);
		opacity: 0.8;
	}

	.account-card__name {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: var(--space-2);
	}

	.account-card__balance {
		font-size: 2.25rem;
		font-weight: var(--weight-bold);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.01em;
	}
	.account-card__balance.negative {
		color: var(--color-danger);
	}

	.account-card__badge {
		display: inline-block;
		margin-top: var(--space-2);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 2px var(--space-2);
		border-radius: var(--radius);
	}
	.account-card__badge.frozen {
		background: var(--color-warn-subtle);
		color: var(--color-warn);
	}

	.account-card__actions {
		margin-top: var(--space-4);
		display: flex;
		gap: var(--space-3);
	}

	.btn-inline {
		font-size: var(--text-sm);
		color: var(--color-accent);
		text-decoration: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}
	.btn-inline:hover { text-decoration: underline; }
</style>
