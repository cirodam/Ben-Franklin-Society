<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { listing, otherClassifieds, sellerServices, isOwn } = $derived(data);

	let showReportForm = $state(false);

	const mailUrl = $derived(
		`${import.meta.env.VITE_MAIL_URL ?? 'http://localhost:5180'}/compose?to_raw=@${listing.seller_handle_cache}&subject=${encodeURIComponent(`Re: ${listing.title}`)}`
	);

	function fmtPrice(price: number, negotiable: number): string {
		if (price === 0) return 'Free';
		return `${price} F${negotiable ? ' (negotiable)' : ''}`;
	}
	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString([], { dateStyle: 'medium' });
	}
</script>

<div class="page">
	<div class="breadcrumb">
		<a href="/classifieds">← Classifieds</a>
	</div>

	{#if listing.status !== 'active'}
		<div class="status-banner">
			This listing is no longer active ({listing.status}).
		</div>
	{/if}

	<div class="main-grid">
		<div class="listing-detail">
			<div class="listing-category">{listing.category}</div>
			<h1>{listing.title}</h1>
			<div class="listing-price">{fmtPrice(listing.price, listing.price_negotiable)}</div>

			<div class="listing-meta">
				<span>Listed by <a href="/classifieds?seller={listing.seller_uuid}" class="handle">@{listing.seller_handle_cache}</a></span>
				<span>·</span>
				<span>{fmtDate(listing.created_at)}</span>
				{#if listing.expires_at}
					<span>·</span>
					<span>Expires {fmtDate(listing.expires_at)}</span>
				{/if}
			</div>

			<div class="listing-description">
				<pre>{listing.description}</pre>
			</div>

			<a href={mailUrl} class="btn btn-primary contact-btn">Contact seller via Mail</a>

			{#if !isOwn && listing.status === 'active'}
				<div class="report-section">
					{#if form?.reported}
						<p class="report-sent">Your report has been submitted. Thank you.</p>
					{:else if showReportForm}
						<form method="POST" action="?/report" use:enhance class="report-form" onsubmit={() => (showReportForm = false)}>
							{#if form?.reportError}
								<p class="report-error">{form.reportError}</p>
							{/if}
							<textarea name="reason" rows="3" placeholder="Describe the issue…" required></textarea>
							<div class="report-actions">
								<button type="button" class="btn-link" onclick={() => (showReportForm = false)}>Cancel</button>
								<button type="submit" class="btn btn-sm btn-danger">Submit Report</button>
							</div>
						</form>
					{:else}
						<button type="button" class="btn-link btn-link--muted" onclick={() => (showReportForm = true)}>Report this listing</button>
					{/if}
				</div>
			{/if}
		</div>

		<aside class="sidebar">
			{#if otherClassifieds.length > 0}
				<div class="sidebar-section">
					<div class="sidebar-label">More from @{listing.seller_handle_cache}</div>
					{#each otherClassifieds as other}
						<a href="/classifieds/{other.uuid}" class="sidebar-link">{other.title}</a>
					{/each}
				</div>
			{/if}
			{#if sellerServices.length > 0}
				<div class="sidebar-section">
					<div class="sidebar-label">Services offered</div>
					{#each sellerServices as svc}
						<a href="/services/{svc.uuid}" class="sidebar-link">{svc.title}</a>
					{/each}
				</div>
			{/if}
		</aside>
	</div>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 860px; }

	.breadcrumb a { color: var(--color-text-muted); font-size: var(--text-sm); text-decoration: none; }
	.breadcrumb a:hover { text-decoration: underline; }

	.status-banner {
		padding: var(--space-3) var(--space-4);
		background: #fef9c3;
		border: 1px solid #fbbf24;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: #78350f;
	}

	.main-grid {
		display: grid;
		grid-template-columns: 1fr 220px;
		gap: var(--space-8);
		align-items: start;
	}

	.listing-detail { display: flex; flex-direction: column; gap: var(--space-4); }

	.listing-category {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	h1 { margin: 0; font-size: var(--text-2xl); font-weight: var(--weight-bold); }

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
	}
	.handle { color: var(--color-text); text-decoration: none; font-family: var(--font-mono); font-size: var(--text-xs); }
	.handle:hover { text-decoration: underline; }

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

	.contact-btn { align-self: flex-start; }

	.report-section { margin-top: var(--space-2); }
	.report-form { display: flex; flex-direction: column; gap: var(--space-2); }
	.report-form textarea {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-family: inherit;
		resize: vertical;
	}
	.report-actions { display: flex; align-items: center; gap: var(--space-3); justify-content: flex-end; }
	.report-sent  { font-size: var(--text-sm); color: #065f46; }
	.report-error { font-size: var(--text-xs); color: #dc2626; margin: 0; }

	.btn {
		padding: var(--space-2) var(--space-5);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		border: none;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
	}
	.btn-primary { background: var(--color-accent); color: #fff; }
	.btn-sm { padding: var(--space-1) var(--space-3); }
	.btn-danger { background: #dc2626; color: #fff; }
	.btn:hover { filter: brightness(0.92); }
	.btn-link { background: none; border: none; padding: 0; font-size: var(--text-sm); color: var(--color-accent); cursor: pointer; text-decoration: underline; }
	.btn-link--muted { color: var(--color-text-muted); font-size: var(--text-xs); }

	.sidebar { display: flex; flex-direction: column; gap: var(--space-5); }

	.sidebar-section { display: flex; flex-direction: column; gap: var(--space-1); }

	.sidebar-label {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-1);
	}

	.sidebar-link {
		font-size: var(--text-sm);
		color: var(--color-text);
		text-decoration: none;
		padding: var(--space-1) 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
	}
	.sidebar-link:hover { text-decoration: underline; }
</style>
