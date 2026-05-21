<script lang="ts">
	import { PageHeader } from '@bfs/ui';
	import SearchBar from '$lib/components/search/SearchBar.svelte';
	import SearchFilters from '$lib/components/search/SearchFilters.svelte';
	import SearchResults from '$lib/components/search/SearchResults.svelte';
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

	function handleSearch() {
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

	<SearchBar bind:query={searchQuery} onSubmit={handleSearch} />

	<SearchFilters
		bind:senderFilter
		bind:fromDate
		bind:toDate
		bind:sentOnly
		bind:receivedOnly
		onClear={clearFilters}
	/>

	<SearchResults {query} {results} {total} {page} {hasMore} />
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
</style>
