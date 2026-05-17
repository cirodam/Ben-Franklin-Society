<script lang="ts">
	import { enhance } from '$app/forms';
	import { AccountFinder, Alert, Button, Card, Input, PageHeader, Select } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { transfers } = $derived(data);

	// Form state
	let showCreateForm = $state(false);
	let transferMode = $state<'flat' | 'percentage'>('flat');
	let targetFilter = $state<string>('specific');
	let fromAccount = $state<any | null>(null);
	let toAccount = $state<any | null>(null);

	function fmt(n: number) { return (n / 100).toFixed(2); }
	function date(s: string) { return s.slice(0, 10); }

	const statusOrder = ['active', 'pending_authorization', 'paused', 'cancelled'];
	const sorted = $derived([...transfers].sort((a, b) => {
		const ia = statusOrder.indexOf(a.status);
		const ib = statusOrder.indexOf(b.status);
		return ia !== ib ? ia - ib : a.name.localeCompare(b.name);
	}));

	// Success handling
	$effect(() => {
		if (form?.success && form?.created) {
			showCreateForm = false;
			fromAccount = null;
			toAccount = null;
		}
	});
</script>

<div class="page">
	<div class="page-header">
		<PageHeader title="Grouped Transfers">
			<p class="subtitle">
				Create recurring transfers with flexible targeting (single account, all accounts, percentage-based, etc.)
			</p>
		</PageHeader>
		<Button onclick={() => showCreateForm = !showCreateForm} variant="primary">
			{showCreateForm ? 'Cancel' : '+ Create Transfer'}
		</Button>
	</div>

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}
	{#if form?.success && !form?.created}
		<Alert variant="success">Transfer updated.</Alert>
	{/if}
	{#if form?.success && form?.created}
		<Alert variant="success">Grouped transfer created successfully!</Alert>
	{/if}

	{#if showCreateForm}
		<Card class="form-card">
			<h2>Create Grouped Transfer</h2>
			
			<form method="POST" action="?/create" use:enhance>
				<!-- Transfer Name -->
				<div class="form-field">
					<label for="name">Transfer Name*</label>
					<input
						type="text"
						id="name"
						name="name"
						required
						placeholder="e.g., Monthly Demurrage Collection"
					/>
				</div>

				<!-- Transfer Mode -->
				<div class="form-field">
					<label>Transfer Mode*</label>
					<div class="radio-group">
						<label class="radio-label">
							<input
								type="radio"
								name="transfer_mode"
								value="flat"
								checked={transferMode === 'flat'}
								onchange={() => { transferMode = 'flat'; targetFilter = 'specific'; }}
							/>
							Flat amount from specific account
						</label>
						<label class="radio-label">
							<input
								type="radio"
								name="transfer_mode"
								value="percentage"
								checked={transferMode === 'percentage'}
								onchange={() => { transferMode = 'percentage'; targetFilter = 'all'; }}
							/>
							Percentage from multiple accounts
						</label>
					</div>
				</div>

				{#if transferMode === 'flat'}
					<!-- Flat Mode: From Account + Amount -->
					<div class="form-field">
						<label>From Account*</label>
						{#if fromAccount}
							<div class="selected-account">
								<div>
									<strong>{fromAccount.handle_cache}</strong> — {fromAccount.name}
									<span class="badge badge--{fromAccount.account_type}">{fromAccount.account_type}</span>
								</div>
								<button type="button" class="btn-sm" onclick={() => fromAccount = null}>Change</button>
							</div>
							<input type="hidden" name="from_uuid" value={fromAccount.uuid} />
						{:else}
							<AccountFinder onselect={(acc) => fromAccount = acc} showFilters={true} />
						{/if}
					</div>

					<div class="form-field">
						<label for="amount">Amount (ƒ)*</label>
						<input
							type="number"
							id="amount"
							name="amount"
							required
							min="0.01"
							step="0.01"
							placeholder="100.00"
						/>
					</div>
					
					<input type="hidden" name="target_filter" value="specific" />
				{:else}
					<!-- Percentage Mode: Target Filter + Rate -->
					<div class="form-field">
						<label>Target Accounts*</label>
						<div class="radio-group">
							<label class="radio-label">
								<input
									type="radio"
									name="target_filter"
									value="all"
									checked={targetFilter === 'all'}
									onchange={() => targetFilter = 'all'}
								/>
								All accounts
							</label>
							<label class="radio-label">
								<input
									type="radio"
									name="target_filter"
									value="all_standard"
									checked={targetFilter === 'all_standard'}
									onchange={() => targetFilter = 'all_standard'}
								/>
								All standard accounts (exclude official/system)
							</label>
							<label class="radio-label">
								<input
									type="radio"
									name="target_filter"
									value="all_above_threshold"
									checked={targetFilter === 'all_above_threshold'}
									onchange={() => targetFilter = 'all_above_threshold'}
								/>
								All accounts above balance threshold
							</label>
						</div>
					</div>

					<div class="form-field">
						<label for="rate_percentage">Rate (%)*</label>
						<input
							type="number"
							id="rate_percentage"
							name="rate_percentage"
							required
							min="0.001"
							max="100"
							step="0.001"
							placeholder="0.5"
						/>
						<p class="hint">Example: 0.5 means 0.5% of each account's balance</p>
					</div>

					{#if targetFilter === 'all_above_threshold'}
						<div class="form-field">
							<label for="threshold">Balance Threshold (ƒ)*</label>
							<input
								type="number"
								id="threshold"
								name="threshold"
								required
								min="0"
								step="0.01"
								placeholder="10000.00"
							/>
							<p class="hint">Only charge accounts with balance above this amount</p>
						</div>
					{/if}
				{/if}

				<!-- To Account (always required) -->
				<div class="form-field">
					<label>Send To*</label>
					{#if toAccount}
						<div class="selected-account">
							<div>
								<strong>{toAccount.handle_cache}</strong> — {toAccount.name}
								<span class="badge badge--{toAccount.account_type}">{toAccount.account_type}</span>
							</div>
							<button type="button" class="btn-sm" onclick={() => toAccount = null}>Change</button>
						</div>
						<input type="hidden" name="to_uuid" value={toAccount.uuid} />
					{:else}
						<AccountFinder onselect={(acc) => toAccount = acc} showFilters={true} />
					{/if}
				</div>

				<!-- Schedule -->
				<Select name="schedule" label="Schedule" required>
					<option value="monthly">Monthly</option>
					<option value="weekly">Weekly</option>
					<option value="daily">Daily</option>
				</Select>

				<!-- Type -->
				<Input
					name="type"
					type="text"
					label="Transaction Type"
					value="transfer"
					placeholder="transfer"
					hint="Optional: demurrage, collection, fee, etc."
				/>

				<div class="form-actions">
<Button type="submit" variant="primary">Create Grouped Transfer</Button>
				<Button type="button" variant="secondary" onclick={() => showCreateForm = false}>Cancel</Button>
			</div>
		</form>
	</Card>
	{/if}

	<!-- Transfers List -->
	{#if transfers.length === 0}
		<Card>
			<p class="empty">No grouped transfers configured. Create one above to get started.</p>
		</Card>
	{:else}
		<Card class="table-card">\n\t\t\t<table class="table">
				<thead>
					<tr>
						<th>Name</th>
						<th>Mode</th>
						<th>From</th>
						<th>To</th>
						<th class="num">Amount/Rate</th>
						<th>Type</th>
						<th>Schedule</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each sorted as t}
						<tr class="row--{t.status}">
							<td><strong>{t.name}</strong></td>
							<td>
								<span class="badge badge--mode-{t.transfer_mode}">{t.transfer_mode}</span>
								{#if t.transfer_mode === 'percentage'}
									<br /><span class="text-muted">{t.target_filter}</span>
								{/if}
							</td>
							<td class="mono">
								{#if t.from_handle}
									@{t.from_handle}<br /><span class="acct-name">{t.from_name}</span>
								{:else}
									<span class="text-muted">(dynamic)</span>
								{/if}
							</td>
							<td class="mono">@{t.to_handle}<br /><span class="acct-name">{t.to_name}</span></td>
							<td class="num">
								{#if t.amount !== null}
									ƒ{fmt(t.amount)}
								{:else if t.rate_percentage !== null}
									{(t.rate_percentage * 100).toFixed(3)}%
									{#if t.threshold}
										<br /><span class="text-muted">(>{fmt(t.threshold)})</span>
									{/if}
								{/if}
							</td>
							<td>{t.type}</td>
							<td class="mono">{t.schedule}</td>
							<td><span class="badge badge--{t.status}">{t.status}</span></td>
							<td class="actions-cell">
								{#if t.status === 'active'}
									<form method="POST" action="?/pause" use:enhance>
										<input type="hidden" name="uuid" value={t.uuid} />
										<button type="submit" class="btn-sm btn-sm--warn">Pause</button>
									</form>
									<form method="POST" action="?/cancel" use:enhance>
										<input type="hidden" name="uuid" value={t.uuid} />
										<button type="submit" class="btn-sm btn-sm--danger">Cancel</button>
									</form>
								{:else if t.status === 'paused'}
									<form method="POST" action="?/unpause" use:enhance>
										<input type="hidden" name="uuid" value={t.uuid} />
										<button type="submit" class="btn-sm btn-sm--primary">Resume</button>
									</form>
									<form method="POST" action="?/cancel" use:enhance>
										<input type="hidden" name="uuid" value={t.uuid} />
										<button type="submit" class="btn-sm btn-sm--danger">Cancel</button>
									</form>
								{:else if t.status === 'pending_authorization'}
									<span class="text-muted">Pending approval</span>
								{:else}
									<span class="cancelled-note">Cancelled</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</Card>
	{/if}
</div>

<style>
	h2 { margin: 0 0 var(--space-4); font-size: var(--text-lg); font-weight: var(--weight-semibold); }
	
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}
	
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: var(--space-4);
	}
	
	.subtitle {
		margin: var(--space-1) 0 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	:global(.form-card) {
		padding: var(--space-5);
	}
	
	:global(.table-card) {
		overflow-x: auto;
	}

	/* Form styles */
	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}
	
	.form-field label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}
	
	.form-field input[type="text"],
	.form-field input[type="number"],
	.form-field select {
		width: 100%;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--color-text);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-2) var(--space-3);
		transition: border-color 120ms;
		outline: none;
	}
	
	.form-field input:focus,
	.form-field select:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px var(--color-accent-subtle);
	}
	
	.radio-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.radio-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-weight: normal;
		cursor: pointer;
	}
	
	.hint {
		margin: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
	
	.selected-account {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-3);
		background: var(--color-accent-subtle);
		border: 1px solid var(--color-accent);
		border-radius: var(--radius);
	}
	
	.form-actions {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-5);
	}

	/* Table styles */
	.table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}
	
	.table th {
		text-align: left;
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
		padding: var(--space-3);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-bg);
	}
	
	.table td {
		padding: var(--space-3);
		border-bottom: 1px solid var(--color-border);
	}
	
	.table .num {
		text-align: right;
	}
	
	.mono {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}
	
	.acct-name {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	
	.text-muted {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	
	.actions-cell {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	/* Button styles */
	.btn-sm {
		font-family: var(--font-sans);
		font-weight: var(--weight-medium);
		border-radius: var(--radius);
		border: 1px solid transparent;
		cursor: pointer;
		transition: background 120ms, color 120ms, border-color 120ms;
		font-size: var(--text-xs);
		padding: 3px var(--space-2);
		background: var(--color-surface);
		border-color: var(--color-border);
		color: var(--color-text);
	}
	
	.btn-sm--primary {
		background: var(--color-accent);
		color: #fff;
		border-color: var(--color-accent);
	}
	
	.btn-sm--warn {
		background: var(--color-warning-subtle, #fef3c7);
		color: var(--color-warning, #f59e0b);
		border-color: var(--color-warning, #f59e0b);
	}
	
	.btn-sm--danger {
		background: var(--color-danger-subtle);
		color: var(--color-danger);
		border-color: var(--color-danger);
	}

	/* Badge styles */
	.badge {
		display: inline-block;
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		padding: 2px var(--space-2);
		border-radius: var(--radius);
		text-transform: uppercase;
	}
	
	.badge--standard {
		background: var(--color-surface);
		color: var(--color-text-muted);
	}
	
	.badge--official {
		background: var(--color-accent-subtle);
		color: var(--color-accent);
	}
	
	.badge--system {
		background: var(--color-danger-subtle);
		color: var(--color-danger);
	}
	
	.badge--mode-flat {
		background: #dbeafe;
		color: #1e40af;
	}
	
	.badge--mode-percentage {
		background: #fef3c7;
		color: #f59e0b;
	}
	
	.badge--active {
		background: var(--color-success-subtle);
		color: var(--color-success);
	}
	
	.badge--paused {
		background: var(--color-warning-subtle, #fef3c7);
		color: var(--color-warning, #f59e0b);
	}
	
	.badge--pending_authorization {
		background: #e0e7ff;
		color: #4f46e5;
	}
	
	.badge--cancelled {
		background: var(--color-surface);
		color: var(--color-text-muted);
	}
	
	.empty {
		text-align: center;
		padding: var(--space-5);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	
	.cancelled-note {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
	
	.row--cancelled {
		opacity: 0.6;
	}
</style>
