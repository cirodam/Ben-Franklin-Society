<script lang="ts">
	import { PageHeader, Card, Button, Input, Badge } from '@bfs/ui';
	import ContextBadge from '$lib/components/ContextBadge.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { config, recentOperations, session } = $derived(data);

	function fmt(n: number) { return n.toLocaleString(); }
	function fmtDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Configuration state
	let rateAnnual = $state(config?.rate_annual_percent?.toString() ?? '5.0');
	let destinationUuid = $state(config?.destination_account_uuid ?? '');
	let enabled = $state(config?.enabled ?? false);
	let isUpdatingConfig = $state(false);
	let configError = $state('');

	// Collection state
	let collectionNotes = $state('');
	let isCollecting = $state(false);
	let collectionError = $state('');
	let collectionSuccess = $state('');

	async function updateConfig() {
		isUpdatingConfig = true;
		configError = '';

		try {
			const res = await fetch('/api/demurrage/config', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					rate_annual_percent: Number(rateAnnual),
					destination_account_uuid: destinationUuid,
					enabled
				})
			});

			if (!res.ok) {
				const error = await res.json();
				configError = error.error || 'Failed to update configuration';
				isUpdatingConfig = false;
				return;
			}

			window.location.reload();
		} catch (err) {
			configError = 'Network error';
			isUpdatingConfig = false;
		}
	}

	async function collectDemurrage() {
		if (!config?.enabled) {
			collectionError = 'Demurrage is not enabled';
			return;
		}

		isCollecting = true;
		collectionError = '';
		collectionSuccess = '';

		try {
			const res = await fetch('/api/demurrage/collect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					notes: collectionNotes.trim() || undefined
				})
			});

			if (!res.ok) {
				const error = await res.json();
				collectionError = error.error || 'Failed to collect demurrage';
				isCollecting = false;
				return;
			}

			const result = await res.json();
			collectionSuccess = `Collected ƒ ${fmt(result.summary.total_collected)} from ${result.summary.accounts_charged} accounts`;
			
			// Reload page to show updated data
			setTimeout(() => window.location.reload(), 2000);
		} catch (err) {
			collectionError = 'Network error';
			isCollecting = false;
		}
	}
</script>

<div class="page">
	<div class="page-header-with-badge">
		<PageHeader title="Demurrage Management" />
		{#if session}
			<ContextBadge 
				actingAsUuid={session.acting_as_uuid}
				personUuid={session.person_uuid}
				isAdmin={true}
			/>
		{/if}
	</div>

	<!-- Configuration Panel -->
	<Card class="config-card">
		<div class="card__label">Demurrage Configuration</div>
		
		<div class="config-form">
			<div class="form-group">
				<label for="rate">Annual Rate (%)</label>
				<Input
					id="rate"
					type="number"
					step="0.1"
					min="0"
					bind:value={rateAnnual}
					disabled={isUpdatingConfig}
				/>
				<div class="form-hint">
					Percentage of balance charged per year (e.g., 5.0 for 5%)
				</div>
			</div>

			<div class="form-group">
				<label for="destination">Destination Account UUID</label>
				<Input
					id="destination"
					type="text"
					placeholder="Account UUID where demurrage is collected"
					bind:value={destinationUuid}
					disabled={isUpdatingConfig}
				/>
			</div>

			<div class="form-group">
				<label>
					<input
						type="checkbox"
						bind:checked={enabled}
						disabled={isUpdatingConfig}
					/>
					Enable demurrage collection
				</label>
			</div>

			{#if configError}
				<div class="error-message">{configError}</div>
			{/if}

			<Button
				onclick={updateConfig}
				disabled={isUpdatingConfig}
				variant="primary"
			>
				{isUpdatingConfig ? 'Updating...' : 'Update Configuration'}
			</Button>
		</div>
	</Card>

	<!-- Current Status -->
	{#if config}
		<Card class="status-card">
			<div class="card__label">Current Status</div>
			<div class="status-grid">
				<div class="status-item">
					<div class="status-label">Status</div>
					<div class="status-value">
						{#if config.enabled}
							<Badge variant="success">Enabled</Badge>
						{:else}
							<Badge variant="secondary">Disabled</Badge>
						{/if}
					</div>
				</div>
				<div class="status-item">
					<div class="status-label">Annual Rate</div>
					<div class="status-value">{config.rate_annual_percent}%</div>
				</div>
				<div class="status-item">
					<div class="status-label">Daily Rate</div>
					<div class="status-value">
						{(config.rate_annual_percent / 365).toFixed(4)}%
					</div>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Collection Panel -->
	<Card class="collection-card">
		<div class="card__label">Collect Demurrage</div>
		
		<div class="collection-form">
			<div class="form-group">
				<label for="notes">Notes (optional)</label>
				<Input
					id="notes"
					type="text"
					placeholder="Reason for collection or notes"
					bind:value={collectionNotes}
					disabled={isCollecting || !config?.enabled}
				/>
			</div>

			{#if collectionError}
				<div class="error-message">{collectionError}</div>
			{/if}

			{#if collectionSuccess}
				<div class="success-message">{collectionSuccess}</div>
			{/if}

			<Button
				onclick={collectDemurrage}
				disabled={isCollecting || !config?.enabled}
				variant="primary"
			>
				{isCollecting ? 'Collecting...' : 'Collect Demurrage Now'}
			</Button>

			{#if !config?.enabled}
				<div class="form-hint">
					Demurrage must be enabled to collect
				</div>
			{/if}
		</div>
	</Card>

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
						<th class="num">Accounts Charged</th>
						<th class="num">Total Collected</th>
						<th>Notes</th>
						<th>Performed At</th>
					</tr>
				</thead>
				<tbody>
					{#each recentOperations as op}
						<tr>
							<td>{op.collection_date}</td>
							<td class="num">{op.accounts_charged}</td>
							<td class="num">ƒ {fmt(op.total_collected)}</td>
							<td>{op.notes || '—'}</td>
							<td>{fmtDate(op.performed_at)}</td>
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

	.config-card,
	.status-card,
	.collection-card,
	.table-card {
		margin-bottom: 2rem;
	}

	.config-form,
	.collection-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.form-hint {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
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
		font-size: 1.25rem;
		font-weight: 600;
	}

	.error-message {
		padding: 1rem;
		background: var(--color-danger-background);
		color: var(--color-danger);
		border-radius: 6px;
		border: 1px solid var(--color-danger);
	}

	.success-message {
		padding: 1rem;
		background: var(--color-success-background);
		color: var(--color-success);
		border-radius: 6px;
		border: 1px solid var(--color-success);
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
