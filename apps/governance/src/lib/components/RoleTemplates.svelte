<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card } from '@bfs/ui';

	interface RoleTemplate {
		uuid: string;
		template_key: string;
		title: string;
		description: string | null;
		compensation_franks: number;
		created_at: string;
	}

	interface RoleTemplatePermission {
		app: string;
		permission: string;
	}

	interface Props {
		templates: RoleTemplate[];
		associationUuid: string;
	}

	let { templates, associationUuid }: Props = $props();

	let showCreateForm = $state(false);
	let editingTemplate: string | null = $state(null);
	let viewingPermissions: string | null = $state(null);
	let templatePermissions: Record<string, RoleTemplatePermission[]> = $state({});

	function toggleCreateForm() {
		showCreateForm = !showCreateForm;
		editingTemplate = null;
	}

	function startEdit(uuid: string) {
		editingTemplate = uuid;
		showCreateForm = false;
	}

	function cancelEdit() {
		editingTemplate = null;
	}

	function formatCompensation(franks: number): string {
		return `ƒ${franks.toLocaleString()}`;
	}

	async function loadPermissions(templateUuid: string) {
		const response = await fetch(`/api/role-templates/${templateUuid}/permissions`);
		if (response.ok) {
			const data = await response.json();
			templatePermissions[templateUuid] = data.permissions;
			viewingPermissions = templateUuid;
		}
	}

	function closePermissions() {
		viewingPermissions = null;
	}
</script>

