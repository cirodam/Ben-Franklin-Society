<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Badge, Breadcrumb, Button, FieldRow, Input, PageHeader, Select, Textarea } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { listing, categories } = $derived(data);

	let confirmWithdraw = $state(false);

	const title       = $derived(form?.title       ?? listing.title);
	const description = $derived(form?.description ?? listing.description);
	const category    = $derived(form?.category    ?? listing.category);
	const rate        = $derived(form?.rate        ?? String(listing.rate));
	const rate_unit   = $derived(form?.rate_unit   ?? listing.rate_unit);
	const service_area = $derived(form?.service_area ?? listing.service_area ?? '');
	const scope       = $derived(form?.scope       ?? listing.scope);
</script>

<div class="page">
	<Breadcrumb items={[{ label: '← My Listings', href: '/my-listings' }]} />
	<PageHeader title="Edit Service Listing">
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
			<Input label="Rate (Franks)" name="rate" type="number" min={0} step={1} value={rate} />
			<Select label="Rate Unit" name="rate_unit" value={rate_unit}>
				<option value="per_hour">Per hour</option>
				<option value="per_job">Per job</option>
				<option value="negotiable">Negotiable</option>
			</Select>
		</FieldRow>

		<FieldRow>
			<Input label="Service Area (optional)" name="service_area" type="text" maxlength={200}
				value={service_area} placeholder="e.g. North Ward, Riverbank" />
			<Select label="Visibility" name="scope" value={scope}>
				<option value="local">Local (within society)</option>
				<option value="federated">Federated (all societies)</option>
			</Select>
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
