<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showDeleteConfirm = $state(false);
</script>

<div class="page">
	<div class="page-header">
		<a href="/organization/roles/{data.role.uuid}" class="back-link">
			← Back to {data.role.title}
		</a>
		<h1>Edit Role</h1>
	</div>

	{#if form?.error}
		<div class="alert error">
			{form.error}
		</div>
	{/if}

	<form method="POST" action="?/update" use:enhance class="form">
		<div class="form-card">
			<h2>Role Details</h2>
			
			<div class="field-group">
				<div class="form-field">
					<label for="title">Title *</label>
					<input
						id="title"
						name="title"
						type="text"
						required
						value={form?.title ?? data.role.title}
					/>
				</div>

				<div class="form-field">
					<label for="section_uuid">Section</label>
					<select id="section_uuid" name="section_uuid" value={form?.section_uuid ?? data.role.section_uuid ?? ''}>
						<option value="">None</option>
						{#each data.sections as section}
							<option value={section.uuid}>{section.name}</option>
						{/each}
					</select>
				</div>

				<div class="form-field">
					<label for="reports_to_role_uuid">Reports To</label>
					<select id="reports_to_role_uuid" name="reports_to_role_uuid" value={form?.reports_to_role_uuid ?? data.role.reports_to_role_uuid ?? ''}>
						<option value="">None (Top Level)</option>
						{#each data.allRoles as role}
							<option value={role.uuid}>{role.title}</option>
						{/each}
					</select>
					<span class="field-hint">Select which role this position reports to</span>
				</div>

				<div class="form-field">
					<label for="compensation_franks">Compensation (Franks)</label>
					<input
						id="compensation_franks"
						name="compensation_franks"
						type="number"
						min="0"
						step="1"
						value={form?.compensation_franks ?? data.role.compensation_franks}
					/>
				</div>

				<div class="form-field">
					<label for="description">Description</label>
					<textarea
						id="description"
						name="description"
						rows="5"
						placeholder="Describe the responsibilities and scope of this role..."
					>{form?.description ?? data.role.description ?? ''}</textarea>
				</div>
			</div>
		</div>

		<div class="form-actions">
			<a href="/organization/roles/{data.role.uuid}" class="btn-secondary">Cancel</a>
			<button type="submit" class="btn-primary">Save Changes</button>
		</div>
	</form>

	<div class="danger-zone">
		<h2>Danger Zone</h2>
		<p>Deleting a role is permanent and cannot be undone. All assignment history will be lost.</p>
		
		{#if !showDeleteConfirm}
			<button type="button" class="btn-danger" onclick={() => showDeleteConfirm = true}>
				Delete Role
			</button>
		{:else}
			<div class="delete-confirm">
				<p class="confirm-text">Are you sure? This action cannot be undone.</p>
				<form method="POST" action="?/delete" use:enhance>
					<button type="submit" class="btn-danger">Yes, Delete Role</button>
					<button type="button" class="btn-secondary" onclick={() => showDeleteConfirm = false}>
						Cancel
					</button>
				</form>
			</div>
		{/if}
	</div>
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.page-header {
		margin-bottom: var(--space-2);
	}

	.back-link {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #7a5c1a;
		text-decoration: none;
		display: inline-block;
		margin-bottom: var(--space-3);
	}

	.back-link:hover {
		color: #d4a24a;
		text-decoration: underline;
	}

	h1 {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-3xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0;
		line-height: 1.2;
	}

	.alert {
		padding: var(--space-4);
		border-left: 3px solid #dc2626;
		background: #fee2e2;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #991b1b;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form-card {
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		padding: var(--space-5);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
	}

	.form-card h2 {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0 0 var(--space-4) 0;
		padding-bottom: var(--space-3);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	label {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		color: #374340;
		font-weight: 400;
	}

	input[type='text'],
	input[type='number'],
	select,
	textarea {
		padding: var(--space-2);
		border: 1px solid rgba(45, 90, 79, 0.2);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		background: #fafaf7;
		color: #151c1a;
	}

	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: #7a5c1a;
	}

	textarea {
		resize: vertical;
		line-height: 1.6;
	}

	.field-hint {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-xs);
		color: #6b7280;
		font-style: italic;
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-2);
	}

	.btn-primary,
	.btn-secondary,
	.btn-danger {
		padding: var(--space-2) var(--space-4);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		border: 1px solid rgba(45, 90, 79, 0.2);
		cursor: pointer;
		text-decoration: none;
		display: inline-block;
	}

	.btn-primary {
		background: #7a5c1a;
		color: white;
		border-color: #7a5c1a;
	}

	.btn-primary:hover {
		background: #d4a24a;
		border-color: #d4a24a;
	}

	.btn-secondary {
		background: rgba(250, 250, 247, 0.5);
		color: #151c1a;
	}

	.btn-secondary:hover {
		background: var(--paper);
		border-color: #7a5c1a;
	}

	.btn-danger {
		background: #fee2e2;
		color: #991b1b;
		border-color: #fca5a5;
	}

	.btn-danger:hover {
		background: #fecaca;
	}

	.danger-zone {
		background: var(--paper);
		border: 1px solid rgba(220, 38, 38, 0.3);
		padding: var(--space-5);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
	}

	.danger-zone h2 {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-lg);
		font-weight: 400;
		color: #991b1b;
		margin: 0 0 var(--space-2) 0;
	}

	.danger-zone p {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #374340;
		margin: 0 0 var(--space-3) 0;
		line-height: 1.6;
	}

	.delete-confirm {
		border-top: 1px solid rgba(220, 38, 38, 0.2);
		padding-top: var(--space-3);
		margin-top: var(--space-3);
	}

	.confirm-text {
		font-weight: 600;
		color: #991b1b;
		margin-bottom: var(--space-3) !important;
	}

	.delete-confirm form {
		display: flex;
		gap: var(--space-2);
	}
</style>
