<script lang="ts">
	import { Alert, Breadcrumb } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';
	import ListingDetail from '$lib/components/ListingDetail.svelte';
	import RelatedListings from '$lib/components/RelatedListings.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { listing, otherClassifieds, sellerServices, isOwn } = $derived(data);

	const mailUrl = $derived(
		`${import.meta.env.VITE_MAIL_URL ?? 'http://localhost:5180'}/compose?to_raw=@${listing.seller_handle_cache}&subject=${encodeURIComponent(`Re: ${listing.title}`)}`
	);

	const relatedSections = $derived([
		{
			label: `More from @${listing.seller_handle_cache}`,
			items: otherClassifieds,
			basePath: '/classifieds',
		},
		{
			label: 'Services offered',
			items: sellerServices,
			basePath: '/services',
		},
	]);
</script>

<div class="page">
	<Breadcrumb items={[{ label: '← Classifieds', href: '/classifieds' }]} />

	{#if listing.status !== 'active'}
		<Alert variant="warn">
			This listing is no longer active ({listing.status}).
		</Alert>
	{/if}

	<div class="main-grid">
		<ListingDetail type="classified" {listing} {isOwn} {mailUrl} {form} />
		<RelatedListings sections={relatedSections} />
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		max-width: 860px;
	}

	.main-grid {
		display: grid;
		grid-template-columns: 1fr 220px;
		gap: var(--space-8);
		align-items: start;
	}
</style>
