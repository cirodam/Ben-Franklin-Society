<script lang="ts">
	import { Button, Input, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';
	import ListingCard from '$lib/components/ListingCard.svelte';
	import BrowseCard from '$lib/components/BrowseCard.svelte';

	let { data }: { data: PageData } = $props();
	const { recentClassifieds, recentServices } = $derived(data);
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
		<BrowseCard
			title="Classifieds"
			description="Goods for sale or free"
			href="/classifieds"
		/>
		<BrowseCard
			title="Services"
			description="Skilled labor & professional services"
			href="/services"
		/>
		<BrowseCard
			title="Markets"
			description="Upcoming market sessions"
			href="/markets"
		/>
	</div>

	{#if recentClassifieds.length > 0}
		<section class="section">
			<div class="section-header">
				<h2>Recent Classifieds</h2>
				<a href="/classifieds" class="see-all">See all →</a>
			</div>
			<div class="listing-grid">
				{#each recentClassifieds as listing}
					<ListingCard
						type="classified"
						{listing}
						href="/classifieds/{listing.uuid}"
					/>
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
					<ListingCard
						type="service"
						{listing}
						href="/services/{listing.uuid}"
					/>
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

	@media (max-width: 640px) {
		.browse-links,
		.listing-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
