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
	<PageHeader title="Marketplace">
		<p>Welcome to the community market, @{data.session.handle}.</p>
		<form class="hero__search" method="get" action="/classifieds">
			<Input type="search" name="keyword" placeholder="Search the market..." class="search-input" />
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
						<div class="listing-card__category t-tag">{listing.category}</div>
						<div class="listing-card__title t-product">{listing.title}</div>
						<div class="listing-card__price t-price">{fmtPrice(listing.price, listing.price_negotiable)}</div>
						<div class="listing-card__seller t-seller">@{listing.seller_handle_cache}</div>
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
						<div class="listing-card__category t-tag">{listing.category}</div>
						<div class="listing-card__title t-product">{listing.title}</div>
						<div class="listing-card__price t-price">
							{listing.rate === 0 ? 'Negotiable' : `${listing.rate} F/${listing.rate_unit.replace('per_', '')}`}
						</div>
						<div class="listing-card__seller t-seller">@{listing.provider_handle_cache}</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		max-width: 1000px;
	}

	p {
		margin: 0;
		font-family: var(--font-sans);
		color: var(--slate);
		font-size: var(--text-sm);
		line-height: 1.6;
	}

	.hero__search {
		display: flex;
		gap: var(--space-2);
		max-width: 480px;
		margin-top: var(--space-4);
	}
	
	:global(.search-input) {
		flex: 1;
	}

	/* Browse category cards */
	.browse-links {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: var(--space-4);
	}

	.browse-card {
		border: 2px solid var(--deep-forest);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		text-decoration: none;
		color: var(--charcoal);
		background: var(--canvas);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		transition: all 0.2s;
	}
	
	.browse-card:hover {
		background: white;
		border-color: var(--market-green);
		box-shadow: 0 4px 12px rgba(74, 124, 89, 0.15);
		transform: translateY(-2px);
	}
	
	.browse-card__title {
		font-family: var(--font-serif);
		font-weight: 600;
		font-size: var(--text-lg);
		color: var(--charcoal);
	}
	
	.browse-card__desc {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--slate);
		line-height: 1.5;
	}

	/* Section styling */
	.section {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.section-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding-bottom: var(--space-2);
		border-bottom: 2px solid var(--border);
	}
	
	h2 {
		margin: 0;
		font-family: var(--font-serif);
		font-size: var(--text-2xl);
		font-weight: 600;
		color: var(--charcoal);
	}
	
	.see-all {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--market-green);
		text-decoration: none;
		transition: color 0.2s;
	}
	
	.see-all:hover {
		color: var(--market-green-mid);
		text-decoration: underline;
	}

	/* Listing grid - market stall layout */
	.listing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: var(--space-4);
	}

	/* Market stall product cards */
	.listing-card {
		position: relative;
		border: 2.5px solid var(--deep-forest);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
		text-decoration: none;
		background: var(--canvas);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
	}
	
	.listing-card:hover {
		background: white;
		border-color: var(--market-green);
		box-shadow: 0 6px 16px rgba(74, 124, 89, 0.18);
		transform: translateY(-3px);
	}

	/* Price tag hanging effect */
	.listing-card::before {
		content: '';
		position: absolute;
		top: -8px;
		right: var(--space-4);
		width: 2px;
		height: 12px;
		background: var(--ash);
		opacity: 0.3;
	}

	.listing-card__category {
		color: var(--deep-forest);
	}

	.listing-card__title {
		font-size: var(--text-base);
		line-height: 1.3;
		min-height: 2.6em;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.listing-card__price {
		font-size: var(--text-lg);
		margin-top: auto;
	}

	.listing-card__seller {
		padding-top: var(--space-2);
		border-top: 1px solid var(--border-faint);
	}

	@media (max-width: 640px) {
		.browse-links,
		.listing-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
