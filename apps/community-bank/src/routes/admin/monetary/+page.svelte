<script lang="ts">
	import { PageHeader, Card, Button, Input, Badge } from '@bfs/ui';
	import ContextBadge from '$lib/components/ContextBadge.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { status, recentOperations, session } = $derived(data);

	function fmt(n: number) { return n.toLocaleString(); }
	function fmtPercent(n: number) { return n.toFixed(2) + '%'; }
	function fmtDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// State for mint/burn forms
	let mintAmount = $state('');
	let mintReason = $state('');
	let burnAmount = $state('');
	let burnReason = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');

	async function handleMint() {
		const amount = Number(mintAmount);
		if (isNaN(amount) || amount <= 0) {
			errorMessage = 'Please enter a valid amount';
			return;
		}
		if (!mintReason.trim()) {
			errorMessage = 'Please enter a reason';
			return;
		}

		isSubmitting = true;
		errorMessage = '';

		try {
			const res = await fetch('/api/monetary/mint', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount, reason: mintReason })
			});

			if (!res.ok) {
				const error = await res.json();
				errorMessage = error.error || 'Failed to mint franks';
				isSubmitting = false;
				return;
			}

			// Reload page to show updated data
			window.location.reload();
		} catch (err) {
			errorMessage = 'Network error';
			isSubmitting = false;
		}
	}

	async function handleBurn() {
		const amount = Number(burnAmount);
		if (isNaN(amount) || amount <= 0) {
			errorMessage = 'Please enter a valid amount';
			return;
		}
		if (!burnReason.trim()) {
			errorMessage = 'Please enter a reason';
			return;
		}

		isSubmitting = true;
		errorMessage = '';

		try {
			const res = await fetch('/api/monetary/burn', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount, reason: burnReason })
			});

			if (!res.ok) {
				const error = await res.json();
				errorMessage = error.error || 'Failed to burn franks';
				isSubmitting = false;
				return;
			}

			// Reload page to show updated data
			window.location.reload();
		} catch (err) {
			errorMessage = 'Network error';
			isSubmitting = false;
		}
	}
</script>

