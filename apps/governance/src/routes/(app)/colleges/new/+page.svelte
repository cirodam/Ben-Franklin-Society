<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types.js';

	let { form }: { form: ActionData } = $props();
</script>

<div class="page">
	<div class="page-header">
		<h1>Create New College</h1>
		<a href="/colleges" class="breadcrumb">← Back to Colleges</a>
	</div>

	<div class="info-card">
		<p>
			<strong>Colleges</strong> are voluntary associations of people who share a professional interest or skill.
			Members join colleges to collaborate, learn from peers, and maintain professional standards.
			When specialized committees need members with domain expertise, they draw randomly from the
			relevant college through sortition.
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
					placeholder="College of Fabricators"
					value={form?.name ?? ''}
				/>
				<p class="field-hint">Full name of the college</p>
			</div>

			<div class="field">
				<label for="handle">Handle <span class="required">*</span></label>
				<input
					id="handle"
					name="handle"
					type="text"
					required
					pattern="[a-z0-9_-]{'{2,64}'}"
					placeholder="fabricators"
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
					placeholder="FAB"
					value={form?.abbreviation ?? ''}
				/>
				<p class="field-hint">Optional. Short code for motion numbering (e.g., "FAB 123")</p>
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
					placeholder="college-of-fabricators"
					value={form?.governingDocumentSlug ?? ''}
				/>
				<p class="field-hint">Optional. Slug of the governing document in data/documents/. Leave blank if not yet created.</p>
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
				<p class="field-hint">Link this college to a motion that authorized its creation</p>
			</div>
		</div>

		<div class="form-actions">
			<a href="/colleges" class="btn btn--ghost">Cancel</a>
			<button type="submit" class="btn btn--primary">Create College</button>
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
		background: #eff6ff;
		border: 1px solid #93c5fd;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		line-height: 1.6;
	}

	.info-card p {
		margin: 0;
	}

	.info-card strong {
		color: #1e40af;
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

	.field input {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.field input:focus {
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
