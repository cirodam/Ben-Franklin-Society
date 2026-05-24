<script lang="ts">
	import { Alert, Breadcrumb } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';
	import ListingDetail from '$lib/components/ListingDetail.svelte';
	import RelatedListings from '$lib/components/RelatedListings.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { listing, otherServices, otherClassifieds, isOwn } = $derived(data);

	const mailUrl = $derived(
		`${import.meta.env.VITE_MAIL_URL ?? 'http://localhost:5180'}/compose?to_raw=@${listing.provider_handle_cache}&subject=${encodeURIComponent(`Re: ${listing.title}`)}`
	);

	const relatedSections = $derived([
		{
			label: `More services from @${listing.provider_handle_cache}`,
			items: otherServices,
			basePath: '/services',
		},
		{
			label: `Classifieds by @${listing.provider_handle_cache}`,
			items: otherClassifieds,
			basePath: '/classifieds',
		},
	]);
</script>

<div class="page">
	<Breadcrumb items={[{ label: '← Services', href: '/services' }]} />

	{#if listing.status !== 'active'}
		<Alert variant="warn">
			This listing is no longer active ({listing.status}).
		</Alert>
	{/if}

	<div class="main-grid">
		<ListingDetail type="service" {listing} {isOwn} {mailUrl} {form}>
			{#snippet additionalNote()}
				<p class="no-purchase-note">
					To arrange work, contact the provider directly. Payment is settled through the Community Bank.
				</p>
			{/snippet}
		</ListingDetail>
		<RelatedListings sections={relatedSections} />
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.main-grid {
		display: grid;
		grid-template-columns: 1fr 220px;
		gap: var(--space-8);
		align-items: start;
	}

	.no-purchase-note {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-style: italic;
	}
</style>
