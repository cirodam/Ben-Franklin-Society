<script lang="ts">
	import { Button, Input, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { recentClassifieds, recentServices } = $derived(data);

	function fmtPrice(price: number, negotiable: number): string {
		if (price === 0) return 'Free';
		return `${price} F${negotiable ? ' (negotiable)' : ''}`;
	}
</script>

<div class="page">
	<PageHeader title="BFS Marketplace">
		<p>Welcome, @{data.session.handle}.</p>
		<form class="hero__search" method="get" action="/classifieds">
			<Input type="search" name="keyword" placeholder="Search classifieds…" class="search-input" />
			<Button type="submit" variant="primary">Search</Button>
		</form>
	</PageHeader>

	<div class="browse-links">
		<a href="/classifieds" class="browse-card">
			<div class="browse-card__title">Classifieds</div>
			<div class="browse-card__desc">Goods for sale or free</div>
		</a>
		<a href="/services" class="browse-card">
			<div class="browse-card__title">Services</div>
			<div class="browse-card__desc">Skilled labor &amp; professional services</div>
		</a>
		<a href="/markets" class="browse-card">
			<div class="browse-card__title">Markets</div>
			<div class="browse-card__desc">Upcoming market sessions</div>
		</a>
	</div>

	{#if recentClassifieds.length > 0}
		<section class="section">
			<div class="section-header">
				<h2>Recent Classifieds</h2>
				<a href="/classifieds" class="see-all">See all →</a>
			</div>
			<div class="listing-grid">
				{#each recentClassifieds as listing}
					<a href="/classifieds/{listing.uuid}" class="listing-card">
						<div class="listing-card__category">{listing.category}</div>
						<div class="listing-card__title">{listing.title}</div>
						<div class="listing-card__price">{fmtPrice(listing.price, listing.price_negotiable)}</div>
						<div class="listing-card__seller">@{listing.seller_handle_cache}</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	{#if recentServices.length > 0}
		<section class="section">
			<div class="section-header">
				<h2>Recent Services</h2>
				<a href="/services" class="see-all">See all →</a>
			</div>
			<div class="listing-grid">
				{#each recentServices as listing}
					<a href="/services/{listing.uuid}" class="listing-card">
						<div class="listing-card__category">{listing.category}</div>
						<div class="listing-card__title">{listing.title}</div>
						<div class="listing-card__price">
							{listing.rate === 0 ? 'Negotiable' : `${listing.rate} F/${listing.rate_unit.replace('per_', '')}`}
						</div>
						<div class="listing-card__seller">@{listing.provider_handle_cache}</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-8); max-width: 860px; }

	p  { margin: 0; color: var(--color-text-muted); font-size: var(--text-sm); }

	.hero__search { display: flex; gap: var(--space-2); max-width: 420px; margin-top: var(--space-3); }
	:global(.search-input) { flex: 1; }

	.browse-links {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: var(--space-4);
	}

	.browse-card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.browse-card:hover { background: var(--color-surface-hover, #f9fafb); }
	.browse-card__title { font-weight: var(--weight-semibold); font-size: var(--text-base); }
	.browse-card__desc  { font-size: var(--text-sm); color: var(--color-text-muted); }

	.section { display: flex; flex-direction: column; gap: var(--space-4); }

	.section-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}
	h2 { margin: 0; font-size: var(--text-lg); font-weight: var(--weight-semibold); }
	.see-all { font-size: var(--text-sm); color: var(--color-text-muted); text-decoration: none; }
	.see-all:hover { text-decoration: underline; }

	.listing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: var(--space-3);
	}

	.listing-card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.listing-card:hover { background: var(--color-surface-hover, #f9fafb); }

	.listing-card__category {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.listing-card__title {
		font-weight: var(--weight-medium);
		font-size: var(--text-sm);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.listing-card__price {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-accent, #2563eb);
	}
	.listing-card__seller {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}
</style>
