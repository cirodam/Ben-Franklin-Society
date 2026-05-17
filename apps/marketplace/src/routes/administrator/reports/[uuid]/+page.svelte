<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Breadcrumb, Button, Card, Textarea, formatDate } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { report, listing } = $derived(data);

	let openAction = $state<'dismiss' | 'remove_listing' | 'suspend_seller' | null>(null);

	const listingUrl = $derived(
		report.listing_type === 'classified'
			? `/classifieds/${report.listing_uuid}`
			: `/services/${report.listing_uuid}`
	);
</script>

<div class="page">
	<Breadcrumb items={[{ label: '← Reports', href: '/administrator' }]} />
	<h1>Report Review</h1>

	<div class="main-grid">
		<div class="main-col">
			<!-- Listing details -->
			<Card>
				<div class="card-header">
					<div class="label">Reported Listing</div>
					<span class="type-badge">{report.listing_type}</span>
				</div>

				{#if listing}
					<h2><a href={listingUrl} target="_blank">{listing.title}</a></h2>
					<div class="meta">
						<span>By <span class="handle">@{report.seller_handle}</span></span>
						<span>·</span>
						<span>Status: <strong>{listing.status}</strong></span>
					</div>
					<div class="description-box">
						<pre>{'description' in listing ? listing.description : ''}</pre>
					</div>
				{:else}
					<p class="muted">Listing has been deleted.</p>
				{/if}
			</Card>

			<!-- Report details -->
			<Card>
				<div class="card-header">
					<div class="label">Report</div>
					<span class="muted-sm">{fmtDate(report.created_at)}</span>
				</div>
				<p class="reporter-label">From: <em>A member</em></p>
				<div class="report-reason">{report.reason}</div>
			</Card>
		</div>

		<!-- Actions -->
		<aside class="actions-col">
			{#if form?.error}
				<Alert variant="danger">{form.error}</Alert>
			{/if}

			<!-- Dismiss -->
			<div class="action-card">
				<div class="action-title">Dismiss Report</div>
				<div class="action-desc">No action needed. Mark as reviewed.</div>
				{#if openAction === 'dismiss'}
					<form method="POST" action="?/dismiss" use:enhance class="action-form">
						<Textarea name="reason" rows={3} placeholder="Note reason for dismissal…" required />
						<div class="action-btns">
							<Button type="button" variant="ghost" class="btn-sm" onclick={() => (openAction = null)}>Cancel</Button>
							<Button type="submit" variant="primary" class="btn-sm">Confirm Dismiss</Button>
						</div>
					</form>
				{:else}
					<Button variant="ghost" class="btn-sm" onclick={() => (openAction = 'dismiss')}>Dismiss</Button>
				{/if}
			</div>

			<!-- Remove Listing -->
			{#if listing && listing.status !== 'removed'}
				<div class="action-card action-card--warn">
					<div class="action-title">Remove Listing</div>
					<div class="action-desc">Set listing status to <em>removed</em>. The seller will see it in My Listings.</div>
					{#if openAction === 'remove_listing'}
						<form method="POST" action="?/remove_listing" use:enhance class="action-form">
							<Textarea name="reason" rows={3} placeholder="Reason for removal…" required />
							<div class="action-btns">
								<Button type="button" variant="ghost" class="btn-sm" onclick={() => (openAction = null)}>Cancel</Button>
								<Button type="submit" variant="danger" class="btn-sm">Remove Listing</Button>
							</div>
						</form>
					{:else}
						<Button variant="ghost" class="btn-sm btn-ghost-danger" onclick={() => (openAction = 'remove_listing')}>Remove Listing</Button>
					{/if}
				</div>
			{/if}

			<!-- Suspend Seller -->
			<div class="action-card action-card--danger">
				<div class="action-title">Suspend Seller</div>
				<div class="action-desc">Prevent <span class="handle">@{report.seller_handle}</span> from posting new listings.</div>
				{#if openAction === 'suspend_seller'}
					<form method="POST" action="?/suspend_seller" use:enhance class="action-form">
						<Textarea name="reason" rows={3} placeholder="Reason for suspension…" required />
						<div class="action-btns">
							<Button type="button" variant="ghost" class="btn-sm" onclick={() => (openAction = null)}>Cancel</Button>
							<Button type="submit" variant="danger" class="btn-sm">Suspend Seller</Button>
						</div>
					</form>
				{:else}
					<Button variant="ghost" class="btn-sm btn-ghost-danger" onclick={() => (openAction = 'suspend_seller')}>Suspend Seller</Button>
				{/if}
			</div>
		</aside>
	</div>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 900px; }
	h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }

	.main-grid { display: grid; grid-template-columns: 1fr 280px; gap: var(--space-6); align-items: start; }
	.main-col  { display: flex; flex-direction: column; gap: var(--space-5); }

	.card-header { display: flex; align-items: center; gap: var(--space-3); }
	.label { font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
	.type-badge { font-size: var(--text-xs); background: var(--color-surface-alt, #f1f5f9); color: var(--color-text-muted); padding: 2px 8px; border-radius: 9999px; text-transform: capitalize; }
	.muted-sm { font-size: var(--text-xs); color: var(--color-text-muted); }

	h2 { margin: 0; font-size: var(--text-lg); font-weight: var(--weight-semibold); }
	h2 a { color: var(--color-text); text-decoration: none; }
	h2 a:hover { text-decoration: underline; }

	.meta { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: var(--color-text-muted); }
	.handle { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text); }

	.description-box {
		background: var(--color-surface-alt, #f9fafb);
		border: 1px solid var(--color-border-faint);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		max-height: 200px;
		overflow-y: auto;
	}
	.description-box pre { margin: 0; white-space: pre-wrap; font-family: inherit; font-size: var(--text-sm); line-height: 1.6; }

	.reporter-label { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); }
	.report-reason {
		padding: var(--space-3) var(--space-4);
		background: #fef9c3;
		border: 1px solid #fbbf24;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.form-error {
		padding: var(--space-3) var(--space-4);
		background: #fee2e2;
		border: 1px solid #fca5a5;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: #7f1d1d;
	}

	.actions-col { display: flex; flex-direction: column; gap: var(--space-4); }
	.action-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.action-card--warn   { border-color: #fbbf24; }
	.action-card--danger { border-color: #fca5a5; }
	.action-title { font-size: var(--text-sm); font-weight: var(--weight-semibold); }
	.action-desc  { font-size: var(--text-xs); color: var(--color-text-muted); line-height: 1.5; }

	.action-form { display: flex; flex-direction: column; gap: var(--space-2); }
	.action-btns { display: flex; gap: var(--space-2); justify-content: flex-end; }

	.muted { color: var(--color-text-muted); font-size: var(--text-sm); }

		:global(.btn-sm) { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); }
		:global(.btn-ghost-danger) { border-color: #fca5a5; color: #dc2626; }
</style>
