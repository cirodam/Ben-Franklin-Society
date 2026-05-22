<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Badge, Button, EmptyState, Input, PageHeader, Textarea } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { sellers, q } = $derived(data);

	let openSeller = $state<string | null>(null);
	let openAction = $state<'suspend' | 'reinstate' | null>(null);

	function openPanel(uuid: string, action: 'suspend' | 'reinstate'): void {
		openSeller = uuid;
		openAction = action;
	}
	function closePanel(): void {
		openSeller = null;
		openAction = null;
	}
</script>

<div class="page">
	<PageHeader title="Sellers" />

	<form method="GET" class="search-form">
		<Input type="text" name="q" value={q} placeholder="Search by handle…" class="search-input" />
		<Button type="submit" variant="ghost" class="btn-sm">Search</Button>
		{#if q}
			<a href="/administrator/sellers" class="btn-link">Clear</a>
		{/if}
	</form>

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	{#if sellers.length === 0}
		<EmptyState title="No sellers found." />
	{:else}
		<div class="seller-list">
			{#each sellers as seller}
				<div class="seller-row">
					<div class="seller-handle">@{seller.handle}</div>
					<div class="seller-count">{seller.listing_count} listing{seller.listing_count !== 1 ? 's' : ''}</div>
					<div class="seller-status">
						<Badge variant={seller.suspended ? 'danger' : 'success'}>
							{seller.suspended ? 'Suspended' : 'Active'}
						</Badge>
					</div>
					<div class="seller-actions">
						{#if openSeller === seller.principal_uuid}
							<form
								method="POST"
								action="?/{openAction}"
								use:enhance={() => { closePanel(); return async ({ update }) => update(); }}
								class="inline-form"
							>
								<input type="hidden" name="principal_uuid" value={seller.principal_uuid} />
								<Textarea name="reason" rows={2} placeholder="Reason…" required class="inline-reason" />
								<div class="inline-btns">
									<Button type="button" variant="ghost" class="btn-sm btn-link" onclick={closePanel}>Cancel</Button>
									<Button
										type="submit"
										variant={openAction === 'suspend' ? 'danger' : 'primary'}
										class="btn-sm"
									>
										{openAction === 'suspend' ? 'Suspend' : 'Reinstate'}
									</Button>
								</div>
							</form>
						{:else if seller.suspended}
							<Button
								variant="primary"
								class="btn-sm"
								onclick={() => openPanel(seller.principal_uuid, 'reinstate')}
							>Reinstate</Button>
						{:else}
							<Button
								variant="ghost"
								class="btn-sm btn-ghost-danger"
								onclick={() => openPanel(seller.principal_uuid, 'suspend')}
							>Suspend</Button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 760px; }

	.search-form { display: flex; align-items: center; gap: var(--space-3); }
	:global(.search-input) { width: 240px; }

	.seller-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.seller-row {
		display: grid;
		grid-template-columns: 180px 120px 100px 1fr;
		align-items: start;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--color-border-faint);
		font-size: var(--text-sm);
	}
	.seller-row:last-child { border-bottom: none; }

	.seller-handle { font-family: var(--font-mono); font-size: var(--text-sm); font-weight: var(--weight-medium); }
	.seller-count  { color: var(--color-text-muted); font-size: var(--text-xs); padding-top: 3px; }

	.inline-form { display: flex; flex-direction: column; gap: var(--space-2); }
	:global(.inline-reason) {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-family: inherit;
		resize: vertical;
	}
	.inline-btns { display: flex; align-items: center; gap: var(--space-2); }

	:global(.btn-sm) { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); }
	:global(.btn-ghost-danger) { border-color: #fca5a5; color: #dc2626; }
	:global(.btn-link) { background: none; border: none; padding: 0; font-size: var(--text-sm); color: var(--color-accent); cursor: pointer; text-decoration: underline; }
</style>
