<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Breadcrumb, Button, Checkbox, FormField, Input, Select } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let enableSortition = $state(form?.enableSortition ?? true);
</script>

<div class="page">
	<div class="page-header">
		<h1>Create New Committee</h1>
		<Breadcrumb items={[{ label: '← Back to Committees', href: '/committees' }]} />
	</div>

	<div class="info-card">
		<p>
			<strong>Committees</strong> are specialized governing bodies responsible for specific domains.
			Members are typically selected by sortition—some from the general membership, others from
			relevant professional colleges when domain expertise is needed. Committees deliberate on policy,
			oversee their associated services, and propose changes to the General Assembly.
		</p>
	</div>

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	<form method="POST" action="?/create" use:enhance class="form">
		<div class="form-section">
			<h2>Basic Information</h2>
			
			<Input
				name="name"
				type="text"
				label="Name"
				required
				placeholder="Agricultural Committee"
				value={form?.name ?? ''}
				hint="Full name of the committee"
			/>

			<Input
				name="handle"
				type="text"
				label="Handle"
				required
				pattern="[a-z0-9_-]{'{2,64}'}"
				placeholder="agricultural-committee"
				value={form?.handle ?? ''}
				hint="2-64 lowercase letters, numbers, hyphens, or underscores. Used in URLs."
			/>

			<Input
				name="abbreviation"
				type="text"
				label="Abbreviation"
				maxlength="10"
				placeholder="AGCOM"
				value={form?.abbreviation ?? ''}
				hint="Optional. Short code for motion numbering (e.g., 'AGCOM 123')"
			/>

			<Input
				name="governing_document_slug"
				type="text"
				label="Founding Document Slug"
				placeholder="committee-rules"
				value={form?.governingDocumentSlug ?? ''}
				hint="Optional. Slug of the governing document in data/documents/."
			/>

			<Select name="established_by_motion_uuid" label="Pursuant to Motion (optional)" hint="Link this committee to a motion that authorized its creation">
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
		</div>

		<div class="form-section">
			<h2>Sortition Configuration</h2>
			
			<div class="field-check">
				<Checkbox 
					name="enable_sortition" 
					bind:checked={enableSortition}
				>
					Enable sortition for this committee
				</Checkbox>
				<p class="field-hint">If disabled, members must be manually added</p>
			</div>

			{#if enableSortition}
				<Input
					name="seat_count"
					type="number"
					label="Number of Seats"
					min="1"
					required={enableSortition}
					value={form?.seatCount ?? 5}
					hint="How many members serve simultaneously"
				/>

				<Input
					name="term_days"
					type="number"
					label="Term Length (days)"
					min="1"
					required={enableSortition}
					value={form?.termDays ?? 180}
					hint="180 days = ~6 months, 365 days = 1 year"
				/>

				<Select name="source_college_uuid" label="Source College (optional)" hint="Draw members from a specific college, or from general membership if none selected">
					<option value="">General membership (no college)</option>
					{#each data.colleges as college}
						<option value={college.uuid} selected={form?.sourceCollegeUuid === college.uuid}>
							{college.name}
						</option>
					{/each}
				</Select>
			{/if}
		</div>

		<div class="form-section">
			<h2>Governing Document</h2>
			
			<FormField label="Document Slug" hint="Optional. Slug of the governing document in data/documents/. Leave blank if not yet created.">
				<input
					id="governing_document_slug"
					name="governing_document_slug"
					type="text"
					placeholder="committee-rules"
					value={form?.governingDocumentSlug ?? ''}
				/>
			</FormField>
		</div>

		<div class="form-actions">
			<Button href="/committees" variant="ghost">Cancel</Button>
			<Button type="submit">Create Committee</Button>
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

	.page-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.page-header h1 {
		margin: 0;
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
	}

	.info-card {
		padding: var(--space-4);
		background: #ede9fe;
		border: 1px solid #c4b5fd;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		line-height: 1.6;
	}

	.info-card p {
		margin: 0;
	}

	.info-card strong {
		color: #6b21a8;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.form-section h2 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	.field-check {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.field-check label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border-faint);
	}
</style>