<Card class="template-management">
	<div class="card-header">
		<h2>Role Templates</h2>
		<button class="btn btn-sm" onclick={toggleCreateForm}>
			{showCreateForm ? 'Cancel' : '+ New Template'}
		</button>
	</div>

	{#if showCreateForm}
		<form method="POST" action="?/createTemplate" use:enhance class="template-form">
			<input type="hidden" name="association_uuid" value={associationUuid} />
			<div class="form-group">
				<label for="template_key">Template Key</label>
				<input
					type="text"
					id="template_key"
					name="template_key"
					placeholder="kitchen_manager"
					pattern="[a-z_]+"
					required
				/>
				<small>Lowercase letters and underscores only</small>
			</div>
			<div class="form-group">
				<label for="title">Title</label>
				<input type="text" id="title" name="title" placeholder="Kitchen Manager" required />
			</div>
			<div class="form-group">
				<label for="description">Description</label>
				<textarea id="description" name="description" rows="3" placeholder="Optional description"></textarea>
			</div>
			<div class="form-group">
				<label for="compensation_franks">Compensation (ƒ)</label>
				<input type="number" id="compensation_franks" name="compensation_franks" value="0" min="0" required />
			</div>
			<button type="submit" class="btn btn-primary">Create Template</button>
		</form>
	{/if}

	{#if templates.length === 0}
		<p class="empty">No role templates yet. Create one to standardize roles across your organization.</p>
	{:else}
		<div class="template-list">
			{#each templates as template}
				<div class="template-item">
					{#if editingTemplate === template.uuid}
						<form method="POST" action="?/updateTemplate" use:enhance class="template-edit-form">
							<input type="hidden" name="uuid" value={template.uuid} />
							<div class="form-row">
								<div class="form-group">
									<label for="edit_title_{template.uuid}">Title</label>
									<input
										type="text"
										id="edit_title_{template.uuid}"
										name="title"
										value={template.title}
										required
									/>
								</div>
								<div class="form-group">
									<label for="edit_compensation_{template.uuid}">Compensation (ƒ)</label>
									<input
										type="number"
										id="edit_compensation_{template.uuid}"
										name="compensation_franks"
										value={template.compensation_franks}
										min="0"
										required
									/>
								</div>
							</div>
							<div class="form-group">
								<label for="edit_description_{template.uuid}">Description</label>
								<textarea
									id="edit_description_{template.uuid}"
									name="description"
									rows="2"
								>{template.description ?? ''}</textarea>
							</div>
							<div class="form-actions">
								<button type="submit" class="btn btn-sm btn-primary">Save</button>
								<button type="button" class="btn btn-sm" onclick={cancelEdit}>Cancel</button>
							</div>
						</form>
					{:else}
						<div class="template-header">
							<div class="template-info">
								<h3 class="template-title">{template.title}</h3>
								<code class="template-key">{template.template_key}</code>
								<span class="template-compensation">{formatCompensation(template.compensation_franks)}</span>
							</div>
							<div class="template-actions">
								<button class="btn btn-sm" onclick={() => loadPermissions(template.uuid)}>
									Permissions
								</button>
								<button class="btn btn-sm" onclick={() => startEdit(template.uuid)}>Edit</button>
								<form method="POST" action="?/deleteTemplate" use:enhance style="display: inline;">
									<input type="hidden" name="uuid" value={template.uuid} />
									<button
										type="submit"
										class="btn btn-sm btn-danger"
										onclick={(e) => {
											if (!confirm('Delete this template? Roles using it will keep their current configuration.')) {
												e.preventDefault();
											}
										}}
									>
										Delete
									</button>
								</form>
							</div>
						</div>
						{#if template.description}
							<p class="template-description">{template.description}</p>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if viewingPermissions}
		<div class="modal-overlay" onclick={closePermissions}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h3>Template Permissions</h3>
					<button class="btn-close" onclick={closePermissions}>×</button>
				</div>
				<div class="modal-body">
					{#if templatePermissions[viewingPermissions]?.length > 0}
						<ul class="permission-list">
							{#each templatePermissions[viewingPermissions] as perm}
								<li class="permission-item">
									<code>{perm.app}:{perm.permission}</code>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="empty">No permissions assigned to this template.</p>
					{/if}
					<form method="POST" action="?/setTemplatePermissions" use:enhance class="permission-form">
						<input type="hidden" name="template_uuid" value={viewingPermissions} />
						<div class="form-group">
							<label for="permission_app">Add Permission</label>
							<input type="text" id="permission_app" name="app" placeholder="governance" required />
							<input type="text" name="permission" placeholder="manage_roles" required />
						</div>
						<button type="submit" class="btn btn-sm btn-primary">Add</button>
					</form>
				</div>
			</div>
		</div>
	{/if}
</Card>

<style>
	.template-management {
		margin-bottom: 2rem;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
	}

	.template-form,
	.template-edit-form {
		background: var(--bg-secondary, #f5f5f5);
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
	}

	.form-group input[type='text'],
	.form-group input[type='number'],
	.form-group textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--border-color, #ccc);
		border-radius: 0.25rem;
		font-family: inherit;
	}

	.form-group small {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.85rem;
		color: var(--text-muted, #666);
	}

	.form-row {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1rem;
	}

	.template-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.template-item {
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 0.5rem;
		padding: 1rem;
		background: var(--bg-white, #fff);
	}

	.template-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.template-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.template-title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.template-key {
		background: var(--bg-code, #f0f0f0);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.85rem;
		color: var(--text-code, #333);
	}

	.template-compensation {
		font-weight: 600;
		color: var(--color-primary, #0066cc);
	}

	.template-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.template-description {
		margin: 0.75rem 0 0 0;
		color: var(--text-secondary, #555);
		font-size: 0.95rem;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: 1px solid var(--border-color, #ccc);
		border-radius: 0.25rem;
		background: var(--bg-white, #fff);
		cursor: pointer;
		font-family: inherit;
		font-size: 0.9rem;
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.85rem;
	}

	.btn-primary {
		background: var(--color-primary, #0066cc);
		color: white;
		border-color: var(--color-primary, #0066cc);
	}

	.btn-danger {
		background: var(--color-danger, #dc3545);
		color: white;
		border-color: var(--color-danger, #dc3545);
	}

	.btn:hover {
		opacity: 0.9;
	}

	.empty {
		color: var(--text-muted, #666);
		font-style: italic;
		text-align: center;
		padding: 2rem;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: var(--bg-white, #fff);
		border-radius: 0.5rem;
		max-width: 500px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.25rem;
	}

	.btn-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-body {
		padding: 1rem;
	}

	.permission-list {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem 0;
	}

	.permission-item {
		padding: 0.5rem;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
	}

	.permission-item code {
		font-size: 0.9rem;
	}

	.permission-form {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}
</style>
