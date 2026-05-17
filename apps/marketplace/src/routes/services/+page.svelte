<script lang="ts">
	import { Button, EmptyState, Input, List, ListItem, PageHeader, Select } from '@bfs/ui';
	import type { PageData } from './$types.js';
	import { PAGE_SIZE } from '$lib/constants.js';

	let { data }: { data: PageData } = $props();
	const { listings, total, categories, filters } = $derived(data);

	const totalPages = $derived(Math.ceil(total / PAGE_SIZE));

	function buildUrl(overrides: Record<string, string | number | undefined>): string {
		const p = { ...filters, ...overrides };
		const q = new URLSearchParams();
		if (p.category) q.set('category', p.category);
		if (p.keyword)  q.set('keyword', p.keyword);
		if (p.scope)    q.set('scope', p.scope);
		if (p.page && p.page > 1) q.set('page', String(p.page));
		return `/services?${q.toString()}`;
	}

	function fmtRate(rate: number, unit: string): string {
		if (unit === 'negotiable' || rate === 0) return 'Negotiable';
		const label = unit === 'per_hour' ? '/hr' : '/job';
		return `${rate} F${label}`;
	}
</script>

<div class="page">
	<PageHeader title="Services">
		<span class="count">{total} listing{total !== 1 ? 's' : ''}</span>
	</PageHeader>

	<div class="layout">
		<aside class="filters">
			<form method="get" class="filter-form">
				<div class="filter-section">
					<Input
						name="keyword"
						type="search"
						label="Search"
						value={filters.keyword ?? ''}
						placeholder="Keywords…"
					/>
				</div>

				<div class="filter-section">
					<Select name="category" label="Category">
						<option value="">All categories</option>
						{#each categories as cat}
							<option value={cat} selected={filters.category === cat}>{cat}</option>
						{/each}
					</Select>
				</div>

				<div class="filter-section">
					<Select name="scope" label="Scope">
						<option value="">All</option>
						<option value="local"     selected={filters.scope === 'local'}>Local</option>
						<option value="federated" selected={filters.scope === 'federated'}>Federated</option>
					</Select>
				</div>

				<Button type="submit" variant="primary">Apply</Button>
				<Button href="/services" variant="secondary">Clear</Button>
			</form>
		</aside>

		<div class="results">
			{#if listings.length === 0}
				<EmptyState title="No service listings match your filters." />
			{:else}
				<List>
					{#each listings as listing}
						<ListItem href="/services/{listing.uuid}">
							<div class="listing-row-content">
							<div class="listing-row__cat">{listing.category}</div>
								<div class="listing-row__title">{listing.title}</div>
								<div class="listing-row__provider">@{listing.provider_handle_cache}</div>
								<div class="listing-row__rate">{fmtRate(listing.rate, listing.rate_unit)}</div>
							</div>
						</ListItem>
					{/each}
				</List>

				{#if totalPages > 1}
					<div class="pagination">
						{#if filters.page > 1}
							<Button href={buildUrl({ page: filters.page - 1 })} variant="secondary">← Prev</Button>
						{/if}
						<span class="pagination__info">Page {filters.page} of {totalPages}</span>
						{#if filters.page < totalPages}
							<Button href={buildUrl({ page: filters.page + 1 })} variant="secondary">Next →</Button>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); }

	.count { font-size: var(--text-sm); color: var(--color-text-muted); }

	.layout { display: grid; grid-template-columns: 200px 1fr; gap: var(--space-8); align-items: start; }

	.filters { display: flex; flex-direction: column; }
	.filter-form { display: flex; flex-direction: column; gap: var(--space-4); }
	.filter-section { display: flex; flex-direction: column; gap: var(--space-1); }
	.filter-label { font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
	.filter-input, .filter-select {
		padding: var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		background: var(--color-surface);
		color: var(--color-text);
		width: 100%;
	}

	.listing-row-content {
		display: grid;
		grid-template-columns: 160px 1fr auto auto;
		align-items: center;
		gap: var(--space-4);
	}

	.listing-row__cat { font-size: var(--text-xs); color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.listing-row__title { font-weight: var(--weight-medium); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.listing-row__provider { font-size: var(--text-xs); color: var(--color-text-muted); font-family: var(--font-mono); white-space: nowrap; }
	.listing-row__rate { font-weight: var(--weight-semibold); white-space: nowrap; }

	.pagination { display: flex; align-items: center; gap: var(--space-3); padding-top: var(--space-4); }
	.pagination__info { font-size: var(--text-sm); color: var(--color-text-muted); flex: 1; text-align: center; }
</style>
