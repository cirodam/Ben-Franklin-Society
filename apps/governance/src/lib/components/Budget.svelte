<script lang="ts">
	import { Card } from '@bfs/ui';

	interface Props {
		budgetTotal: number;
		roleCount: number;
		vacancyCount: number;
	}

	let { budgetTotal, roleCount, vacancyCount }: Props = $props();

	function formatCurrency(franks: number): string {
		return `ƒ${franks.toLocaleString()}`;
	}

	const filledRoles = $derived(roleCount - vacancyCount);
	const fillRate = $derived(roleCount > 0 ? (filledRoles / roleCount) * 100 : 0);
</script>

<Card class="budget">
	<div class="card-header">
		<h2>
			<span class="icon">💰</span>
			Budget Overview
		</h2>
	</div>

	<div class="budget-content">
		<div class="budget-metric primary">
			<div class="metric-label">Total Compensation</div>
			<div class="metric-value">{formatCurrency(budgetTotal)}</div>
			<div class="metric-note">Sum of all role compensation</div>
		</div>

		<div class="budget-grid">
			<div class="budget-metric">
				<div class="metric-label">Total Roles</div>
				<div class="metric-value">{roleCount}</div>
			</div>

			<div class="budget-metric">
				<div class="metric-label">Filled Positions</div>
				<div class="metric-value">{filledRoles}</div>
			</div>

			<div class="budget-metric">
				<div class="metric-label">Vacancies</div>
				<div class="metric-value">{vacancyCount}</div>
			</div>

			<div class="budget-metric">
				<div class="metric-label">Fill Rate</div>
				<div class="metric-value">{fillRate.toFixed(1)}%</div>
			</div>
		</div>

		{#if vacancyCount > 0}
			<div class="budget-alert">
				⚠️ {vacancyCount} vacant {vacancyCount === 1 ? 'position' : 'positions'} not included in active payroll
			</div>
		{/if}
	</div>
</Card>

<style>
	.budget {
		background: linear-gradient(135deg, var(--bg-gradient-start, #f5f7fa) 0%, var(--bg-gradient-end, #c3cfe2) 100%);
		border: 2px solid var(--color-primary, #0066cc);
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.card-header h2 {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.25rem;
	}

	.icon {
		font-size: 1.5rem;
	}

	.budget-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.budget-metric {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.budget-metric.primary {
		background: var(--bg-white, #fff);
		padding: 1.5rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border-color, #e0e0e0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.metric-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-secondary, #555);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.metric-value {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--color-primary, #0066cc);
		line-height: 1;
	}

	.primary .metric-value {
		font-size: 3rem;
	}

	.metric-note {
		font-size: 0.85rem;
		color: var(--text-muted, #666);
		font-style: italic;
	}

	.budget-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		background: var(--bg-white, #fff);
		padding: 1.5rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border-color, #e0e0e0);
	}

	.budget-grid .metric-value {
		font-size: 1.75rem;
		color: var(--text-primary, #000);
	}

	.budget-alert {
		padding: 1rem;
		background: var(--bg-warning-light, #fff8e1);
		border-left: 4px solid var(--color-warning, #ffc107);
		border-radius: 0.25rem;
		font-size: 0.95rem;
		color: var(--text-secondary, #555);
	}
</style>
