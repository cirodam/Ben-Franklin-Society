<script lang="ts">
	import { enhance } from '$app/forms';
	import { AccountFinder } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { cbAccount, treasuryAccount, stats, recentIssuances, recentDestructions } = $derived(data);

	// Form state
	let issueToAccount = $state<any | null>(treasuryAccount || null);
	let destroyFromAccount = $state<any | null>(null);
	let showIssuanceHistory = $state(false);
	let showDestructionHistory = $state(false);

	function formatFranks(cents: number): string {
		return `ƒ${(cents / 100).toFixed(2)}`;
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	}

	// Success handling
	$effect(() => {
		if (form?.success) {
			if (form?.action === 'issue') {
				issueToAccount = treasuryAccount || null;
			} else if (form?.action === 'destroy') {
				destroyFromAccount = null;
			}
		}
	});
</script>

<div class="page">
	<div class="page-header">
		<div>
			<h1>Central Bank Operations</h1>
			<p class="subtitle">
				Manual issuance and destruction of franks. Only authorized CB employees may access this page.
			</p>
		</div>
	</div>

	{#if form?.error}
		<div class="error-banner">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="success-banner">
			{form?.action === 'issue' ? 'Franks issued successfully!' : 'Franks destroyed successfully!'}
		</div>
	{/if}

	<!-- Money Supply Dashboard -->
	<div class="card dashboard">
		<h2>Money Supply</h2>
		<div class="stats-grid">
			<div class="stat-card stat-card--primary">
				<div class="stat-label">Current Supply</div>
				<div class="stat-value">{formatFranks(stats.money_supply)}</div>
				<div class="stat-hint">CB balance: {formatFranks(cbAccount?.balance || 0)}</div>
			</div>
			<div class="stat-card">
				<div class="stat-label">Total Accounts</div>
				<div class="stat-value">{stats.total_accounts.toLocaleString()}</div>
				<div class="stat-hint">{stats.accounts_negative} with negative balances</div>
			</div>
			<div class="stat-card stat-card--success">
				<div class="stat-label">Total Issuance</div>
				<div class="stat-value">{formatFranks(stats.total_issuance)}</div>
			</div>
			<div class="stat-card stat-card--danger">
				<div class="stat-label">Total Demurrage</div>
				<div class="stat-value">{formatFranks(stats.total_demurrage)}</div>
			</div>
		</div>
	</div>

	<!-- Operations Forms -->
	<div class="operations-grid">
		<!-- Issuance Form -->
		<div class="card form-card">
			<h2>Issue Franks</h2>
			<p class="form-description">Create new franks and send them to an account (typically Treasury).</p>
			
			<form method="POST" action="?/issue" use:enhance>
				<div class="form-field">
					<label>Recipient Account*</label>
					{#if issueToAccount}
						<div class="selected-account">
							<div>
								<strong>{issueToAccount.handle_cache}</strong> — {issueToAccount.name}
								<span class="badge badge--{issueToAccount.account_type}">{issueToAccount.account_type}</span>
							</div>
							<button type="button" class="btn-sm" onclick={() => issueToAccount = null}>Change</button>
						</div>
						<input type="hidden" name="to_uuid" value={issueToAccount.uuid} />
					{:else}
						<AccountFinder onselect={(acc) => issueToAccount = acc} showFilters={true} />
					{/if}
				</div>

				<div class="form-field">
					<label for="issue-amount">Amount (ƒ)*</label>
					<input
						type="number"
						id="issue-amount"
						name="amount"
						required
						min="0.01"
						step="0.01"
						placeholder="1000.00"
					/>
				</div>

				<div class="form-field">
					<label for="issue-type">Transaction Type*</label>
					<select id="issue-type" name="type" required>
						<option value="issuance">Issuance (normal)</option>
						<option value="correction">Correction (accounting fix)</option>
						<option value="adjustment">Adjustment (special case)</option>
					</select>
				</div>

				<div class="form-field">
					<label for="issue-memo">Memo</label>
					<input
						type="text"
						id="issue-memo"
						name="memo"
						placeholder="e.g., Birthday issuance - Alice Smith"
					/>
				</div>

				<button type="submit" class="btn-primary btn-full">Issue Franks</button>
			</form>

			<button
				type="button"
				class="btn-ghost btn-full"
				style="margin-top: var(--space-3);"
				onclick={() => showIssuanceHistory = !showIssuanceHistory}
			>
				{showIssuanceHistory ? 'Hide' : 'Show'} Recent Issuances (30 days)
			</button>

			{#if showIssuanceHistory && recentIssuances.length > 0}
				<div class="history-list">
					{#each recentIssuances as tx}
						<div class="history-item">
							<div class="history-main">
								<strong>{formatFranks(tx.amount)}</strong> → {tx.to_handle}
								{#if tx.memo}
									<span class="history-memo">"{tx.memo}"</span>
								{/if}
							</div>
							<div class="history-date">{formatDate(tx.created_at)}</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Destruction Form -->
		<div class="card form-card">
			<h2>Destroy Franks</h2>
			<p class="form-description">Remove franks from circulation by sending them to the Central Bank.</p>
			
			<form method="POST" action="?/destroy" use:enhance>
				<div class="form-field">
					<label>Source Account*</label>
					{#if destroyFromAccount}
						<div class="selected-account">
							<div>
								<strong>{destroyFromAccount.handle_cache}</strong> — {destroyFromAccount.name}
								<span class="badge badge--{destroyFromAccount.account_type}">{destroyFromAccount.account_type}</span>
							</div>
							<button type="button" class="btn-sm" onclick={() => destroyFromAccount = null}>Change</button>
						</div>
						<input type="hidden" name="from_uuid" value={destroyFromAccount.uuid} />
					{:else}
						<AccountFinder onselect={(acc) => destroyFromAccount = acc} showFilters={true} />
					{/if}
				</div>

				<div class="form-field">
					<label for="destroy-amount">Amount (ƒ)*</label>
					<input
						type="number"
						id="destroy-amount"
						name="amount"
						required
						min="0.01"
						step="0.01"
						placeholder="1000.00"
					/>
				</div>

				<div class="form-field">
					<label for="destroy-memo">Memo</label>
					<input
						type="text"
						id="destroy-memo"
						name="memo"
						placeholder="e.g., Demurrage collection for May 2026"
					/>
				</div>

				<button type="submit" class="btn-danger btn-full">Destroy Franks</button>
			</form>

			<button
				type="button"
				class="btn-ghost btn-full"
				style="margin-top: var(--space-3);"
				onclick={() => showDestructionHistory = !showDestructionHistory}
			>
				{showDestructionHistory ? 'Hide' : 'Show'} Recent Destructions (30 days)
			</button>

			{#if showDestructionHistory && recentDestructions.length > 0}
				<div class="history-list">
					{#each recentDestructions as tx}
						<div class="history-item">
							<div class="history-main">
								<strong>{formatFranks(tx.amount)}</strong> ← {tx.from_handle}
								{#if tx.memo}
									<span class="history-memo">"{tx.memo}"</span>
								{/if}
							</div>
							<div class="history-date">{formatDate(tx.created_at)}</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Quick Links -->
	<div class="card quick-links">
		<h2>Quick Links</h2>
		<p class="form-description">Common operations and related admin pages.</p>
		<div class="links-grid">
			<a href="/admin/grouped-transfers" class="link-card">
				<div class="link-title">Grouped Transfers</div>
				<div class="link-desc">Set up demurrage, collections, and recurring transfers</div>
			</a>
			<a href="/admin/accounts" class="link-card">
				<div class="link-title">Account Management</div>
				<div class="link-desc">Create, search, and manage bank accounts</div>
			</a>
			<a href="/history" class="link-card">
				<div class="link-title">Transaction History</div>
				<div class="link-desc">View full ledger and account statements</div>
			</a>
		</div>
	</div>
</div>

<style>
	h1 {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
	}
	h2 {
		margin: 0 0 var(--space-3);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}
	
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		max-width: 1200px;
		margin: 0 auto;
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

	.error-banner {
		background: var(--color-danger-subtle);
		color: var(--color-danger);
		border-radius: var(--radius);
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
	}
	
	.success-banner {
		background: var(--color-success-subtle);
		color: var(--color-success);
		border-radius: var(--radius);
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
	}

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
	}
	
	.dashboard {
		background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-bg) 100%);
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
		margin-top: var(--space-4);
	}
	
	.stat-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-4);
	}
	
	.stat-card--primary {
		background: var(--color-accent-subtle);
		border-color: var(--color-accent);
	}
	
	.stat-card--success {
		background: var(--color-success-subtle);
		border-color: var(--color-success);
	}
	
	.stat-card--danger {
		background: var(--color-danger-subtle);
		border-color: var(--color-danger);
	}
	
	.stat-label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
		margin-bottom: var(--space-2);
	}
	
	.stat-value {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		font-family: var(--font-mono);
		margin-bottom: var(--space-1);
	}
	
	.stat-hint {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	/* Operations Grid */
	.operations-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: var(--space-5);
	}

	/* Form Styles */
	.form-card {
		display: flex;
		flex-direction: column;
	}
	
	.form-description {
		margin: 0 0 var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
	
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
	
	.selected-account {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-3);
		background: var(--color-accent-subtle);
		border: 1px solid var(--color-accent);
		border-radius: var(--radius);
	}

	/* Buttons */
	.btn-primary,
	.btn-danger,
	.btn-ghost,
	.btn-sm {
		font-family: var(--font-sans);
		font-weight: var(--weight-medium);
		border-radius: var(--radius);
		border: 1px solid transparent;
		cursor: pointer;
		transition: background 120ms, color 120ms, border-color 120ms;
		text-align: center;
	}
	
	.btn-primary {
		background: var(--color-accent);
		color: #fff;
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
	}
	
	.btn-primary:hover {
		background: var(--color-accent-hover);
	}
	
	.btn-danger {
		background: var(--color-danger);
		color: #fff;
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
	}
	
	.btn-danger:hover {
		opacity: 0.85;
	}
	
	.btn-ghost {
		background: transparent;
		color: var(--color-text-muted);
		border-color: var(--color-border);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
	}
	
	.btn-ghost:hover {
		background: var(--color-surface);
		color: var(--color-text);
	}
	
	.btn-sm {
		font-size: var(--text-xs);
		padding: 3px var(--space-2);
		background: var(--color-surface);
		border-color: var(--color-border);
		color: var(--color-text);
	}
	
	.btn-full {
		width: 100%;
	}

	/* Badge */
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

	/* History List */
	.history-list {
		margin-top: var(--space-3);
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-3);
		max-height: 300px;
		overflow-y: auto;
	}
	
	.history-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--color-border-faint, var(--color-border));
	}
	
	.history-item:last-child {
		border-bottom: none;
	}
	
	.history-main {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--text-sm);
	}
	
	.history-memo {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-style: italic;
	}
	
	.history-date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	/* Quick Links */
	.quick-links {
		background: var(--color-bg);
	}
	
	.links-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--space-3);
		margin-top: var(--space-4);
	}
	
	.link-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--color-text);
		transition: border-color 120ms, background 120ms;
	}
	
	.link-card:hover {
		border-color: var(--color-accent);
		background: var(--color-accent-subtle);
	}
	
	.link-title {
		font-weight: var(--weight-semibold);
		font-size: var(--text-base);
	}
	
	.link-desc {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
</style>
