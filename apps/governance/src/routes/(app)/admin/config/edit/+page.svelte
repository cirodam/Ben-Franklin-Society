<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Breadcrumb, Button, Card, FormField, Input, PageHeader } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="page">
	<Breadcrumb items={[{ label: '← Back to Config', href: '/config' }]} />
	
	<PageHeader title="Edit Community Config" />

	<Card>
		<p style="margin: 0; font-size: var(--text-sm);">
			⚠️ <strong>Manual Config Editing:</strong> Configuration values are normally changed through enacted motions. This interface is for direct administrative changes only.
		</p>
	</Card>

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	<form method="POST" action="?/update" use:enhance class="form">
		<Card>
			<h2 class="section-title">Configuration Values</h2>
			
			{#each data.entries as entry}
				<FormField label={entry.key}>
					{#snippet children()}
						<Input
							id={entry.key}
							name={entry.key}
							type="text"
							value={entry.value}
							hint={entry.description}
						/>
					{/snippet}
				</FormField>
			{/each}
		</Card>

		<div class="form-actions">
			<Button href="/admin/config" variant="ghost">Cancel</Button>
			<Button type="submit">Save Changes</Button>
		</div>
	</form>
</div>

<style>
	.page {
		max-width: 680px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.section-title {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border-faint);
	}
</style>
