<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let enableSortition = $state(form?.enableSortition ?? !!data.sortitionConfig);
</script>

<div class="page">
	<div class="page-header">
		<h1>Edit Committee</h1>
		<a href="/committees/{data.association.uuid}" class="breadcrumb">← Back to {data.association.name}</a>
	</div>

	{#if form?.error}
		<div class="alert alert--error">
			{form.error}
		</div>
	{/if}

	<form method="POST" action="?/update" use:enhance class="form">
		<div class="form-section">
			<h2>Basic Information</h2>
			
			<div class="field">
				<label for="handle">Handle</label>
				<input
					id="handle"
					type="text"
					disabled
					value={data.association.handle}
				/>
				<p class="field-hint">Handle cannot be changed (used in URLs)</p>
			</div>

			<div class="field">
				<label for="name">Name <span class="required">*</span></label>
				<input
					id="name"
					name="name"
					type="text"
					required
					value={form?.name ?? data.association.name}
				/>
			</div>

			<div class="field">
				<label for="status">Status</label>
				<select id="status" name="status" value={form?.status ?? data.association.status}>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
					<option value="dissolved">Dissolved</option>
				</select>
				<p class="field-hint">Setting to "dissolved" is permanent</p>
			</div>
		</div>

		<div class="form-section">
			<h2>Founding Document</h2>
			
			<div class="field">
				<label for="governing_document_slug">Document Slug</label>
				<input
					id="governing_document_slug"
					name="governing_document_slug"
					type="text"
					placeholder="committee-rules"
					value={form?.governingDocumentSlug ?? data.association.governing_document_slug ?? ''}
				/>
				<p class="field-hint">Slug of the governing document in data/documents/. Leave blank to remove.</p>
			</div>
		</div>

		<div class="form-section">
			<h2>Sortition Configuration</h2>
			
			<div class="field">
				<label class="checkbox-label">
					<input
						type="checkbox"
						name="enable_sortition"
						bind:checked={enableSortition}
					/>
					<span>Enable sortition for this committee</span>
				</label>
				<p class="field-hint">
					Sortition randomly selects members from a source pool for fixed terms
				</p>
			</div>

			{#if enableSortition}
				<div class="field">
					<label for="seat_count">Number of Seats <span class="required">*</span></label>
					<input
						id="seat_count"
						name="seat_count"
						type="number"
						min="1"
						required={enableSortition}
						value={form?.seatCount ?? data.sortitionConfig?.seat_count ?? 5}
					/>
					<p class="field-hint">How many members can be seated at once</p>
				</div>

				<div class="field">
					<label for="term_days">Term Length (days) <span class="required">*</span></label>
					<input
						id="term_days"
						name="term_days"
						type="number"
						min="1"
						required={enableSortition}
						value={form?.termDays ?? data.sortitionConfig?.term_days ?? 180}
					/>
					<p class="field-hint">How long each member serves</p>
				</div>

				<div class="field">
					<label for="source_college_uuid">Source College</label>
					<select
						id="source_college_uuid"
						name="source_college_uuid"
						value={form?.sourceCollegeUuid ?? data.sortitionConfig?.source_college_uuid ?? ''}
					>
						<option value="">Community (all citizens)</option>
						{#each data.colleges as college}
							<option value={college.uuid}>{college.name}</option>
						{/each}
					</select>
					<p class="field-hint">Draw members from a specific college or all citizens</p>
				</div>
			{/if}
		</div>

		<div class="form-actions">
			<a href="/committees/{data.association.uuid}" class="btn btn--ghost">Cancel</a>
			<button type="submit" class="btn btn--primary">Save Changes</button>
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

	.breadcrumb {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--text-sm);
	}

	.breadcrumb:hover {
		text-decoration: underline;
	}

	.alert {
		padding: var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
	}

	.alert--error {
		background: #fee2e2;
		border: 1px solid #fca5a5;
		color: #7f1d1d;
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

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.field label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		cursor: pointer;
	}

	.required {
		color: #dc2626;
	}

	.field input,
	.field select {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.field input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.field input:focus,
	.field select:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.field-hint {
		margin: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border-faint);
	}

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

	.btn--primary {
		background: var(--color-accent);
		color: #fff;
	}

	.btn--ghost {
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text);
	}

	.btn:hover {
		filter: brightness(0.92);
	}
</style>
