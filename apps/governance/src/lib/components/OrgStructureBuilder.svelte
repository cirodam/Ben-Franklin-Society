<script lang="ts">
	import { enhance } from '$app/forms';

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
		reports_to_role_uuid: string | null;
		description: string | null;
		compensation_franks: number;
	};

	let { sections, roles }: { sections: Section[]; roles: Role[] } = $props();

	// UI state
	let showSectionForm = $state(false);
	let showRoleForm = $state(false);
	let editingSection = $state<Section | null>(null);
	let editingRole = $state<Role | null>(null);

	// Form state
	let sectionForm = $state({
		name: '',
		parent_section_uuid: '',
		description: ''
	});

	let roleForm = $state({
		title: '',
		section_uuid: '',
		reports_to_role_uuid: '',
		description: '',
		compensation_franks: ''
	});

	function startNewSection() {
		editingSection = null;
		sectionForm = { name: '', parent_section_uuid: '', description: '' };
		showSectionForm = true;
	}

	function startEditSection(section: Section) {
		editingSection = section;
		sectionForm = {
			name: section.name,
			parent_section_uuid: section.parent_section_uuid ?? '',
			description: section.description ?? ''
		};
		showSectionForm = true;
	}

	function startNewRole() {
		editingRole = null;
		roleForm = {
			title: '',
			section_uuid: '',
			reports_to_role_uuid: '',
			description: '',
			compensation_franks: ''
		};
		showRoleForm = true;
	}

	function startEditRole(role: Role) {
		editingRole = role;
		roleForm = {
			title: role.title,
			section_uuid: role.section_uuid ?? '',
			reports_to_role_uuid: role.reports_to_role_uuid ?? '',
			description: role.description ?? '',
			compensation_franks: role.compensation_franks.toString()
		};
		showRoleForm = true;
	}

	function cancelForm() {
		showSectionForm = false;
		showRoleForm = false;
		editingSection = null;
		editingRole = null;
	}

	// Hierarchical displays
	const rootSections = $derived(sections.filter(s => !s.parent_section_uuid));
	const childSectionsMap = $derived.by(() => {
		const map = new Map<string, Section[]>();
		for (const section of sections) {
			if (section.parent_section_uuid) {
				if (!map.has(section.parent_section_uuid)) {
					map.set(section.parent_section_uuid, []);
				}
				map.get(section.parent_section_uuid)!.push(section);
			}
		}
		return map;
	});

	const rootRoles = $derived(roles.filter(r => !r.reports_to_role_uuid));
	const childRolesMap = $derived.by(() => {
		const map = new Map<string, Role[]>();
		for (const role of roles) {
			if (role.reports_to_role_uuid) {
				if (!map.has(role.reports_to_role_uuid)) {
					map.set(role.reports_to_role_uuid, []);
				}
				map.get(role.reports_to_role_uuid)!.push(role);
			}
		}
		return map;
	});

	const sectionNameMap = $derived.by(() => {
		const map = new Map<string, string>();
		for (const section of sections) {
			map.set(section.uuid, section.name);
		}
		return map;
	});
</script>

