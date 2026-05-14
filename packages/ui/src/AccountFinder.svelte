<script lang="ts">
	import Button from './Button.svelte';

	interface Account {
		uuid: string;
		principal_uuid: string;
		name: string;
		handle_cache: string;
		balance: number;
		status: 'active' | 'frozen';
		account_type: 'standard' | 'official' | 'system';
		can_auto_pull: number;
		created_at: string;
	}

	interface Principal {
		uuid: string;
		handle: string;
		name: string;
		type: 'person' | 'association';
		status: string;
	}

	interface SearchResult {
		type: 'account' | 'principal';
		account?: Account;
		principal?: Principal;
	}

	let {
		onselect,
		showFilters = false,
		autoFocus = false,
		searchGovernance = false,
		governanceUrl = '',
	}: {
		onselect?: (account: Account) => void;
		showFilters?: boolean;
		autoFocus?: boolean;
		searchGovernance?: boolean;
		governanceUrl?: string;
	} = $props();

	let query = $state('');
	let accountTypeFilter = $state<string>('');
	let statusFilter = $state<string>('');
	let results = $state<SearchResult[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let debounceTimer: number | null = null;
	let copyFeedback = $state<string | null>(null);

	// Format balance as franks
	function formatFranks(cents: number): string {
		return `ƒ${(cents / 100).toFixed(2)}`;
	}

	// Search with debounce
	async function search() {
		if (query.trim().length < 2 && query.trim().length > 0) {
			results = [];
			return;
		}

		loading = true;
		error = null;
		const searchResults: SearchResult[] = [];

		try {
			// Search bank accounts
			const params = new URLSearchParams();
			if (query.trim()) params.set('q', query.trim());
			if (accountTypeFilter) params.set('account_type', accountTypeFilter);
			if (statusFilter) params.set('status', statusFilter);

			const response = await fetch(`/api/accounts/search?${params}`);
			if (!response.ok) {
				throw new Error('Search failed');
			}

			const data = await response.json();
			const accounts = data.accounts || [];
			
			// Add bank accounts to results
			for (const account of accounts) {
				searchResults.push({
					type: 'account',
					account,
				});
			}

			// Optionally search governance principals
			if (searchGovernance && governanceUrl && query.trim().length >= 2) {
				const govParams = new URLSearchParams({ query: query.trim() });
				const govResponse = await fetch(`${governanceUrl}/api/principals?${govParams}`);
				
				if (govResponse.ok) {
					const govData = await govResponse.json();
					const principals = govData.principals || [];
					
					// Add principals that don't already have bank accounts
					const existingPrincipalUuids = new Set(
						accounts.map((acc: Account) => acc.principal_uuid)
					);
					
					for (const principal of principals) {
						if (!existingPrincipalUuids.has(principal.uuid)) {
							searchResults.push({
								type: 'principal',
								principal,
							});
						}
					}
				}
			}

			results = searchResults;
		} catch (err) {
			error = 'Failed to search';
			console.error('Search error:', err);
			results = [];
		} finally {
			loading = false;
		}
	}

	// Debounced search on query change
	$effect(() => {
		// Watch query, accountTypeFilter, statusFilter
		query;
		accountTypeFilter;
		statusFilter;

		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(search, 300);
	});

	// Handle account selection
	function selectAccount(result: SearchResult) {
		if (onselect && result.type === 'account' && result.account) {
			onselect(result.account);
		}
	}

	// Copy UUID to clipboard
	async function copyUuid(uuid: string) {
		try {
			await navigator.clipboard.writeText(uuid);
			copyFeedback = uuid;
			setTimeout(() => { copyFeedback = null; }, 2000);
		} catch (err) {
			console.error('Failed to copy UUID:', err);
		}
	}
</script>

<div class="account-finder">
	<div class="search-bar">
		<input
			type="text"
			bind:value={query}
			placeholder="Search by handle, name, or UUID..."
			class="search-input"
			autofocus={autoFocus}
		/>
	</div>

	{#if showFilters}
		<div class="filters">
			<select bind:value={accountTypeFilter} class="filter-select">
				<option value="">All account types</option>
				<option value="standard">Standard</option>
				<option value="official">Official</option>
				<option value="system">System</option>
			</select>

			<select bind:value={statusFilter} class="filter-select">
				<option value="">All statuses</option>
				<option value="active">Active</option>
				<option value="frozen">Frozen</option>
			</select>
		</div>
	{/if}

	{#if loading}
		<div class="loading">Searching...</div>
	{/if}

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if results.length > 0}
		<div class="results">
			{#each results as result (result.type === 'account' ? result.account?.uuid : result.principal?.uuid)}
				{#if result.type === 'account' && result.account}
					<div class="result-item">
						<div class="result-main">
							<div class="result-header">
								<span class="result-handle">{result.account.handle_cache || '(no handle)'}</span>
								<span class="result-name">{result.account.name}</span>
								<span class="badge badge--{result.account.account_type}">{result.account.account_type}</span>
								{#if result.account.status === 'frozen'}
									<span class="badge badge--frozen">frozen</span>
								{/if}
							</div>
							<div class="result-details">
								<span class="result-balance">{formatFranks(result.account.balance)}</span>
								<span class="result-uuid">{result.account.uuid.slice(0, 8)}…</span>
							</div>
						</div>
						<div class="result-actions">
							{#if onselect}
								<Button variant="secondary" size="sm" onclick={() => selectAccount(result)}>
									Select
								</Button>
							{/if}
							<Button 
								variant="ghost" 
								size="sm" 
								onclick={() => copyUuid(result.account!.uuid)}
								disabled={copyFeedback === result.account.uuid}
							>
								{copyFeedback === result.account.uuid ? '✓ Copied' : 'Copy UUID'}
							</Button>
						</div>
					</div>
				{:else if result.type === 'principal' && result.principal}
					<div class="result-item result-item--principal">
						<div class="result-main">
							<div class="result-header">
								<span class="result-handle">@{result.principal.handle}</span>
								<span class="result-name">{result.principal.name}</span>
								<span class="badge badge--{result.principal.type}">{result.principal.type}</span>
								{#if result.principal.status !== 'active'}
									<span class="badge badge--inactive">{result.principal.status}</span>
								{/if}
							</div>
							<div class="result-details">
								<span class="result-no-account">No bank account yet</span>
								<span class="result-uuid">{result.principal.uuid.slice(0, 8)}…</span>
							</div>
						</div>
						<div class="result-actions">
							<Button 
								variant="ghost" 
								size="sm" 
								onclick={() => copyUuid(result.principal!.uuid)}
								disabled={copyFeedback === result.principal.uuid}
							>
								{copyFeedback === result.principal.uuid ? '✓ Copied' : 'Copy UUID'}
							</Button>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{:else if query.trim().length >= 2 && !loading}
		<div class="no-results">No accounts found</div>
	{/if}
</div>

<style>
	.account-finder {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
	}

	.search-bar {
		display: flex;
		gap: var(--space-2);
	}

	.search-input {
		flex: 1;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--color-text);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-2) var(--space-3);
		transition: border-color 120ms, box-shadow 120ms;
		outline: none;
	}

	.search-input:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px var(--color-accent-subtle);
	}

	.filters {
		display: flex;
		gap: var(--space-2);
	}

	.filter-select {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--color-text);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-2) var(--space-3);
		outline: none;
		cursor: pointer;
	}

	.loading,
	.error,
	.no-results {
		padding: var(--space-3);
		text-align: center;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.error {
		color: var(--color-danger);
	}

	.results {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-height: 400px;
		overflow-y: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-2);
		background: var(--color-surface);
	}

	.result-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-bg);
		transition: border-color 120ms;
	}

	.result-item:hover {
		border-color: var(--color-accent);
	}

	.result-item--principal {
		border-style: dashed;
		opacity: 0.8;
	}

	.result-item--principal:hover {
		opacity: 1;
	}

	.result-main {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
	}

	.result-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.result-handle {
		font-weight: var(--weight-semibold);
		font-size: var(--text-base);
		color: var(--color-text);
	}

	.result-name {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

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

	.badge--frozen {
		background: var(--color-warning-subtle, #fef3c7);
		color: var(--color-warning, #f59e0b);
	}

	.badge--person,
	.badge--association {
		background: var(--color-info-subtle, #dbeafe);
		color: var(--color-info, #3b82f6);
	}

	.badge--inactive {
		background: var(--color-text-muted);
		color: var(--color-bg);
	}

	.result-details {
		display: flex;
		gap: var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.result-balance {
		font-weight: var(--weight-medium);
	}

	.result-no-account {
		font-style: italic;
		color: var(--color-text-muted);
	}

	.result-uuid {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	.result-actions {
		display: flex;
		gap: var(--space-2);
	}
</style>
