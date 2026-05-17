<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Badge, Breadcrumb, Button, Checkbox, FieldRow, Input, PageHeader, Select, Textarea } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { listing, categories } = $derived(data);

	let confirmWithdraw = $state(false);

	// Prefer form values on validation failure, otherwise use listing values
	const title       = $derived(form?.title       ?? listing.title);
	const description = $derived(form?.description ?? listing.description);
	const category    = $derived(form?.category    ?? listing.category);
	const price       = $derived(form?.price       ?? String(listing.price));
	const negotiable  = $derived(form?.price_negotiable === '1' || (!form && listing.price_negotiable === 1));
	const scope       = $derived(form?.scope       ?? listing.scope);
	const expiresAt   = $derived(form?.expires_at  ?? listing.expires_at ?? '');
</script>

<div class="page">
	<Breadcrumb items={[{ label: '← My Listings', href: '/my-listings' }]} />
	<PageHeader title="Edit Classified">
		{#snippet actions()}
			<Badge variant={listing.status === 'active' ? 'success' : listing.status === 'withdrawn' ? 'warn' : 'danger'}>
				{listing.status}
			</Badge>
		{/snippet}
	</PageHeader>

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}
	{#if form?.success}
		<Alert variant="success">Listing updated.</Alert>
	{/if}

	<form method="POST" action="?/update" use:enhance class="listing-form">
		<Input label="Title" name="title" type="text" maxlength={200} required value={title} />

		<Select label="Category" name="category" required value={category}>
			{#each categories as cat}
				<option value={cat}>{cat}</option>
			{/each}
		</Select>

		<Textarea label="Description" name="description" rows={7} required value={description} />

		<FieldRow>
			<Input label="Price (Franks)" name="price" type="number" min={0} step={1} value={price} />
			<div class="field field--check">
				<Checkbox label="Price is negotiable" name="price_negotiable" value="1" checked={negotiable} />
			</div>
		</FieldRow>

		<FieldRow>
			<Select label="Visibility" name="scope" value={scope}>
				<option value="local">Local (within society)</option>
				<option value="federated">Federated (all societies)</option>
			</Select>
			<Input label="Expires (optional)" name="expires_at" type="date" value={expiresAt} />
		</FieldRow>

		<div class="form-actions">
			<div class="form-actions__withdraw">
				{#if !confirmWithdraw}
					<button type="button" class="btn btn-ghost btn-danger" onclick={() => (confirmWithdraw = true)}>
						Withdraw Listing
					</button>
				{:else}
					<span class="confirm-text">Are you sure?</span>
					<form method="POST" action="?/withdraw" use:enhance>
						<button type="submit" class="btn btn-danger">Yes, Withdraw</button>
					</form>
					<button type="button" class="btn btn-ghost" onclick={() => (confirmWithdraw = false)}>Cancel</button>
				{/if}
			</div>
			<button type="submit" class="btn btn-primary">Save Changes</button>
		</div>
	</form>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 680px; }

	.listing-form { display: flex; flex-direction: column; gap: var(--space-5); }

	.field { display: flex; flex-direction: column; flex: 1; }
	.field--check { justify-content: flex-end; padding-bottom: var(--space-1); }

	.form-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border-faint);
	}
	.form-actions__withdraw { display: flex; align-items: center; gap: var(--space-2); }
	.confirm-text { font-size: var(--text-sm); color: var(--color-text-muted); }

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
	.btn-ghost   { background: transparent; border: 1px solid var(--color-border); color: var(--color-text); }
	.btn-danger  { background: #dc2626; color: #fff; }
	.btn-ghost.btn-danger { background: transparent; border-color: #fca5a5; color: #dc2626; }
	.btn:hover   { filter: brightness(0.92); }
</style>
