<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card } from '@bfs/ui';

	type Section = {
		uuid: string;
		name: string;
		description: string | null;
		parent_section_uuid: string | null;
	};

	type Role = {
		uuid: string;
		title: string;
		section_uuid: string | null;
		section_name?: string | null;
		reports_to_role_uuid: string | null;
		description: string | null;
		compensation_franks: number;
		holders?: Array<{
			uuid: string;
			handle: string;
			given_name: string;
			family_name: string;
		}>;
		permissions?: Array<{ name: string }>;
	};

	type Member = {
		person_uuid: string;
		person: {
			uuid: string;
			handle: string;
			given_name: string;
			family_name: string;
		} | null;
	};

	type Motion = {
		uuid: string;
		title: string;
		body_name: string;
	};

	type RoleNode = Role & {
		children: RoleNode[];
	};

	interface Props {
		sections: Section[];
		roles: Role[];
		members?: Member[];
		enactedMotions?: Motion[];
		associationUuid?: string;
		canManage?: boolean;
	}

	let {
		sections,
		roles,
		members = [],
		enactedMotions = [],
		associationUuid = '',
		canManage = false
	}: Props = $props();

	// UI state
	let expandedNodes = $state(new Set<string>());
	let editingRole = $state<string | null>(null);
	let editingSection = $state<string | null>(null);
	let showNewRoleForm = $state<string | null>(null); // parent role uuid or 'root'
	let showNewSectionForm = $state(false);
	let showImportModal = $state(false);
	let importJson = $state('');
	let importError = $state('');

	// Form state
	let roleForm = $state({
		title: '',
		section_uuid: '',
		reports_to_role_uuid: '',
		description: '',
		compensation_franks: ''
	});

	let sectionForm = $state({
		name: '',
		parent_section_uuid: '',
		description: ''
	});

	// Build role hierarchy
	const roleHierarchy = $derived.by(() => {
		const roleMap = new Map<string, RoleNode>();
		const rootRoles: RoleNode[] = [];

		// Create nodes
		for (const role of roles) {
			roleMap.set(role.uuid, { ...role, children: [] });
		}

		// Build tree
		for (const role of roleMap.values()) {
			if (role.reports_to_role_uuid && roleMap.has(role.reports_to_role_uuid)) {
				roleMap.get(role.reports_to_role_uuid)!.children.push(role);
			} else {
				rootRoles.push(role);
			}
		}

		return rootRoles;
	});

	const sectionMap = $derived.by(() => {
		const map = new Map<string, string>();
		for (const section of sections) {
			map.set(section.uuid, section.name);
		}
		return map;
	});

	function toggleNode(uuid: string) {
		if (expandedNodes.has(uuid)) {
			expandedNodes.delete(uuid);
		} else {
			expandedNodes.add(uuid);
		}
		expandedNodes = new Set(expandedNodes);
	}

	function startEditRole(role: Role) {
		editingRole = role.uuid;
		roleForm = {
			title: role.title,
			section_uuid: role.section_uuid ?? '',
			reports_to_role_uuid: role.reports_to_role_uuid ?? '',
			description: role.description ?? '',
			compensation_franks: role.compensation_franks.toString()
		};
	}

	function startNewRole(parentUuid: string | null = null) {
		showNewRoleForm = parentUuid ?? 'root';
		roleForm = {
			title: '',
			section_uuid: '',
			reports_to_role_uuid: parentUuid ?? '',
			description: '',
			compensation_franks: '0'
		};
	}

	function cancelRoleForm() {
		editingRole = null;
		showNewRoleForm = null;
	}

	function startEditSection(section: Section) {
		editingSection = section.uuid;
		sectionForm = {
			name: section.name,
			parent_section_uuid: section.parent_section_uuid ?? '',
			description: section.description ?? ''
		};
	}

	function startNewSection() {
		showNewSectionForm = true;
		sectionForm = { name: '', parent_section_uuid: '', description: '' };
	}

	function cancelSectionForm() {
		editingSection = null;
		showNewSectionForm = false;
	}

	function formatCompensation(franks: number): string {
		if (franks === 0) return '';
		return `${franks.toLocaleString()}F`;
	}

	async function exportOrgChart() {
		if (!associationUuid) return;

		try {
			const response = await fetch(`/api/org-charts/${associationUuid}/export`);
			if (!response.ok) throw new Error('Export failed');

			const data = await response.json();
			const jsonStr = JSON.stringify(data, null, 2);

			const blob = new Blob([jsonStr], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `org-chart-${associationUuid}-${Date.now()}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export error:', error);
			alert('Failed to export org chart');
		}
	}

	function openImportModal() {
		showImportModal = true;
		importJson = '';
		importError = '';
	}

	function closeImportModal() {
		showImportModal = false;
		importJson = '';
		importError = '';
	}

	async function handleImport() {
		if (!associationUuid) return;

		try {
			const data = JSON.parse(importJson);

			const response = await fetch(`/api/org-charts/${associationUuid}/import`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Import failed');
			}

			window.location.reload();
		} catch (error) {
			importError = error instanceof Error ? error.message : 'Invalid JSON';
		}
	}
</script>

<Card>
	<div class="card-header">
		<h2>🏢 Organization</h2>
		<div class="card-actions">
			{#if canManage}
				<button class="btn btn-sm" onclick={startNewSection}>
					+ Section
				</button>
				<button class="btn btn-sm" onclick={() => startNewRole(null)}>
					+ Role
				</button>
				{#if associationUuid}
					<button class="btn btn-sm" onclick={exportOrgChart}>
						📥 Export
					</button>
					<button class="btn btn-sm" onclick={openImportModal}>
						📤 Import
					</button>
				{/if}
			{/if}
		</div>
	</div>

	{#if showNewSectionForm}
		<div class="form-card">
			<h4>New Section</h4>
			<form
				method="POST"
				action="?/createSection"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							cancelSectionForm();
							await update();
						}
					};
				}}
			>
				<div class="form-group">
					<label for="section-name">Name *</label>
					<input
						id="section-name"
						name="name"
						type="text"
						bind:value={sectionForm.name}
						required
						placeholder="e.g., Health Services"
					/>
				</div>

				<div class="form-group">
					<label for="parent-section">Parent Section</label>
					<select id="parent-section" name="parent_section_uuid" bind:value={sectionForm.parent_section_uuid}>
						<option value="">None (Top Level)</option>
						{#each sections as section}
							<option value={section.uuid}>{section.name}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="section-description">Description</label>
					<textarea
						id="section-description"
						name="description"
						bind:value={sectionForm.description}
						rows="2"
					></textarea>
				</div>

				<div class="form-actions">
					<button type="submit" class="btn-primary">Create Section</button>
					<button type="button" class="btn-secondary" onclick={cancelSectionForm}>Cancel</button>
				</div>
			</form>
		</div>
	{/if}

	{#if showNewRoleForm}
		<div class="form-card">
			<h4>New Role{#if showNewRoleForm !== 'root'} (reports to {roles.find(r => r.uuid === showNewRoleForm)?.title}){/if}</h4>
			<form
				method="POST"
				action="?/createRole"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							cancelRoleForm();
							await update();
						}
					};
				}}
			>
				<input type="hidden" name="reports_to_role_uuid" value={roleForm.reports_to_role_uuid} />

				<div class="form-row">
					<div class="form-group">
						<label for="role-title">Title *</label>
						<input
							id="role-title"
							name="title"
							type="text"
							bind:value={roleForm.title}
							required
							placeholder="e.g., Chief Medical Officer"
						/>
					</div>

					<div class="form-group">
						<label for="role-section">Section</label>
						<select id="role-section" name="section_uuid" bind:value={roleForm.section_uuid}>
							<option value="">None</option>
							{#each sections as section}
								<option value={section.uuid}>{section.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="form-group">
					<label for="role-description">Description</label>
					<textarea
						id="role-description"
						name="description"
						bind:value={roleForm.description}
						rows="2"
					></textarea>
				</div>

				<div class="form-group">
					<label for="role-compensation">Compensation (Franks)</label>
					<input
						id="role-compensation"
						name="compensation_franks"
						type="number"
						bind:value={roleForm.compensation_franks}
						min="0"
					/>
				</div>

				<div class="form-actions">
					<button type="submit" class="btn-primary">Create Role</button>
					<button type="button" class="btn-secondary" onclick={cancelRoleForm}>Cancel</button>
				</div>
			</form>
		</div>
	{/if}

	{#if roleHierarchy.length === 0}
		<p class="empty">No roles defined yet. {#if canManage}Click "+ Role" to get started.{/if}</p>
	{:else}
		<div class="org-chart">
			{#each roleHierarchy as role}
				{@render roleTree(role, 0)}
			{/each}
		</div>
	{/if}
</Card>

{#if showImportModal}
	<div class="modal-overlay" onclick={closeImportModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Import Organization Chart</h3>
				<button class="btn-close" onclick={closeImportModal}>×</button>
			</div>
			<div class="modal-body">
				<p class="modal-description">
					Paste your organization chart JSON below. This will create roles, sections, and templates.
				</p>
				<textarea
					bind:value={importJson}
					placeholder="Paste JSON here..."
					rows="15"
					class="import-textarea"
				></textarea>
				{#if importError}
					<div class="import-error">{importError}</div>
				{/if}
				<div class="modal-actions">
					<button class="btn btn-primary" onclick={handleImport}>Import</button>
					<button class="btn" onclick={closeImportModal}>Cancel</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#snippet roleTree(role: RoleNode, depth: number)}
	<div class="role-node" style="margin-left: {depth * 1.5}rem">
		{#if editingRole === role.uuid}
			<div class="form-card-inline">
				<form
					method="POST"
					action="?/updateRole"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								cancelRoleForm();
								await update();
							}
						};
					}}
				>
					<input type="hidden" name="role_uuid" value={role.uuid} />

					<div class="form-row">

					<div class="form-group">
							<label for="edit-role-title-{role.uuid}">Title *</label>
							<input
								id="edit-role-title-{role.uuid}"
								name="title"
								type="text"
								bind:value={roleForm.title}
								required
							/>
						</div>

						<div class="form-group">
							<label for="edit-role-section-{role.uuid}">Section</label>
							<select id="edit-role-section-{role.uuid}" name="section_uuid" bind:value={roleForm.section_uuid}>
								<option value="">None</option>
								{#each sections as section}
									<option value={section.uuid}>{section.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="form-group">
						<label for="edit-role-description-{role.uuid}">Description</label>
						<textarea
							id="edit-role-description-{role.uuid}"
							name="description"
							bind:value={roleForm.description}
							rows="2"
						></textarea>
					</div>

					<div class="form-group">
						<label for="edit-role-compensation-{role.uuid}">Compensation (Franks)</label>
						<input
							id="edit-role-compensation-{role.uuid}"
							name="compensation_franks"
							type="number"
							bind:value={roleForm.compensation_franks}
							min="0"
						/>
					</div>

					<div class="form-actions">
						<button type="submit" class="btn-primary btn-sm">Save</button>
						<button type="button" class="btn-secondary btn-sm" onclick={cancelRoleForm}>Cancel</button>
					</div>
				</form>
			</div>
		{:else}
			<div class="role-card">
				<div class="role-header">
					<button class="expand-btn" onclick={() => toggleNode(role.uuid)}>
						{expandedNodes.has(role.uuid) ? '▼' : '▶'}
					</button>
					<div class="role-info">
						<h3 class="role-title">{role.title}</h3>
						<div class="role-meta">
							{#if role.section_name || (role.section_uuid && sectionMap.has(role.section_uuid))}
								<span class="meta-badge">
									📋 {role.section_name ?? sectionMap.get(role.section_uuid ?? '')}
								</span>
							{/if}
							{#if role.compensation_franks > 0}
								<span class="meta-badge">💰 {formatCompensation(role.compensation_franks)}</span>
							{/if}
							{#if role.permissions && role.permissions.length > 0}
								<span class="meta-badge">🔑 {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}</span>
							{/if}
						</div>
					</div>
					{#if canManage}
						<div class="role-actions">
							<button class="btn-icon" onclick={() => startEditRole(role)} title="Edit role">
								✏️
							</button>
							<button class="btn-icon" onclick={() => startNewRole(role.uuid)} title="Add child role">
								➕
							</button>
							<form method="POST" action="?/deleteRole" use:enhance={async () => {
							return async ({ update }) => {
								await update();
							};
						}} style="display: inline;">
								<input type="hidden" name="role_uuid" value={role.uuid} />
								<button
									type="submit"
									class="btn-icon btn-danger"
									title="Delete role"
									onclick={(e) => {
										if (!confirm(`Delete "${role.title}"?`)) {
											e.preventDefault();
										}
									}}
								>
									🗑️
								</button>
							</form>
						</div>
					{/if}
				</div>

				{#if expandedNodes.has(role.uuid)}
					<div class="role-expanded">
						{#if role.description}
							<p class="role-description">{role.description}</p>
						{/if}

						<div class="holders-section">
							<h4 class="subsection-title">Holders</h4>
							{#if role.holders && role.holders.length > 0}
								<ul class="holders-list">
									{#each role.holders as holder}
										<li class="holder-item">
											<a href="/organization/people/{holder.uuid}" class="holder-link">
												@{holder.handle}
												{#if holder.given_name || holder.family_name}
													<span class="holder-name">({holder.given_name} {holder.family_name})</span>
												{/if}
											</a>
											{#if canManage && enactedMotions.length > 0}
												<form method="POST" action="?/revokeRole" use:enhance={async () => {
										return async ({ update }) => {
											await update();
										};
									}} class="inline-form">
													<input type="hidden" name="person_uuid" value={holder.uuid} />
													<input type="hidden" name="role_uuid" value={role.uuid} />
													<select name="motion_uuid" class="select-xs" required>
														<option value="">— Motion —</option>
														{#each enactedMotions as m}
															<option value={m.uuid}>[{m.body_name}] {m.title}</option>
														{/each}
													</select>
													<button type="submit" class="btn-revoke">Revoke</button>
												</form>
											{/if}
										</li>
									{/each}
								</ul>
							{:else}
								<p class="no-holders">📋 Vacant</p>
							{/if}

							{#if canManage && members.length > 0 && enactedMotions.length > 0}
								<form method="POST" action="?/assignRole" use:enhance={async () => {
							return async ({ update }) => {
								await update();
							};
						}} class="assign-form">
									<input type="hidden" name="role_uuid" value={role.uuid} />
									<select name="motion_uuid" required class="select-sm">
										<option value="">— Enacted motion —</option>
										{#each enactedMotions as m}
											<option value={m.uuid}>[{m.body_name}] {m.title}</option>
										{/each}
									</select>
									<select name="person_uuid" required class="select-sm">
										<option value="">Assign member…</option>
										{#each members as member}
											{#if !role.holders?.find((h) => h.uuid === member.person?.uuid)}
												<option value={member.person?.uuid}>
													{member.person?.handle ?? member.person_uuid}
												</option>
											{/if}
										{/each}
									</select>
									<button type="submit" class="btn-primary btn-sm">Assign</button>
								</form>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		{#if role.children.length > 0}
			<div class="role-children">
				{#each role.children as child}
					{@render roleTree(child, depth + 1)}
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<style>
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
	}

	.card-header h2 {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 0;
	}

	.card-actions {
		display: flex;
		gap: var(--space-2);
	}

	.btn {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-bg);
		cursor: pointer;
		font-size: var(--text-sm);
		font-family: inherit;
	}

	.btn:hover {
		background: var(--color-surface);
	}

	.btn-sm {
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-xs);
	}

	.btn-primary {
		background: var(--color-accent);
		color: white;
		border-color: var(--color-accent);
	}

	.btn-primary:hover {
		background: var(--color-accent-hover);
	}

	.btn-secondary {
		background: var(--color-surface);
		color: var(--color-text);
	}

	.btn-icon {
		background: none;
		border: none;
		cursor: pointer;
		font-size: var(--text-base);
		padding: var(--space-1);
		opacity: 0.6;
	}

	.btn-icon:hover {
		opacity: 1;
	}

	.btn-danger {
		color: var(--color-danger);
	}

	.form-card,
	.form-card-inline {
		background: var(--color-surface);
		border: 2px solid var(--color-accent);
		border-radius: var(--radius);
		padding: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.form-card h4,
	.form-card-inline h4 {
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-3) 0;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		margin-bottom: var(--space-3);
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-3);
	}

	.form-row .form-group {
		margin-bottom: 0;
	}

	label {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	input[type='text'],
	input[type='number'],
	textarea,
	select {
		padding: var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		background: var(--color-bg);
		font-family: inherit;
	}

	input:focus,
	textarea:focus,
	select:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: 0;
	}

	.form-actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-3);
	}

	.empty {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		padding: var(--space-6) 0;
		text-align: center;
	}

	.org-chart {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.role-node {
		position: relative;
	}

	.role-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-3);
		margin-bottom: var(--space-2);
	}

	.role-header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
	}

	.expand-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: var(--text-sm);
		padding: 0;
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.5;
		flex-shrink: 0;
	}

	.expand-btn:hover {
		opacity: 1;
	}

	.role-info {
		flex: 1;
		min-width: 0;
	}

	.role-title {
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-1) 0;
	}

	.role-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.meta-badge {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 1px var(--space-2);
	}

	.role-actions {
		display: flex;
		gap: var(--space-1);
		align-items: flex-start;
	}

	.role-expanded {
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border);
	}

	.role-description {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-3) 0;
		line-height: 1.5;
	}

	.holders-section {
		margin-top: var(--space-3);
	}

	.subsection-title {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-2) 0;
	}

	.holders-list {
		list-style: none;
		margin: 0 0 var(--space-3) 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.holder-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
	}

	.holder-link {
		color: var(--color-text);
		text-decoration: none;
	}

	.holder-link:hover {
		text-decoration: underline;
	}

	.holder-name {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}

	.no-holders {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-2) 0;
	}

	.inline-form {
		display: inline-flex;
		gap: var(--space-1);
		align-items: center;
	}

	.select-xs {
		font-size: var(--text-xs);
		padding: 1px var(--space-1);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.select-sm {
		font-size: var(--text-sm);
		padding: var(--space-1) var(--space-2);
	}

	.btn-revoke {
		font-size: var(--text-xs);
		padding: 2px var(--space-2);
		background: #fee2e2;
		color: #991b1b;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.btn-revoke:hover {
		background: #fecaca;
	}

	.assign-form {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
		margin-top: var(--space-2);
	}

	.role-children {
		border-left: 2px solid var(--color-border);
		padding-left: var(--space-2);
		margin-left: var(--space-4);
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
		background: var(--color-bg);
		border-radius: var(--radius);
		max-width: 600px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-border);
	}

	.modal-header h3 {
		margin: 0;
		font-size: var(--text-lg);
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
		padding: var(--space-4);
	}

	.modal-description {
		margin: 0 0 var(--space-3) 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.import-textarea {
		width: 100%;
		padding: var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-family: monospace;
		font-size: var(--text-xs);
		resize: vertical;
	}

	.import-error {
		margin: var(--space-2) 0;
		padding: var(--space-3);
		background: #fee;
		border-left: 3px solid var(--color-danger);
		color: var(--color-danger);
		border-radius: var(--radius);
		font-size: var(--text-sm);
	}

	.modal-actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-3);
		justify-content: flex-end;
	}
</style>
