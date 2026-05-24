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
		border: 1px solid var(--border-light);
		border-radius: 8px;
		background: var(--bg-surface);
		box-shadow: var(--shadow-sm);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.listing-card:hover {
		border-color: var(--border-accent);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.listing-card__category {
		/* Styled by .t-tag utility class */
	}

	.listing-card__title {
		/* Styled by .t-product utility class */
	}

	.listing-card__price {
		/* Styled by .t-price utility class */
	}

	.listing-card__seller {
		/* Styled by .t-seller utility class */
	}
</style>
