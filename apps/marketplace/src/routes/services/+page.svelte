<script lang="ts">
	import { EmptyState, List, ListItem, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';
	import { PAGE_SIZE } from '$lib/constants.js';
	import ListingRow from '$lib/components/ListingRow.svelte';
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { buildServiceUrl } from '$lib/utils/url.js';

	let { data }: { data: PageData } = $props();
	const { listings, total, categories, filters } = $derived(data);

	const totalPages = $derived(Math.ceil(total / PAGE_SIZE));
</script>

<div class="page">
	<PageHeader title="Services">
		<span class="count">{total} listing{total !== 1 ? 's' : ''}</span>
	</PageHeader>

	<div class="layout">
		<FilterPanel
			type="service"
			{categories}
			{filters}
			clearUrl="/services"
		/>

		<div class="results">
			{#if listings.length === 0}
				<EmptyState title="No service listings match your filters." />
			{:else}
				<List>
					{#each listings as listing}
						<ListItem href="/services/{listing.uuid}">
							<ListingRow type="service" {listing} href="/services/{listing.uuid}" />
						</ListItem>
					{/each}
				</List>

				<Pagination
					currentPage={filters.page}
					{totalPages}
					buildUrl={(page) => buildServiceUrl('/services', filters, { page })}
				/>
			{/if}
		</div>
	</div>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); }

	.count { font-size: var(--text-sm); color: var(--color-text-muted); }

	.layout { display: grid; grid-template-columns: 200px 1fr; gap: var(--space-8); align-items: start; }
</style>
