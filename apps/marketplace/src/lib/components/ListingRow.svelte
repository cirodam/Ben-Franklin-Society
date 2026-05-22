<script lang="ts">
	import type { ClassifiedListing, ServiceListing } from '$lib/server/listings.js';
	import { formatPriceShort, formatRate } from '$lib/utils/format.js';
	import type { Snippet } from 'svelte';

	interface Props {
		type: 'classified' | 'service';
		listing: ClassifiedListing | ServiceListing;
		href: string;
	}

	let { type, listing, href }: Props = $props();

	const priceDisplay = $derived(() => {
		if (type === 'classified') {
			const l = listing as ClassifiedListing;
			return formatPriceShort(l.price, l.price_negotiable);
		} else {
			const l = listing as ServiceListing;
			return formatRate(l.rate, l.rate_unit);
		}
	});

	const handleDisplay = $derived(
		type === 'classified'
			? (listing as ClassifiedListing).seller_handle_cache
			: (listing as ServiceListing).provider_handle_cache
	);
</script>

<div class="listing-row-content">
	<div class="listing-row__cat">{listing.category}</div>
	<div class="listing-row__title">{listing.title}</div>
	<div class="listing-row__seller">@{handleDisplay}</div>
	<div class="listing-row__price">{priceDisplay()}</div>
</div>

<style>
	.listing-row-content {
		display: grid;
		grid-template-columns: 140px 1fr auto auto;
		align-items: center;
		gap: var(--space-4);
	}

	.listing-row__cat {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.listing-row__title {
		font-weight: var(--weight-medium);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.listing-row__seller {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		white-space: nowrap;
	}

	.listing-row__price {
		font-weight: var(--weight-semibold);
		white-space: nowrap;
	}
</style>
