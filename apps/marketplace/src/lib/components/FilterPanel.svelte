<script lang="ts">
	import { Button, Checkbox, Input, Select } from '@bfs/ui';
	import type { ClassifiedFilters, ServiceFilters } from '$lib/utils/url.js';

	interface Props {
		type: 'classified' | 'service';
		categories: string[];
		filters: ClassifiedFilters | ServiceFilters;
		clearUrl: string;
	}

	let { type, categories, filters, clearUrl }: Props = $props();
</script>

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

		{#if type === 'classified'}
			{@const classifiedFilters = filters as ClassifiedFilters}
			<div class="filter-section">
				<span class="filter-label">Price (Franks)</span>
				<div class="price-range">
					<Input
						type="number"
						name="minPrice"
						min="0"
						value={classifiedFilters.minPrice ?? ''}
						placeholder="Min"
					/>
					<span>–</span>
					<Input
						type="number"
						name="maxPrice"
						min="0"
						value={classifiedFilters.maxPrice ?? ''}
						placeholder="Max"
					/>
				</div>
			</div>

			<div class="filter-section">
				<Checkbox name="negotiable" value="1" checked={classifiedFilters.negotiable}>
					Negotiable only
				</Checkbox>
			</div>
		{/if}

		<div class="filter-section">
			<Select name="scope" label="Scope">
				<option value="">All</option>
				<option value="local" selected={filters.scope === 'local'}>Local</option>
				<option value="federated" selected={filters.scope === 'federated'}>Federated</option>
			</Select>
		</div>

		<Button type="submit" variant="primary">Apply</Button>
		<Button href={clearUrl} variant="secondary">Clear</Button>
	</form>
</aside>

<style>
	.filters {
		display: flex;
		flex-direction: column;
	}

	.filter-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.filter-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.filter-label {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.price-range {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.price-range span {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
</style>
