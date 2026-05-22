<script lang="ts">
	import { Badge, Button, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';
	import { formatPriceShort, formatRate, formatDate } from '$lib/utils/format.js';

	let { data }: { data: PageData } = $props();
	const { classifieds, services } = $derived(data);

	let tab = $state<'classifieds' | 'services'>('classifieds');

	const STATUS_VARIANT: Record<string, 'success' | 'warn' | 'danger' | 'neutral'> = {
		active:    'success',
		withdrawn: 'warn',
		removed:   'danger',
	};
</script>

<div class="page">
	<PageHeader title="My Listings">
		{#snippet actions()}
			<Button href="/sell" variant="primary">+ New Listing</Button>
		{/snippet}
	</PageHeader>

	<div class="tabs">
		<button class="tab {tab === 'classifieds' ? 'tab--active' : ''}" onclick={() => (tab = 'classifieds')}>
			Classifieds ({classifieds.length})
		</button>
		<button class="tab {tab === 'services' ? 'tab--active' : ''}" onclick={() => (tab = 'services')}>
			Services ({services.length})
		</button>
	</div>

	{#if tab === 'classifieds'}
		{#if classifieds.length === 0}
			<p class="empty">You haven't posted any classifieds yet. <a href="/sell/classified">Post one now →</a></p>
		{:else}
			<div class="listing-list">
				{#each classifieds as listing}
					<div class="listing-row">
						<div class="listing-row__title">
							<a href="/classifieds/{listing.uuid}">{listing.title}</a>
						</div>
						<div class="listing-row__cat">{listing.category}</div>
						<div class="listing-row__price">{formatPriceShort(listing.price, listing.price_negotiable)}</div>
						<div class="listing-row__date">{formatDate(listing.created_at)}</div>
						<div class="listing-row__status">
						<Badge variant={STATUS_VARIANT[listing.status] ?? 'neutral'}>{listing.status}</Badge>
						</div>
						<div class="listing-row__actions">
							{#if listing.status !== 'removed'}
								<a href="/sell/classified/{listing.uuid}/edit" class="btn-link">Edit</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		{#if services.length === 0}
			<p class="empty">You haven't posted any services yet. <a href="/sell/service">Post one now →</a></p>
		{:else}
			<div class="listing-list">
				{#each services as listing}
					<div class="listing-row">
						<div class="listing-row__title">
							<a href="/services/{listing.uuid}">{listing.title}</a>
						</div>
						<div class="listing-row__cat">{listing.category}</div>
						<div class="listing-row__price">{formatRate(listing.rate, listing.rate_unit)}</div>
						<div class="listing-row__date">{formatDate(listing.created_at)}</div>
						<div class="listing-row__status">
						<Badge variant={STATUS_VARIANT[listing.status] ?? 'neutral'}>{listing.status}</Badge>
						</div>
						<div class="listing-row__actions">
							{#if listing.status !== 'removed'}
								<a href="/sell/service/{listing.uuid}/edit" class="btn-link">Edit</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); }

	.tabs { display: flex; gap: 0; border-bottom: 1px solid var(--color-border); }

	.tab {
		padding: var(--space-2) var(--space-5);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		margin-bottom: -1px;
	}
	.tab--active { color: var(--color-text); border-bottom-color: var(--color-accent); }
	.tab:hover:not(.tab--active) { color: var(--color-text); }

	.empty { color: var(--color-text-muted); font-size: var(--text-sm); }
	.empty a { color: var(--color-accent); }

	.listing-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.listing-row {
		display: grid;
		grid-template-columns: 1fr 140px 100px 100px 90px auto;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--color-border-faint);
		font-size: var(--text-sm);
	}
	.listing-row:last-child { border-bottom: none; }

	.listing-row__title a { color: var(--color-text); text-decoration: none; font-weight: var(--weight-medium); }
	.listing-row__title a:hover { text-decoration: underline; }
	.listing-row__cat   { font-size: var(--text-xs); color: var(--color-text-muted); }
	.listing-row__price { font-size: var(--text-sm); }
	.listing-row__date  { font-size: var(--text-xs); color: var(--color-text-muted); }

	.btn-link {
		font-size: var(--text-xs);
		color: var(--color-accent);
		text-decoration: none;
	}
	.btn-link:hover { text-decoration: underline; }
</style>
