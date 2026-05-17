<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Breadcrumb, Button, Textarea, formatDate } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { listing, otherServices, otherClassifieds, isOwn } = $derived(data);

	let showReportForm = $state(false);

	const mailUrl = $derived(
		`${import.meta.env.VITE_MAIL_URL ?? 'http://localhost:5180'}/compose?to_raw=@${listing.provider_handle_cache}&subject=${encodeURIComponent(`Re: ${listing.title}`)}`
	);

	function fmtRate(rate: number, unit: string): string {
		if (unit === 'negotiable' || rate === 0) return 'Negotiable';
		const label = unit === 'per_hour' ? '/hr' : '/job';
		return `${rate} F${label}`;
	}
</script>

<div class="page">
	<Breadcrumb items={[{ label: '← Services', href: '/services' }]} />

	{#if listing.status !== 'active'}
		<Alert variant="warn">
			This listing is no longer active ({listing.status}).
		</Alert>
	{/if}

	<div class="main-grid">
		<div class="listing-detail">
			<div class="listing-category">{listing.category}</div>
			<h1>{listing.title}</h1>
			<div class="listing-rate">{fmtRate(listing.rate, listing.rate_unit)}</div>

			<div class="listing-meta">
				<span>Offered by <span class="handle">@{listing.provider_handle_cache}</span></span>
				{#if listing.service_area}
					<span>·</span>
					<span>Area: {listing.service_area}</span>
				{/if}
				<span>·</span>
				<span>Listed {fmtDate(listing.created_at)}</span>
			</div>

			<div class="listing-description">
				<pre>{listing.description}</pre>
			</div>

			<p class="no-purchase-note">
				To arrange work, contact the provider directly. Payment is settled through the Community Bank.
			</p>

			<Button href={mailUrl} variant="primary" class="contact-btn">Contact provider via Mail</Button>

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

		<aside class="sidebar">
			{#if otherServices.length > 0}
				<div class="sidebar-section">
					<div class="sidebar-label">More services from @{listing.provider_handle_cache}</div>
					{#each otherServices as other}
						<a href="/services/{other.uuid}" class="sidebar-link">{other.title}</a>
					{/each}
				</div>
			{/if}
			{#if otherClassifieds.length > 0}
				<div class="sidebar-section">
					<div class="sidebar-label">Classifieds by @{listing.provider_handle_cache}</div>
					{#each otherClassifieds as cl}
						<a href="/classifieds/{cl.uuid}" class="sidebar-link">{cl.title}</a>
					{/each}
				</div>
			{/if}
		</aside>
	</div>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 860px; }

	.main-grid { display: grid; grid-template-columns: 1fr 220px; gap: var(--space-8); align-items: start; }

	.listing-detail { display: flex; flex-direction: column; gap: var(--space-4); }

	.listing-category { font-size: var(--text-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

	h1 { margin: 0; font-size: var(--text-2xl); font-weight: var(--weight-bold); }

	.listing-rate { font-size: var(--text-xl); font-weight: var(--weight-bold); color: var(--color-accent, #2563eb); }

	.listing-meta { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: var(--color-text-muted); flex-wrap: wrap; }
	.handle { color: var(--color-text); font-family: var(--font-mono); font-size: var(--text-xs); }

	.listing-description {
		padding: var(--space-4);
		background: var(--color-surface-alt, #f9fafb);
		border: 1px solid var(--color-border-faint);
		border-radius: var(--radius-md);
	}
	.listing-description pre { margin: 0; white-space: pre-wrap; font-family: inherit; font-size: var(--text-sm); line-height: 1.7; }

	.no-purchase-note { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); font-style: italic; }

	:global(.contact-btn) { align-self: flex-start; }

	.report-section { margin-top: var(--space-2); }
	.report-form { display: flex; flex-direction: column; gap: var(--space-2); }
	.report-actions { display: flex; align-items: center; gap: var(--space-3); justify-content: flex-end; }

	:global(.btn-sm) { padding: var(--space-1) var(--space-3); }
	.btn-link { background: none; border: none; padding: 0; font-size: var(--text-sm); color: var(--color-accent); cursor: pointer; text-decoration: underline; }
	.btn-link--muted { color: var(--color-text-muted); font-size: var(--text-xs); }

	.sidebar { display: flex; flex-direction: column; gap: var(--space-5); }
	.sidebar-section { display: flex; flex-direction: column; gap: var(--space-1); }
	.sidebar-label { font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1); }
	.sidebar-link { font-size: var(--text-sm); color: var(--color-text); text-decoration: none; padding: var(--space-1) 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
	.sidebar-link:hover { text-decoration: underline; }
</style>
