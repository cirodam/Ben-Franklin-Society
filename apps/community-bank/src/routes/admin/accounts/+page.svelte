<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { AccountFinder, Alert, Button, Card, Input, PageHeader, Select } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { accounts, query } = $derived(data);

	let showCreateForm = $state(false);
	let searchQuery = $state(query || '');

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
		if (form?.success && form?.created) {
			showCreateForm = false;
			// Redirect to account detail page
			goto(`/admin/accounts/${form.created}`);
		}
	});

	function handleSearch() {
		if (searchQuery.trim()) {
			goto(`/admin/accounts?q=${encodeURIComponent(searchQuery)}`);
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<div>
			<PageHeader title="Account Management">
				<p class="subtitle">
					Search existing accounts or create new ones. Use Account Finder to check if an account exists before creating.
				</p>
			</PageHeader>
		</div>
		<Button onclick={() => showCreateForm = !showCreateForm} variant="primary">
			{showCreateForm ? 'Cancel' : '+ Create Account'}
		</Button>
	</div>

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}
	{#if form?.success && !form?.created}
		<Alert variant="success">Account updated successfully!</Alert>
	{/if}

	<!-- Create Account Form -->
	{#if showCreateForm}
		<Card class="form-card">
			<h2>Create New Account</h2>
			<p class="form-description">
				<strong>First, search for the account below</strong> to make sure it doesn't already exist.
				If not found, fill in the form to create it.
			</p>

			<!-- Integrated Account Finder -->
			<div class="finder-section">
				<h3>Search Existing Accounts</h3>
				<AccountFinder showFilters={true} autoFocus={true} />
			</div>

			<!-- Divider -->
			<div class="divider">
				<span>If not found, create new account</span>
			</div>

			<!-- Create Form -->
			<form method="POST" action="?/create" use:enhance>
				<Input
					name="principal_uuid"
					type="text"
					label="Principal UUID (from governance)"
					required
					placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
					pattern="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
					hint="Copy UUID from governance app (person or association)"
				/>

				<Input
					name="handle_cache"
					type="text"
					label="Handle (e.g., @alice)"
					required
					placeholder="alice"
					hint="Without @ symbol"
				/>

				<Input
					name="name"
					type="text"
					label="Account Name"
					required
					placeholder="Primary"
					hint="Usually \"Primary\" for personal accounts"
				/>

				<Select name="account_type" label="Account Type" hint="Auto-pull permissions are managed separately via account owner permissions" required>
					<option value="standard" selected>Standard (regular members)</option>
					<option value="official">Official (Treasury, SIF, etc.)</option>
					<option value="system">System (Central Bank only)</option>
				</Select>

				<div class="form-actions">
					<Button type="submit" variant="primary">Create Account</Button>
					<Button type="button" variant="secondary" onclick={() => showCreateForm = false}>Cancel</Button>
				</div>
			</form>
		</Card>
	{/if}

	<!-- Search Section -->
	<Card>
		<h2>Search Accounts</h2>
		<form onsubmit={(e) => { e.preventDefault(); handleSearch(); }}>
			<div class="search-bar">
				<Input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by handle, name, or UUID..."
				/>
				<Button type="submit" variant="primary">Search</Button>
			</div>
		</form>

		{#if query && accounts.length > 0}
			<div class="results-section">
				<p class="results-count">{accounts.length} account(s) found</p>
				<div class="accounts-grid">
					{#each accounts as account}
						<a href="/admin/accounts/{account.uuid}" class="account-card">
							<div class="account-header">
								<div class="account-title">
									<strong>{account.handle_cache || '(no handle)'}</strong>
									<span class="account-name">{account.name}</span>
								</div>
								<span class="badge badge--{account.account_type}">{account.account_type}</span>
							</div>
							<div class="account-details">
								<div class="account-balance" class:negative={account.balance < 0}>
									{formatFranks(account.balance)}
								</div>
								<div class="account-status">
									<span class="status-badge status--{account.status}">{account.status}</span>
								</div>
							</div>
							<div class="account-meta">
								<span class="account-uuid">{account.uuid.slice(0, 8)}…</span>
								<span class="account-date">Created {formatDate(account.created_at)}</span>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{:else if query}
			<p class="empty">No accounts found matching "{query}"</p>
		{:else}
			<p class="empty">Enter a search query to find accounts</p>
		{/if}
	</Card>
</div>

<style>
	h2 {
		margin: 0 0 var(--space-3);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}
	h3 {
		margin: 0 0 var(--space-2);
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
	}
	
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
		background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-bg) 100%);
	}

	/* Form Styles */
	.form-description {
		margin: 0 0 var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
	
	.finder-section {
		margin-bottom: var(--space-5);
		padding: var(--space-4);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}
	
	.divider {
		position: relative;
		text-align: center;
		margin: var(--space-5) 0;
	}
	
	.divider::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--color-border);
	}
	
	.divider span {
		position: relative;
		display: inline-block;
		padding: 0 var(--space-3);
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
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
	
	.checkbox-label {
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
	
	.form-actions {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-5);
	}

	/* Search Bar */
	.search-bar {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}
	
	.search-input {
		flex: 1;
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
	
	.search-input:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px var(--color-accent-subtle);
	}

	/* Results */
	.results-section {
		margin-top: var(--space-4);
	}
	
	.results-count {
		margin: 0 0 var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
	
	.accounts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-3);
	}
	
	.account-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--color-text);
		transition: border-color 120ms, box-shadow 120ms;
	}
	
	.account-card:hover {
		border-color: var(--color-accent);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.account-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: var(--space-2);
	}
	
	.account-title {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	
	.account-title strong {
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
	}
	
	.account-name {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
	
	.account-details {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.account-balance {
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		font-family: var(--font-mono);
	}
	
	.account-balance.negative {
		color: var(--color-danger);
	}
	
	.account-meta {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
	
	.account-uuid {
		font-family: var(--font-mono);
	}

	/* Badges */
	.badge,
	.status-badge {
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
	
	.status--active {
		background: var(--color-success-subtle);
		color: var(--color-success);
	}
	
	.status--frozen {
		background: var(--color-warning-subtle, #fef3c7);
		color: var(--color-warning, #f59e0b);
	}

	.empty {
		text-align: center;
		padding: var(--space-5);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		margin: 0;
	}
</style>