<div class="page">
	<div class="page-header-with-badge">
		<PageHeader title="Monetary Policy" />
		{#if session}
			<ContextBadge 
				actingAsUuid={session.acting_as_uuid}
				personUuid={session.person_uuid}
				isAdmin={true}
			/>
		{/if}
	</div>

	<!-- Status Dashboard -->
	<Card class="status-dashboard">
		<div class="card__label">Monetary Status</div>
		<div class="status-grid">
			<div class="status-item">
				<div class="status-label">Active Members</div>
				<div class="status-value">{fmt(status.member_count)}</div>
			</div>
			<div class="status-item">
				<div class="status-label">Total Person-Years</div>
				<div class="status-value">{fmt(status.person_years)}</div>
			</div>
			<div class="status-item">
				<div class="status-label">Policy Target (Minted)</div>
				<div class="status-value">ƒ {fmt(status.expected_minted_supply)}</div>
				<div class="status-note">
					{fmt(status.policy.franks_per_person_year)} ƒ per person-year
				</div>
			</div>
			<div class="status-item">
				<div class="status-label">Actual Minted Supply</div>
				<div class="status-value">ƒ {fmt(status.minted_supply)}</div>
			</div>
			<div class="status-item">
				<div class="status-label">Minted Variance</div>
				<div class="status-value" class:negative={status.minted_variance < 0} class:positive={status.minted_variance > 0}>
					{status.minted_variance >= 0 ? '+' : ''}{fmt(status.minted_variance)} ƒ
					<span class="variance-percent">
						({status.minted_variance_percent >= 0 ? '+' : ''}{fmtPercent(status.minted_variance_percent)})
					</span>
				</div>
			</div>
			<div class="status-item">
				<div class="status-label">Status</div>
				<div class="status-value">
					{#if status.in_tolerance}
						<Badge variant="success">Within Tolerance</Badge>
					{:else}
						<Badge variant="warning">Out of Tolerance</Badge>
					{/if}
				</div>
				<div class="status-note">
					Tolerance: ±{status.policy.tolerance_percent}%
				</div>
			</div>
		</div>

		<div class="supply-breakdown">
			<h3>Supply Breakdown</h3>
			<div class="supply-grid">
				<div class="supply-item">
					<div class="supply-label">Minted Supply</div>
					<div class="supply-value">ƒ {fmt(status.minted_supply)}</div>
					<div class="supply-note">Created by this society</div>
				</div>
				<div class="supply-item">
					<div class="supply-label">External Supply</div>
					<div class="supply-value">ƒ {fmt(status.external_supply)}</div>
					<div class="supply-note">Received from other societies</div>
				</div>
				<div class="supply-item">
					<div class="supply-label">Total Supply</div>
					<div class="supply-value">ƒ {fmt(status.total_supply)}</div>
					<div class="supply-note">All franks in circulation</div>
				</div>
			</div>
		</div>
	</Card>

	<!-- Operations Panel -->
	<div class="operations-row">
		<Card class="operation-card">
			<div class="card__label">Mint Franks</div>
			<form class="operation-form" onsubmit={(e) => { e.preventDefault(); handleMint(); }}>
				<Input
					type="number"
					placeholder="Amount"
					bind:value={mintAmount}
					disabled={isSubmitting}
					required
				/>
				<Input
					type="text"
					placeholder="Reason for minting"
					bind:value={mintReason}
					disabled={isSubmitting}
					required
				/>
				<Button type="submit" variant="primary" disabled={isSubmitting}>
					{isSubmitting ? 'Minting...' : 'Mint Franks'}
				</Button>
			</form>
		</Card>

		<Card class="operation-card">
			<div class="card__label">Burn Franks</div>
			<form class="operation-form" onsubmit={(e) => { e.preventDefault(); handleBurn(); }}>
				<Input
					type="number"
					placeholder="Amount"
					bind:value={burnAmount}
					disabled={isSubmitting}
					required
				/>
				<Input
					type="text"
					placeholder="Reason for burning"
					bind:value={burnReason}
					disabled={isSubmitting}
					required
				/>
				<Button type="submit" variant="danger" disabled={isSubmitting}>
					{isSubmitting ? 'Burning...' : 'Burn Franks'}
				</Button>
			</form>
		</Card>
	</div>

	{#if errorMessage}
		<div class="error-message">{errorMessage}</div>
	{/if}

	<!-- Recent Operations -->
	<Card class="table-card">
		<div class="card__label">Recent Operations</div>
		{#if recentOperations.length === 0}
			<p class="empty-state">No operations yet</p>
		{:else}
			<table class="table">
				<thead>
					<tr>
						<th>Date</th>
						<th>Type</th>
						<th class="num">Amount</th>
						<th>Reason</th>
						<th class="num">Minted Supply After</th>
						<th class="num">Total Supply After</th>
					</tr>
				</thead>
				<tbody>
					{#each recentOperations as op}
						<tr>
							<td>{fmtDate(op.performed_at)}</td>
							<td>
								{#if op.type === 'mint'}
									<Badge variant="success">Mint</Badge>
								{:else}
									<Badge variant="danger">Burn</Badge>
								{/if}
							</td>
							<td class="num">ƒ {fmt(op.amount)}</td>
							<td>{op.reason}</td>
							<td class="num">ƒ {fmt(op.minted_supply_after)}</td>
							<td class="num">ƒ {fmt(op.total_supply_after)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</Card>
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-header-with-badge {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.status-dashboard {
		margin-bottom: 2rem;
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.status-item {
		padding: 1rem;
		border-left: 3px solid var(--color-border);
	}

	.status-label {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin-bottom: 0.5rem;
	}

	.status-value {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.status-value.negative {
		color: var(--color-danger);
	}

	.status-value.positive {
		color: var(--color-success);
	}

	.variance-percent {
		font-size: 1rem;
		opacity: 0.8;
	}

	.status-note {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
	}

	.supply-breakdown {
		border-top: 1px solid var(--color-border);
		padding-top: 1.5rem;
		margin-top: 1.5rem;
	}

	.supply-breakdown h3 {
		font-size: 1rem;
		margin-bottom: 1rem;
		color: var(--color-text-secondary);
	}

	.supply-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.supply-item {
		padding: 1rem;
		background: var(--color-background-secondary);
		border-radius: 6px;
	}

	.supply-label {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin-bottom: 0.5rem;
	}

	.supply-value {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.supply-note {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
	}

	.operations-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.operation-card {
	}

	.operation-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.error-message {
		padding: 1rem;
		margin-bottom: 1rem;
		background: var(--color-danger-background);
		color: var(--color-danger);
		border-radius: 6px;
		border: 1px solid var(--color-danger);
	}

	.table-card {
		margin-bottom: 2rem;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-secondary);
	}

	.table {
		width: 100%;
		border-collapse: collapse;
	}

	.table th,
	.table td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	.table th {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.table th.num,
	.table td.num {
		text-align: right;
	}

	.table tbody tr:hover {
		background: var(--color-background-secondary);
	}
</style>
