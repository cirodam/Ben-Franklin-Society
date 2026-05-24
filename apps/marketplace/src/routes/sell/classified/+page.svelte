<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Breadcrumb, Button, Checkbox, FieldRow, Input, PageHeader, Select, Textarea } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { suspended, categories } = $derived(data);
</script>

<div class="page">
	<Breadcrumb items={[{ label: '← Sell', href: '/sell' }]} />
	<PageHeader title="Post a Classified Ad" />

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
				<Input label="Price (Franks)" name="price" type="number" min={0} step={1} value={form?.price ?? '0'} />
				<div class="field field--check">
					<Checkbox name="price_negotiable" value="1" checked={form?.price_negotiable === '1'}>
						Price is negotiable
					</Checkbox>
				</div>
			</FieldRow>

			<FieldRow>
				<Select label="Visibility" name="scope" value={form?.scope ?? 'local'}>
					<option value="local">Local (within society)</option>
					<option value="federated">Federated (all societies)</option>
				</Select>
				<Input label="Expires (optional)" name="expires_at" type="date" value={form?.expires_at ?? ''} />
			</FieldRow>

			<div class="form-actions">
				<Button href="/sell" variant="ghost">Cancel</Button>
				<Button type="submit" variant="primary">Post Listing</Button>
			</div>
		</form>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); }

	.listing-form { display: flex; flex-direction: column; gap: var(--space-5); }

	.field { display: flex; flex-direction: column; flex: 1; }
	.field--check { justify-content: flex-end; padding-bottom: var(--space-1); }

	.form-actions { display: flex; gap: var(--space-3); justify-content: flex-end; padding-top: var(--space-3); border-top: 1px solid var(--color-border-faint); }
</style>
