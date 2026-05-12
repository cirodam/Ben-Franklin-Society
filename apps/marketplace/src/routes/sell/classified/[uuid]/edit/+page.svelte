<script lang="ts">
	import { enhance } from '$app/forms';
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
	<div class="breadcrumb">
		<a href="/my-listings">← My Listings</a>
	</div>
	<div class="page-header">
		<h1>Edit Classified</h1>
		<span class="status-badge status-{listing.status}">{listing.status}</span>
	</div>

	{#if form?.error}
		<div class="form-error">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="form-success">Listing updated.</div>
	{/if}

	<form method="POST" action="?/update" use:enhance class="listing-form">
		<div class="field">
			<label for="title">Title</label>
			<input id="title" name="title" type="text" maxlength="200" required value={title} />
		</div>

		<div class="field">
			<label for="category">Category</label>
			<select id="category" name="category" required>
				{#each categories as cat}
					<option value={cat} selected={category === cat}>{cat}</option>
				{/each}
			</select>
		</div>

		<div class="field">
			<label for="description">Description</label>
			<textarea id="description" name="description" rows="7" required>{description}</textarea>
		</div>

		<div class="field-row">
			<div class="field">
				<label for="price">Price (Florins)</label>
				<input id="price" name="price" type="number" min="0" step="1" value={price} />
			</div>
			<div class="field field--check">
				<label>
					<input type="checkbox" name="price_negotiable" value="1" checked={negotiable} />
					Price is negotiable
				</label>
			</div>
		</div>

		<div class="field-row">
			<div class="field">
				<label for="scope">Visibility</label>
				<select id="scope" name="scope">
					<option value="local"     selected={scope === 'local'}>Local (within society)</option>
					<option value="federated" selected={scope === 'federated'}>Federated (all societies)</option>
				</select>
			</div>
			<div class="field">
				<label for="expires_at">Expires (optional)</label>
				<input id="expires_at" name="expires_at" type="date" value={expiresAt} />
			</div>
		</div>

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
	.breadcrumb a { color: var(--color-text-muted); font-size: var(--text-sm); text-decoration: none; }
	.breadcrumb a:hover { text-decoration: underline; }

	.page-header { display: flex; align-items: center; gap: var(--space-3); }
	h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }

	.status-badge {
		padding: 2px 10px;
		border-radius: 9999px;
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		text-transform: capitalize;
	}
	.status-active    { background: #d1fae5; color: #065f46; }
	.status-withdrawn { background: #fef3c7; color: #92400e; }
	.status-removed   { background: #fee2e2; color: #7f1d1d; }

	.form-error, .form-success {
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
	}
	.form-error   { background: #fee2e2; border: 1px solid #fca5a5; color: #7f1d1d; }
	.form-success { background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46; }

	.listing-form { display: flex; flex-direction: column; gap: var(--space-5); }
	.field { display: flex; flex-direction: column; gap: var(--space-1); flex: 1; }
	.field label { font-size: var(--text-sm); font-weight: var(--weight-medium); }
	.field input[type="text"],
	.field input[type="number"],
	.field input[type="date"],
	.field select,
	.field textarea {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}
	.field textarea { resize: vertical; font-family: inherit; }
	.field--check { justify-content: flex-end; padding-bottom: var(--space-1); }
	.field--check label { display: flex; align-items: center; gap: var(--space-2); font-weight: var(--weight-normal); cursor: pointer; }
	.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }

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