<div class="builder">
	<div class="builder-section">
		<div class="section-header">
			<h3>📂 Sections</h3>
			<button class="btn-primary btn-sm" onclick={startNewSection}>
				+ Add Section
			</button>
		</div>

		{#if showSectionForm}
			<div class="form-card">
				<h4>{editingSection ? 'Edit Section' : 'New Section'}</h4>
				<form 
					method="POST" 
					action="?/{editingSection ? 'updateSection' : 'createSection'}"
					use:enhance={() => {
						return async ({ result }) => {
							if (result.type === 'success') {
								cancelForm();
							}
						};
					}}
				>
					{#if editingSection}
						<input type="hidden" name="section_uuid" value={editingSection.uuid} />
					{/if}

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
							{#each sections.filter(s => s.uuid !== editingSection?.uuid) as section}
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
							rows="3"
						></textarea>
					</div>

					<div class="form-actions">
						<button type="submit" class="btn-primary">
							{editingSection ? 'Update' : 'Create'} Section
						</button>
						<button type="button" class="btn-secondary" onclick={cancelForm}>
							Cancel
						</button>
					</div>
				</form>
			</div>
		{/if}

		<div class="items-list">
			{#each rootSections as section}
				<div class="item-card">
					<div class="item-header">
						<strong>{section.name}</strong>
						<div class="item-actions">
							<button class="btn-sm btn-ghost" onclick={() => startEditSection(section)}>
								✏️ Edit
							</button>
							<form method="POST" action="?/deleteSection" use:enhance>
								<input type="hidden" name="section_uuid" value={section.uuid} />
								<button 
									type="submit" 
									class="btn-sm btn-danger-ghost"
									onclick={(e) => {
										if (!confirm(`Delete "${section.name}"? This will also remove child sections.`)) {
											e.preventDefault();
										}
									}}
								>
									🗑️
								</button>
							</form>
						</div>
					</div>
					{#if section.description}
						<p class="item-description">{section.description}</p>
					{/if}

					{#if childSectionsMap.has(section.uuid)}
						<div class="child-items">
							{#each childSectionsMap.get(section.uuid) ?? [] as child}
								<div class="child-item">
									<div class="item-header">
										<span>↳ {child.name}</span>
										<div class="item-actions">
											<button class="btn-sm btn-ghost" onclick={() => startEditSection(child)}>
												✏️
											</button>
											<form method="POST" action="?/deleteSection" use:enhance>
												<input type="hidden" name="section_uuid" value={child.uuid} />
												<button 
													type="submit" 
													class="btn-sm btn-danger-ghost"
													onclick={(e) => {
														if (!confirm(`Delete "${child.name}"?`)) {
															e.preventDefault();
														}
													}}
												>
													🗑️
												</button>
											</form>
										</div>
									</div>
								{#if child.description}
									<p class="item-description">{child.description}</p>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<div class="builder-section">
		<div class="section-header">
			<h3>👔 Roles</h3>
			<button class="btn-primary btn-sm" onclick={startNewRole}>
				+ Add Role
			</button>
		</div>

		{#if showRoleForm}
			<div class="form-card">
				<h4>{editingRole ? 'Edit Role' : 'New Role'}</h4>
				<form 
					method="POST" 
					action="?/{editingRole ? 'updateRole' : 'createRole'}"
					use:enhance={() => {
						return async ({ result }) => {
							if (result.type === 'success') {
								cancelForm();
							}
						};
					}}
				>
					{#if editingRole}
						<input type="hidden" name="role_uuid" value={editingRole.uuid} />
					{/if}

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
						<label for="reports-to-role">Reports To (Parent Role)</label>
						<select id="reports-to-role" name="reports_to_role_uuid" bind:value={roleForm.reports_to_role_uuid}>
							<option value="">None</option>
							{#each roles.filter(r => r.uuid !== editingRole?.uuid) as role}
								<option value={role.uuid}>
									{role.title}
									{#if role.section_uuid && sectionNameMap.has(role.section_uuid)}
										({sectionNameMap.get(role.section_uuid)})
									{/if}
								</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="role-description">Description</label>
						<textarea 
							id="role-description"
							name="description" 
							bind:value={roleForm.description}
							placeholder="Describe responsibilities and duties..."
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
							placeholder="0"
							min="0"
						/>
					</div>

					<div class="form-actions">
						<button type="submit" class="btn-primary">
							{editingRole ? 'Update' : 'Create'} Role
						</button>
						<button type="button" class="btn-secondary" onclick={cancelForm}>
							Cancel
						</button>
					</div>
				</form>
			</div>
		{/if}

		<div class="items-list">
			{#each rootRoles as role}
				<div class="item-card">
					<div class="item-header">
						<div>
							<strong>{role.title}</strong>
							{#if role.section_uuid && sectionNameMap.has(role.section_uuid)}
								<span class="badge">{sectionNameMap.get(role.section_uuid)}</span>
							{/if}
						</div>
						<div class="item-actions">
							<button class="btn-sm btn-ghost" onclick={() => startEditRole(role)}>
								✏️ Edit
							</button>
							<form method="POST" action="?/deleteRole" use:enhance>
								<input type="hidden" name="role_uuid" value={role.uuid} />
								<button 
									type="submit" 
									class="btn-sm btn-danger-ghost"
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
					</div>
					
					<div class="role-details">
						{#if role.description}
							<p class="item-description">{role.description}</p>
						{/if}
						{#if role.compensation_franks > 0}
							<div class="role-meta">
								<span class="meta-item">Compensation: {role.compensation_franks.toLocaleString()}F</span>
							</div>
						{/if}
					</div>

					{#if childRolesMap.has(role.uuid)}
						<div class="child-items">
							{#each childRolesMap.get(role.uuid) ?? [] as child}
								<div class="child-item">
									<div class="item-header">
										<div>
											<span>↳ {child.title}</span>
											{#if child.section_uuid && sectionNameMap.has(child.section_uuid)}
												<span class="badge badge-sm">{sectionNameMap.get(child.section_uuid)}</span>
											{/if}
										</div>
										<div class="item-actions">
											<button class="btn-sm btn-ghost" onclick={() => startEditRole(child)}>
												✏️
											</button>
											<form method="POST" action="?/deleteRole" use:enhance>
												<input type="hidden" name="role_uuid" value={child.uuid} />
												<button 
													type="submit" 
													class="btn-sm btn-danger-ghost"
													onclick={(e) => {
														if (!confirm(`Delete "${child.title}"?`)) {
															e.preventDefault();
														}
													}}
												>
													🗑️
												</button>
											</form>
										</div>
									</div>
									{#if child.description}
										<p class="item-description">{child.description}</p>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.builder {
		display: grid;
		gap: var(--space-8);
	}

	.builder-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-header h3 {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 0;
	}

	.form-card {
		background: var(--color-surface);
		border: 2px solid var(--color-accent);
		border-radius: var(--radius);
		padding: var(--space-6);
	}

	.form-card h4 {
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-4) 0;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
	}

	.form-row .form-group {
		margin-bottom: 0;
	}

	label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	input[type="text"],
	input[type="number"],
	textarea,
	select {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		background: var(--color-bg);
	}

	input:focus,
	textarea:focus,
	select:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: 0;
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-6);
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.item-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-4);
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
	}

	.item-actions {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}

	.item-actions form {
		display: inline;
	}

	.item-description {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: var(--space-2) 0 0 0;
		line-height: 1.5;
	}

	.child-items {
		margin-top: var(--space-3);
		margin-left: var(--space-4);
		padding-left: var(--space-4);
		border-left: 2px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.child-item {
		background: var(--color-bg);
		border-radius: var(--radius);
		padding: var(--space-3);
	}

	.role-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.role-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.meta-item {
		background: var(--color-bg);
		padding: 2px var(--space-2);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
	}

	.badge {
		font-size: var(--text-xs);
		padding: 2px var(--space-2);
		background: var(--color-accent-subtle);
		border: 1px solid var(--color-accent);
		border-radius: var(--radius-sm);
		color: var(--color-accent);
	}

	.badge-sm {
		font-size: 10px;
		padding: 1px 6px;
	}

	.btn-primary {
		background: var(--color-accent);
		color: white;
		border: none;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
	}

	.btn-primary:hover {
		background: var(--color-accent-hover);
	}

	.btn-secondary {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		cursor: pointer;
	}

	.btn-secondary:hover {
		background: var(--color-bg);
	}

	.btn-sm {
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-xs);
	}

	.btn-ghost {
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--color-text-muted);
	}

	.btn-ghost:hover {
		color: var(--color-text);
	}

	.btn-danger-ghost {
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--color-danger);
	}

	.btn-danger-ghost:hover {
		color: var(--color-danger-hover);
	}
</style>
