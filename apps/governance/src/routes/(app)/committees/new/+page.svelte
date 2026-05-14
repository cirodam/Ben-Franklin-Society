<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let enableSortition = $state(form?.enableSortition ?? true);
</script>

<div class="page">
	<div class="page-header">
		<h1>Create New Committee</h1>
		<a href="/committees" class="breadcrumb">← Back to Committees</a>
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
		<div class="alert alert--error">
			{form.error}
		</div>
	{/if}

	<form method="POST" action="?/create" use:enhance class="form">
		<div class="form-section">
			<h2>Basic Information</h2>
			
			<div class="field">
				<label for="name">Name <span class="required">*</span></label>
				<input
					id="name"
					name="name"
					type="text"
					required
					placeholder="Agricultural Committee"
					value={form?.name ?? ''}
				/>
				<p class="field-hint">Full name of the committee</p>
			</div>

			<div class="field">
				<label for="handle">Handle <span class="required">*</span></label>
				<input
					id="handle"
					name="handle"
					type="text"
					required
					pattern="[a-z0-9_-]{'{2,64}'}"
					placeholder="agricultural-committee"
					value={form?.handle ?? ''}
				/>
				<p class="field-hint">2-64 lowercase letters, numbers, hyphens, or underscores. Used in URLs.</p>
			</div>

			<div class="field">
				<label for="abbreviation">Abbreviation</label>
				<input
					id="abbreviation"
					name="abbreviation"
					type="text"
					maxlength="10"
					placeholder="AGCOM"
					value={form?.abbreviation ?? ''}
				/>
				<p class="field-hint">Optional. Short code for motion numbering (e.g., "AGCOM 123")</p>
			</div>

			<div class="field">
				<label for="governing_document_slug">Founding Document Slug</label>
				<input
					id="governing_document_slug"
					name="governing_document_slug"
					type="text"
					placeholder="committee-rules"
					value={form?.governingDocumentSlug ?? ''}
				/>
				<p class="field-hint">Optional. Slug of the governing document in data/documents/.</p>
			</div>

			<div class="field">
				<label for="established_by_motion_uuid">Pursuant to Motion (optional)</label>
				<select id="established_by_motion_uuid" name="established_by_motion_uuid">
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
				</select>
				<p class="field-hint">Link this committee to a motion that authorized its creation</p>
			</div>
		</div>

		<div class="form-section">
			<h2>Sortition Configuration</h2>
			
			<div class="field-check">
				<label>
					<input 
						type="checkbox" 
						name="enable_sortition" 
						checked={enableSortition}
						onchange={(e) => enableSortition = e.currentTarget.checked}
					/>
					Enable sortition for this committee
				</label>
				<p class="field-hint">If disabled, members must be manually added</p>
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
						value={form?.seatCount ?? 5}
					/>
					<p class="field-hint">How many members serve simultaneously</p>
				</div>

				<div class="field">
					<label for="term_days">Term Length (days) <span class="required">*</span></label>
					<input
						id="term_days"
						name="term_days"
						type="number"
						min="1"
						required={enableSortition}
						value={form?.termDays ?? 180}
					/>
					<p class="field-hint">180 days = ~6 months, 365 days = 1 year</p>
				</div>

				<div class="field">
					<label for="source_college_uuid">Source College (optional)</label>
					<select id="source_college_uuid" name="source_college_uuid">
						<option value="">General membership (no college)</option>
						{#each data.colleges as college}
							<option value={college.uuid} selected={form?.sourceCollegeUuid === college.uuid}>
								{college.name}
							</option>
						{/each}
					</select>
					<p class="field-hint">Draw members from a specific college, or from general membership if none selected</p>
				</div>
			{/if}
		</div>

		<div class="form-section">
			<h2>Governing Document</h2>
			
			<div class="field">
				<label for="governing_document_slug">Document Slug</label>
				<input
					id="governing_document_slug"
					name="governing_document_slug"
					type="text"
					placeholder="committee-rules"
					value={form?.governingDocumentSlug ?? ''}
				/>
				<p class="field-hint">Optional. Slug of the governing document in data/documents/. Leave blank if not yet created.</p>
			</div>
		</div>

		<div class="form-actions">
			<a href="/committees" class="btn btn--ghost">Cancel</a>
			<button type="submit" class="btn btn--primary">Create Committee</button>
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

	.field input:focus,
	.field select:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
