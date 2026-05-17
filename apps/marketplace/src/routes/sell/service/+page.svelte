<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Breadcrumb, Button, FieldRow, Input, PageHeader, Select, Textarea } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { suspended, categories } = $derived(data);
</script>

<div class="page">
	<Breadcrumb items={[{ label: '← Sell', href: '/sell' }]} />
	<PageHeader title="Post a Service Offering" />

	{#if suspended}
		<Alert variant="danger">
			<strong>Your account is suspended.</strong>
			You are not permitted to post listings at this time. Contact an administrator for more information.
		</Alert>
	{:else}
		{#if form?.error}
			<Alert variant="danger">{form.error}</Alert>
		{/if}

		<form method="POST" action="?/create" use:enhance class="listing-form">
			<Input label="Title" name="title" type="text" maxlength={200} required value={form?.title ?? ''} />

			<Select label="Category" name="category" required value={form?.category ?? ''}>
				<option value="">Select a category…</option>
				{#each categories as cat}
					<option value={cat}>{cat}</option>
				{/each}
			</Select>

			<Textarea label="Description" name="description" rows={7} required value={form?.description ?? ''} />

			<FieldRow>
				<Input label="Rate (Franks)" name="rate" type="number" min={0} step={1} value={form?.rate ?? '0'}
					hint="Leave 0 if negotiable or per-job with no fixed rate." />
				<Select label="Rate Unit" name="rate_unit" value={form?.rate_unit ?? 'per_hour'}>
					<option value="per_hour">Per hour</option>
					<option value="per_job">Per job</option>
					<option value="negotiable">Negotiable</option>
				</Select>
			</FieldRow>

			<FieldRow>
				<Input label="Service Area (optional)" name="service_area" type="text" maxlength={200}
					value={form?.service_area ?? ''} placeholder="e.g. North Ward, Riverbank" />
				<Select label="Visibility" name="scope" value={form?.scope ?? 'local'}>
					<option value="local">Local (within society)</option>
					<option value="federated">Federated (all societies)</option>
				</Select>
			</FieldRow>

			<div class="form-actions">
				<Button href="/sell" variant="ghost">Cancel</Button>
				<Button type="submit" variant="primary">Post Listing</Button>
			</div>
		</form>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 680px; }

	.listing-form { display: flex; flex-direction: column; gap: var(--space-5); }

	.form-actions { display: flex; gap: var(--space-3); justify-content: flex-end; padding-top: var(--space-3); border-top: 1px solid var(--color-border-faint); }
</style>
