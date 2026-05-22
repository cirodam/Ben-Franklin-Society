<script lang="ts">
	import type { ClassifiedListing, ServiceListing } from '$lib/server/listings.js';
	import { formatPrice, formatRate } from '$lib/utils/format.js';

	interface Props {
		type: 'classified' | 'service';
		listing: ClassifiedListing | ServiceListing;
		href: string;
	}

	let { type, listing, href }: Props = $props();

	const priceDisplay = $derived(() => {
		if (type === 'classified') {
			const l = listing as ClassifiedListing;
			return formatPrice(l.price, l.price_negotiable);
		} else {
			const l = listing as ServiceListing;
			return formatRate(l.rate, l.rate_unit);
		}
	});

	const sellerHandle = $derived(
		type === 'classified'
			? (listing as ClassifiedListing).seller_handle_cache
			: (listing as ServiceListing).provider_handle_cache
	);
</script>

<a {href} class="listing-card">
	<div class="listing-card__category t-tag">{listing.category}</div>
	<div class="listing-card__title t-product">{listing.title}</div>
	<div class="listing-card__price t-price">{priceDisplay()}</div>
	<div class="listing-card__seller t-seller">@{sellerHandle}</div>
</a>

<style>
	.listing-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-5);
		border: 2px solid var(--deep-forest);
		border-radius: var(--radius-lg);
		background: var(--canvas);
		text-decoration: none;
		color: var(--charcoal);
		transition: all 0.2s;
	}

	.listing-card:hover {
		background: white;
		border-color: var(--market-green);
		box-shadow: 0 4px 12px rgba(74, 124, 89, 0.15);
		transform: translateY(-2px);
	}

	.listing-card__category {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		color: var(--deep-forest);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.listing-card__title {
		font-family: var(--font-serif);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--charcoal);
		line-height: 1.3;
	}

	.listing-card__price {
		font-size: var(--text-md);
		font-weight: var(--weight-bold);
		color: var(--market-green);
		font-family: var(--font-sans);
	}

	.listing-card__seller {
		font-size: var(--text-sm);
		color: var(--slate);
		font-family: var(--font-mono);
	}

	/* Typography classes for semantic styling */
	.t-tag {
		/* Category tag styling */
	}

	.t-product {
		/* Product name styling */
	}

	.t-price {
		/* Price tag styling */
	}

	.t-seller {
		/* Seller handle styling */
	}
</style>
