<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Textarea, formatDate } from '@bfs/ui';
	import type { ClassifiedListing, ServiceListing } from '$lib/server/listings.js';
	import { formatPrice, formatRate } from '$lib/utils/format.js';
	import type { Snippet } from 'svelte';

	interface Props {
		type: 'classified' | 'service';
		listing: ClassifiedListing | ServiceListing;
		isOwn: boolean;
		mailUrl: string;
		form?: { reported?: boolean; reportError?: string };
		additionalNote?: Snippet;
	}

	let { type, listing, isOwn, mailUrl, form, additionalNote }: Props = $props();

	let showReportForm = $state(false);

	const priceDisplay = $derived(() => {
		if (type === 'classified') {
			const l = listing as ClassifiedListing;
			return formatPrice(l.price, l.price_negotiable);
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

	const contactLabel = $derived(
		type === 'classified' ? 'Contact seller via Mail' : 'Contact provider via Mail'
	);
</script>

<div class="listing-detail">
	<div class="listing-category">{listing.category}</div>
	<h1>{listing.title}</h1>
	<div class="listing-price">{priceDisplay()}</div>

	<div class="listing-meta">
		{#if type === 'classified'}
			{@const classifiedListing = listing as ClassifiedListing}
			<span>Listed by <a href="/classifieds?seller={classifiedListing.seller_uuid}" class="handle">@{classifiedListing.seller_handle_cache}</a></span>
			<span>·</span>
			<span>{formatDate(classifiedListing.created_at)}</span>
			{#if classifiedListing.expires_at}
				<span>·</span>
				<span>Expires {formatDate(classifiedListing.expires_at)}</span>
			{/if}
		{:else}
			{@const serviceListing = listing as ServiceListing}
			<span>Offered by <span class="handle">@{serviceListing.provider_handle_cache}</span></span>
			{#if serviceListing.service_area}
				<span>·</span>
				<span>Area: {serviceListing.service_area}</span>
			{/if}
			<span>·</span>
			<span>Listed {formatDate(serviceListing.created_at)}</span>
		{/if}
	</div>

	<div class="listing-description">
		<pre>{listing.description}</pre>
	</div>

	{#if additionalNote}
		{@render additionalNote()}
	{/if}

	<Button href={mailUrl} variant="primary" class="contact-btn">{contactLabel}</Button>

	{#if !isOwn && listing.status === 'active'}
		<div class="report-section">
			{#if form?.reported}
				<Alert variant="success">Your report has been submitted. Thank you.</Alert>
			{:else if showReportForm}
				<form method="POST" action="?/report" use:enhance class="report-form" onsubmit={() => (showReportForm = false)}>
					{#if form?.reportError}
						<Alert variant="danger">{form.reportError}</Alert>
					{/if}
					<Textarea name="reason" rows={3} placeholder="Describe the issue…" required value="" />
					<div class="report-actions">
						<button type="button" class="btn-link" onclick={() => (showReportForm = false)}>Cancel</button>
						<Button type="submit" variant="danger" class="btn-sm">Submit Report</Button>
					</div>
				</form>
			{:else}
				<button type="button" class="btn-link btn-link--muted" onclick={() => (showReportForm = true)}>Report this listing</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.listing-detail {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.listing-category {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	h1 {
		margin: 0;
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
	}

	.listing-price {
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		color: var(--color-accent, #2563eb);
	}

	.listing-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		flex-wrap: wrap;
	}

	.handle {
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	a.handle {
		text-decoration: none;
	}

	a.handle:hover {
		text-decoration: underline;
	}

	.listing-description {
		padding: var(--space-4);
		background: var(--color-surface-alt, #f9fafb);
		border: 1px solid var(--color-border-faint);
		border-radius: var(--radius-md);
	}

	.listing-description pre {
		margin: 0;
		white-space: pre-wrap;
		font-family: inherit;
		font-size: var(--text-sm);
		line-height: 1.7;
	}

	:global(.contact-btn) {
		align-self: flex-start;
	}

	.report-section {
		margin-top: var(--space-2);
	}

	.report-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.report-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		justify-content: flex-end;
	}

	:global(.btn-sm) {
		padding: var(--space-1) var(--space-3);
	}

	.btn-link {
		background: none;
		border: none;
		padding: 0;
		font-size: var(--text-sm);
		color: var(--color-accent);
		cursor: pointer;
		text-decoration: underline;
	}

	.btn-link--muted {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
</style>
