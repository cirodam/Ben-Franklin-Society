<script lang="ts">
	import type { PageData } from './$types.js';
	import { PAGE_SIZE } from '$lib/constants.js';

	let { data }: { data: PageData } = $props();
	const { listings, total, categories, filters } = $derived(data);

	const totalPages = $derived(Math.ceil(total / PAGE_SIZE));

	function buildUrl(overrides: Record<string, string | number | boolean | undefined>): string {
		const p = { ...filters, ...overrides };
		const q = new URLSearchParams();
		if (p.category)   q.set('category', p.category);
		if (p.keyword)    q.set('keyword', p.keyword);
		if (p.minPrice !== undefined) q.set('minPrice', String(p.minPrice));
		if (p.maxPrice !== undefined) q.set('maxPrice', String(p.maxPrice));
		if (p.negotiable) q.set('negotiable', '1');
		if (p.scope)      q.set('scope', p.scope);
		if (p.page && p.page > 1) q.set('page', String(p.page));
		return `/classifieds?${q.toString()}`;
	}

	function fmtPrice(price: number, negotiable: number): string {
		if (price === 0) return 'Free';
		return `${price} F${negotiable ? ' (neg.)' : ''}`;
	}
</script>

<div class="page">
	<div class="page-header">
		<h1>Classifieds</h1>
		<span class="count">{total} listing{total !== 1 ? 's' : ''}</span>
	</div>

	<div class="layout">
		<aside class="filters">
			<form method="get" class="filter-form">
				<div class="filter-section">
					<label class="filter-label" for="keyword">Search</label>
					<input
						id="keyword"
						class="filter-input"
						type="search"
						name="keyword"
						value={filters.keyword ?? ''}
						placeholder="Keywords…"
					/>
				</div>

				<div class="filter-section">
					<label class="filter-label" for="category">Category</label>
					<select id="category" class="filter-select" name="category">
						<option value="">All categories</option>
						{#each categories as cat}
							<option value={cat} selected={filters.category === cat}>{cat}</option>
						{/each}
					</select>
				</div>

				<div class="filter-section">
					<span class="filter-label">Price (Franks)</span>
					<div class="price-range">
						<input class="filter-input" type="number" name="minPrice" min="0"
							value={filters.minPrice ?? ''} placeholder="Min" />
						<span>–</span>
						<input class="filter-input" type="number" name="maxPrice" min="0"
							value={filters.maxPrice ?? ''} placeholder="Max" />
					</div>
				</div>

				<div class="filter-section">
					<label class="filter-check">
						<input type="checkbox" name="negotiable" value="1"
							checked={filters.negotiable} />
						Negotiable only
					</label>
				</div>

				<div class="filter-section">
					<label class="filter-label" for="scope">Scope</label>
					<select id="scope" class="filter-select" name="scope">
						<option value="">All</option>
						<option value="local"     selected={filters.scope === 'local'}>Local</option>
						<option value="federated" selected={filters.scope === 'federated'}>Federated</option>
					</select>
				</div>

				<button class="btn btn-primary" type="submit">Apply</button>
				<a href="/classifieds" class="btn btn-secondary">Clear</a>
			</form>
		</aside>

		<div class="results">
			{#if listings.length === 0}
				<p class="empty">No listings match your filters.</p>
			{:else}
				<div class="listing-list">
					{#each listings as listing}
						<a href="/classifieds/{listing.uuid}" class="listing-row">
							<div class="listing-row__cat">{listing.category}</div>
							<div class="listing-row__title">{listing.title}</div>
							<div class="listing-row__seller">@{listing.seller_handle_cache}</div>
							<div class="listing-row__price">{fmtPrice(listing.price, listing.price_negotiable)}</div>
						</a>
					{/each}
				</div>

				{#if totalPages > 1}
					<div class="pagination">
						{#if filters.page > 1}
							<a class="btn btn-secondary" href={buildUrl({ page: filters.page - 1 })}>← Prev</a>
						{/if}
						<span class="pagination__info">Page {filters.page} of {totalPages}</span>
						{#if filters.page < totalPages}
							<a class="btn btn-secondary" href={buildUrl({ page: filters.page + 1 })}>Next →</a>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); }

	.page-header { display: flex; align-items: baseline; gap: var(--space-4); }
	h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }
	.count { font-size: var(--text-sm); color: var(--color-text-muted); }

	.layout { display: grid; grid-template-columns: 200px 1fr; gap: var(--space-8); align-items: start; }

	.filters { display: flex; flex-direction: column; }

	.filter-form { display: flex; flex-direction: column; gap: var(--space-4); }

	.filter-section { display: flex; flex-direction: column; gap: var(--space-1); }

	.filter-label { font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

	.filter-input, .filter-select {
		padding: var(--space-2) var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		background: var(--color-surface);
		color: var(--color-text);
		width: 100%;
	}

	.price-range { display: flex; align-items: center; gap: var(--space-1); }
	.price-range input { flex: 1; }
	.price-range span { color: var(--color-text-muted); font-size: var(--text-sm); }

	.filter-check { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); cursor: pointer; }

	.empty { color: var(--color-text-muted); font-size: var(--text-sm); }

	.listing-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.listing-row {
		display: grid;
		grid-template-columns: 140px 1fr auto auto;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--color-border-faint);
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-surface);
		font-size: var(--text-sm);
	}
	.listing-row:last-child { border-bottom: none; }
	.listing-row:hover { background: var(--color-surface-hover, #f9fafb); }

	.listing-row__cat {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.listing-row__title { font-weight: var(--weight-medium); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.listing-row__seller { font-size: var(--text-xs); color: var(--color-text-muted); font-family: var(--font-mono); white-space: nowrap; }
	.listing-row__price  { font-weight: var(--weight-semibold); white-space: nowrap; }

	.pagination { display: flex; align-items: center; gap: var(--space-3); padding-top: var(--space-4); }
	.pagination__info { font-size: var(--text-sm); color: var(--color-text-muted); flex: 1; text-align: center; }

	.btn {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		border: none;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.btn-primary   { background: var(--color-accent); color: #fff; }
	.btn-secondary { background: var(--color-surface-alt, #f3f4f6); color: var(--color-text); border: 1px solid var(--color-border); }
	.btn:hover { filter: brightness(0.92); }
</style>
