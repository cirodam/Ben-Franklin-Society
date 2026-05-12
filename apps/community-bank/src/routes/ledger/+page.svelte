<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { stats } = $derived(data);

	function fmt(n: number) { return n.toLocaleString(); }
</script>

<div class="page">
	<div class="page-header">
		<h1>Public Ledger</h1>
		<p class="subtitle">Aggregate statistics on the Frank economy. Available to all members.</p>
	</div>

	<div class="stat-grid">
		<div class="stat-card">
			<div class="stat-card__label">Total Money Supply</div>
			<div class="stat-card__value">{fmt(stats.money_supply)} ƒ</div>
			<div class="stat-card__note">Absolute value of the Central Bank account balance</div>
		</div>

		<div class="stat-card">
			<div class="stat-card__label">Total Accounts</div>
			<div class="stat-card__value">{fmt(stats.total_accounts)}</div>
		</div>

		<div class="stat-card">
			<div class="stat-card__label">Total Issuance (all time)</div>
			<div class="stat-card__value">{fmt(stats.total_issuance)} ƒ</div>
		</div>

		<div class="stat-card">
			<div class="stat-card__label">Total Demurrage Collected (all time)</div>
			<div class="stat-card__value">{fmt(stats.total_demurrage)} ƒ</div>
		</div>

		<div class="stat-card">
			<div class="stat-card__label">Accounts in Deficit</div>
			<div class="stat-card__value {stats.accounts_negative > 0 ? 'negative' : ''}">{fmt(stats.accounts_negative)}</div>
			<div class="stat-card__note">Accounts with a negative balance (demurrage does not apply)</div>
		</div>
	</div>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-6); }
	.page-header { display: flex; flex-direction: column; gap: var(--space-1); }
	.page-header h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }
	.subtitle { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); }

	.stat-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: var(--space-4);
	}

	.stat-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5) var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.stat-card__label {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
	}

	.stat-card__value {
		font-size: 1.75rem;
		font-weight: var(--weight-bold);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.01em;
	}
	.stat-card__value.negative { color: var(--color-danger); }

	.stat-card__note {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
</style>
