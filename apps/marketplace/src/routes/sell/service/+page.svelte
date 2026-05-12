<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { suspended, categories } = $derived(data);
</script>

<div class="page">
	<div class="breadcrumb"><a href="/sell">← Sell</a></div>
	<h1>Post a Service Offering</h1>

	{#if suspended}
		<div class="suspension-notice">
			<strong>Your account is suspended.</strong>
			You are not permitted to post listings at this time. Contact an administrator for more information.
		</div>
	{:else}
		{#if form?.error}
			<div class="form-error">{form.error}</div>
		{/if}

		<form method="POST" action="?/create" use:enhance class="listing-form">
			<div class="field">
				<label for="title">Title</label>
				<input id="title" name="title" type="text" maxlength="200" required value={form?.title ?? ''} />
			</div>

			<div class="field">
				<label for="category">Category</label>
				<select id="category" name="category" required>
					<option value="">Select a category…</option>
					{#each categories as cat}
						<option value={cat} selected={form?.category === cat}>{cat}</option>
					{/each}
				</select>
			</div>

			<div class="field">
				<label for="description">Description</label>
				<textarea id="description" name="description" rows="7" required>{form?.description ?? ''}</textarea>
			</div>

			<div class="field-row">
				<div class="field">
					<label for="rate">Rate (Florins)</label>
					<input id="rate" name="rate" type="number" min="0" step="1" value={form?.rate ?? '0'} />
					<span class="field-hint">Leave 0 if negotiable or per-job with no fixed rate.</span>
				</div>
				<div class="field">
					<label for="rate_unit">Rate Unit</label>
					<select id="rate_unit" name="rate_unit">
						<option value="per_hour"   selected={!form?.rate_unit || form?.rate_unit === 'per_hour'}>Per hour</option>
						<option value="per_job"    selected={form?.rate_unit === 'per_job'}>Per job</option>
						<option value="negotiable" selected={form?.rate_unit === 'negotiable'}>Negotiable</option>
					</select>
				</div>
			</div>

			<div class="field-row">
				<div class="field">
					<label for="service_area">Service Area (optional)</label>
					<input id="service_area" name="service_area" type="text" maxlength="200" value={form?.service_area ?? ''} placeholder="e.g. North Ward, Riverbank" />
				</div>
				<div class="field">
					<label for="scope">Visibility</label>
					<select id="scope" name="scope">
						<option value="local"     selected={!form?.scope || form?.scope === 'local'}>Local (within society)</option>
						<option value="federated" selected={form?.scope === 'federated'}>Federated (all societies)</option>
					</select>
				</div>
			</div>

			<div class="form-actions">
				<a href="/sell" class="btn btn-ghost">Cancel</a>
				<button type="submit" class="btn btn-primary">Post Listing</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 680px; }
	.breadcrumb a { color: var(--color-text-muted); font-size: var(--text-sm); text-decoration: none; }
	.breadcrumb a:hover { text-decoration: underline; }
	h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }

	.suspension-notice {
		padding: var(--space-5);
		background: #fee2e2;
		border: 1px solid #fca5a5;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: #7f1d1d;
	}
	.form-error {
		padding: var(--space-3) var(--space-4);
		background: #fee2e2;
		border: 1px solid #fca5a5;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: #7f1d1d;
	}

	.listing-form { display: flex; flex-direction: column; gap: var(--space-5); }
	.field { display: flex; flex-direction: column; gap: var(--space-1); flex: 1; }
	.field label { font-size: var(--text-sm); font-weight: var(--weight-medium); }
	.field input[type="text"],
	.field input[type="number"],
	.field select,
	.field textarea {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}
	.field textarea  { resize: vertical; font-family: inherit; }
	.field-hint      { font-size: var(--text-xs); color: var(--color-text-muted); }
	.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }

	.form-actions { display: flex; gap: var(--space-3); justify-content: flex-end; padding-top: var(--space-3); border-top: 1px solid var(--color-border-faint); }

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
	.btn:hover   { filter: brightness(0.92); }
</style>
