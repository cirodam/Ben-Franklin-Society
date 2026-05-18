<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Breadcrumb, Button, Card, FormField, Input, PageHeader, Select } from '@bfs/ui';
	import type { ActionData, PageData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="page">
	<Breadcrumb items={[{ label: '← Back to Services', href: '/services' }]} />
	
	<PageHeader title="Create New Service" />

	<Card>
		<p style="margin: 0; line-height: 1.6;">
			<strong style="color: #166534;">Services</strong> are organizations that deliver essential infrastructure and support to the community.
			Each service operates under the oversight of a specialized committee selected by sortition from the
			relevant professional college. Services handle everything from food distribution and housing to
			health care and education.
		</p>
	</Card>

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	<form method="POST" action="?/create" use:enhance class="form">
		<Card>
			<h2 class="section-title">Basic Information</h2>
			
			<FormField label="Name" required>
				<Input
					id="name"
					name="name"
					type="text"
					required
					placeholder="Manufacturing Service"
					value={form?.name ?? ''}
					hint="Full name of the service"
				/>
			</FormField>

			<FormField label="Handle" required>
				<Input
					id="handle"
					name="handle"
					type="text"
					required
					pattern="[a-z0-9_-]{'{2,64}'}"
					placeholder="manufacturing-service"
					value={form?.handle ?? ''}
					hint="2-64 lowercase letters, numbers, hyphens, or underscores. Used in URLs."
				/>
			</FormField>

			<FormField label="Abbreviation">
				<Input
					id="abbreviation"
					name="abbreviation"
					type="text"
					maxlength={10}
					placeholder="MFG"
					value={form?.abbreviation ?? ''}
					hint="Optional. Short code for motion numbering (e.g., 'MFG 123')"
				/>
			</FormField>
		</Card>

		<Card>
			<h2 class="section-title">Founding Document</h2>
			
			<FormField label="Document Slug">
				<Input
					id="governing_document_slug"
					name="governing_document_slug"
					type="text"
					placeholder="manufacturing-service"
					value={form?.governingDocumentSlug ?? ''}
					hint="Optional. Slug of the governing document in data/documents/. Leave blank if not yet created."
				/>
			</FormField>

			<FormField label="Pursuant to Motion (optional)">
				<Select id="established_by_motion_uuid" name="established_by_motion_uuid">
					<option value="">— No motion —</option>
					{#each data.enactedMotions as motion}
						<option value={motion.uuid}>
							{#if motion.body_abbreviation}
								{motion.body_abbreviation} {motion.motion_number} - {motion.title}
							{:else}
								Motion #{motion.motion_number} - {motion.title}
							{/if}
						</option>
					{/each}
				</Select>
				<div slot="hint" style="font-size: var(--text-xs); color: var(--color-text-muted);">
					Link this service to a motion that authorized its creation
				</div>
			</FormField>
		</Card>

		<div class="form-actions">
			<Button href="/services" variant="ghost">Cancel</Button>
			<Button type="submit">Create Service</Button>
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
