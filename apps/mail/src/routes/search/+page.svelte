<script lang="ts">
	import { PageHeader, EmptyState, formatRelativeDate } from '@bfs/ui';
	import type { PageData } from './$types.js';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	const { query, results, total, page, hasMore, filters } = $derived(data);

	let searchQuery = $state(query);
	let senderFilter = $state(filters.sender || '');
	let fromDate = $state(filters.from_date || '');
	let toDate = $state(filters.to_date || '');
	let sentOnly = $state(filters.sent_only || false);
	let receivedOnly = $state(filters.received_only || false);

	function handleSearch(event: Event) {
		event.preventDefault();
		const params = new URLSearchParams();
		if (searchQuery) params.set('q', searchQuery);
		if (senderFilter) params.set('sender', senderFilter);
		if (fromDate) params.set('from', fromDate);
		if (toDate) params.set('to', toDate);
		if (sentOnly) params.set('sent', 'true');
		if (receivedOnly) params.set('received', 'true');
		goto(`/search?${params.toString()}`);
	}

	function clearFilters() {
		senderFilter = '';
		fromDate = '';
		toDate = '';
		sentOnly = false;
		receivedOnly = false;
	}
</script>

<div class="page">
	<PageHeader title="Search Messages" />

	<form class="search-form" onsubmit={handleSearch}>
		<div class="search-main">
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search messages..."
				class="search-input"
				autofocus
			/>
			<button type="submit" class="search-button">Search</button>
		</div>

		<details class="search-filters">
			<summary class="filters-toggle">Advanced Filters</summary>
			<div class="filters-grid">
				<div class="filter-field">
					<label for="sender">From Handle</label>
					<input
						id="sender"
						type="text"
						bind:value={senderFilter}
						placeholder="@handle"
						class="filter-input"
					/>
				</div>

				<div class="filter-field">
					<label for="from-date">From Date</label>
					<input
						id="from-date"
						type="date"
						bind:value={fromDate}
						class="filter-input"
					/>
				</div>

				<div class="filter-field">
					<label for="to-date">To Date</label>
					<input
						id="to-date"
						type="date"
						bind:value={toDate}
						class="filter-input"
					/>
				</div>

				<div class="filter-field">
					<label>
						<input type="checkbox" bind:checked={sentOnly} />
						Sent by me only
					</label>
				</div>

				<div class="filter-field">
					<label>
						<input type="checkbox" bind:checked={receivedOnly} />
						Received by me only
					</label>
				</div>

				<button type="button" onclick={clearFilters} class="clear-filters">
					Clear Filters
				</button>
			</div>
		</details>
	</form>

	{#if query && results.length > 0}
		<div class="results-summary">
			Found {total} {total === 1 ? 'message' : 'messages'}
		</div>

		<div class="results-list">
			{#each results as result}
				<a href="/thread/{result.thread_id}" class="result-card">
					<div class="result-header">
						<span class="result-from t-sender">@{result.from_handle_cache}</span>
						<span class="result-date t-meta">{formatRelativeDate(result.sent_at || result.created_at)}</span>
					</div>
					<div class="result-subject t-subject">{result.subject}</div>
					<div class="result-snippet t-meta">{@html result.snippet}</div>
				</a>
			{/each}
		</div>

		<div class="pagination">
			{#if page > 0}
				<a href="/search?q={encodeURIComponent(query)}&page={page - 1}" class="btn-inline">
					← Previous
				</a>
			{/if}
			{#if hasMore}
				<a href="/search?q={encodeURIComponent(query)}&page={page + 1}" class="btn-inline">
					Next →
				</a>
			{/if}
		</div>
	{:else if query}
		<EmptyState
			icon="🔍"
			title="No messages found"
			message="Try different search terms or adjust your filters"
		/>
	{:else}
		<EmptyState
			icon="🔍"
			title="Search your messages"
			message="Enter a search term to find messages by subject, content, or sender"
		/>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.search-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.search-main {
		display: flex;
		gap: var(--space-3);
	}

	.search-input {
		flex: 1;
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-sans);
		font-size: var(--text-base);
		border: 2px solid var(--border-strong);
		border-radius: var(--radius);
		background: white;
		color: var(--ink-navy);
		transition: border-color 0.2s;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--postal-blue);
		box-shadow: 0 0 0 3px var(--postal-blue-light);
	}

	.search-button {
		padding: var(--space-3) var(--space-6);
		font-family: var(--font-sans);
		font-size: var(--text-base);
		font-weight: 600;
		background: var(--postal-blue);
		color: white;
		border: none;
		border-radius: var(--radius);
		cursor: pointer;
		transition: background 0.2s;
	}

	.search-button:hover {
		background: var(--postal-blue-dark);
	}

	.search-filters {
		background: var(--parchment);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: var(--space-4);
	}

	.filters-toggle {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--postal-blue);
		cursor: pointer;
		list-style: none;
	}

	.filters-toggle::-webkit-details-marker {
		display: none;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
		margin-top: var(--space-4);
	}

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.filter-field label {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--ink-charcoal);
	}

	.filter-input {
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: white;
	}

	.clear-filters {
		padding: var(--space-2) var(--space-4);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		background: none;
		color: var(--ink-slate);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		cursor: pointer;
		align-self: start;
	}

	.clear-filters:hover {
		background: var(--border-faint);
	}

	.results-summary {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--ink-slate);
		padding: var(--space-2) 0;
	}

	.results-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.result-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-5);
		background: white;
		border: 2px solid var(--border-strong);
		border-radius: var(--radius);
		text-decoration: none;
		transition: all 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.result-card:hover {
		border-color: var(--postal-blue);
		box-shadow: 0 2px 8px rgba(61, 90, 128, 0.12);
		transform: translateY(-1px);
	}

	.result-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
	}

	.result-from {
		color: var(--postal-blue-dark);
	}

	.result-subject {
		color: var(--ink-navy);
		font-weight: 500;
	}

	.result-snippet {
		color: var(--ink-slate);
		line-height: 1.5;
	}

	.result-snippet :global(mark) {
		background: var(--postal-blue-light);
		color: var(--postal-blue-dark);
		font-weight: 600;
		padding: 0 2px;
		border-radius: 2px;
	}

	.pagination {
		display: flex;
		gap: var(--space-4);
		justify-content: center;
		margin-top: var(--space-2);
	}

	.btn-inline {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--postal-blue);
		text-decoration: none;
		transition: color 0.2s;
	}

	.btn-inline:hover {
		color: var(--postal-blue-mid);
		text-decoration: underline;
	}
</style>
