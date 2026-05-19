<script lang="ts">
	import { Card } from '@bfs/ui';
	import SectionCard from './org-chart/SectionCard.svelte';
	import RoleForm from './org-chart/RoleForm.svelte';
	import SectionForm from './org-chart/SectionForm.svelte';
	import ImportExportModal from './org-chart/ImportExportModal.svelte';

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
	let showNewRoleForm = $state<string | null>(null); // parent role uuid or 'root'
	let showNewSectionForm = $state(false);
	let showImportModal = $state(false);
	let newRoleSection = $state<string | null>(null); // section uuid for new role context

	// Build role hierarchy grouped by section
	const rolesBySection = $derived.by(() => {
		// Group roles by section
		const sectionGroups = new Map<string, Role[]>();
		
		for (const role of roles) {
			const sectionKey = role.section_uuid || 'no-section';
			if (!sectionGroups.has(sectionKey)) {
				sectionGroups.set(sectionKey, []);
			}
			sectionGroups.get(sectionKey)!.push(role);
		}

		// Build hierarchy within each section
		const result = new Map<string, RoleNode[]>();
		
		for (const [sectionKey, sectionRoles] of sectionGroups) {
			const roleMap = new Map<string, RoleNode>();
			const rootRoles: RoleNode[] = [];

			// Create nodes for this section
			for (const role of sectionRoles) {
				roleMap.set(role.uuid, { ...role, children: [] });
			}

			// Build tree within section
			for (const role of roleMap.values()) {
				if (role.reports_to_role_uuid && roleMap.has(role.reports_to_role_uuid)) {
					roleMap.get(role.reports_to_role_uuid)!.children.push(role);
				} else {
					rootRoles.push(role);
				}
			}

			result.set(sectionKey, rootRoles);
		}

		return result;
	});

	const sectionMap = $derived.by(() => {
		const map = new Map<string, string>();
		for (const section of sections) {
			map.set(section.uuid, section.name);
		}
		return map;
	});

	function startNewRole(parentUuid: string | null = null) {
		showNewRoleForm = parentUuid ?? 'root';
		// Derive section from parent role if applicable
		if (parentUuid) {
			const parentRole = roles.find((r) => r.uuid === parentUuid);
			newRoleSection = parentRole?.section_uuid ?? null;
		} else {
			newRoleSection = null;
		}
	}

	function cancelRoleForm() {
		showNewRoleForm = null;
		newRoleSection = null;
	}

	function startNewSection() {
		showNewSectionForm = true;
	}

	function cancelSectionForm() {
		showNewSectionForm = false;
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
	}

	function closeImportModal() {
		showImportModal = false;
	}

	// Get parent role name for form display
	function getParentRoleName(): string | undefined {
		if (!showNewRoleForm || showNewRoleForm === 'root') return undefined;
		return roles.find((r) => r.uuid === showNewRoleForm)?.title;
	}

	// Get section name for form display
	function getSectionName(): string | undefined {
		if (!newRoleSection) return undefined;
		return sections.find((s) => s.uuid === newRoleSection)?.name;
	}
</script>

<Card>
	<div class="card-header">
		<h2>Organization</h2>
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
						Export
					</button>
					<button class="btn btn-sm" onclick={openImportModal}>
						Import
					</button>
				{/if}
			{/if}
		</div>
	</div>

	{#if showNewSectionForm}
		<SectionForm {sections} onCancel={cancelSectionForm} />
	{/if}

	{#if showNewRoleForm}
		<RoleForm
			{sections}
			parentRoleUuid={showNewRoleForm === 'root' ? null : showNewRoleForm}
			parentRoleName={getParentRoleName()}
			sectionUuid={newRoleSection}
			sectionName={getSectionName()}
			onCancel={cancelRoleForm}
		/>
	{/if}

	{#if roles.length === 0}
		<p class="empty">No roles defined yet. {#if canManage}Click "+ Role" to get started.{/if}</p>
	{:else}
		<!-- Sections with roles -->
		{#each sections as section}
			{#if rolesBySection.has(section.uuid)}
				<SectionCard
					title={section.name}
					description={section.description}
					roles={rolesBySection.get(section.uuid) ?? []}
					{canManage}
					onAddChild={startNewRole}
				/>
			{/if}
		{/each}

		<!-- Roles with no section -->
		{#if rolesBySection.has('no-section')}
			<SectionCard
				title="Unassigned Roles"
				roles={rolesBySection.get('no-section') ?? []}
				{canManage}
				onAddChild={startNewRole}
			/>
		{/if}
	{/if}
</Card>

<ImportExportModal show={showImportModal} onClose={closeImportModal} />

<style>
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
	}

	.card-header h2 {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0;
	}

	.card-actions {
		display: flex;
		gap: var(--space-2);
	}

	.btn {
		padding: var(--space-2) var(--space-3);
		border: 1px solid rgba(45, 90, 79, 0.2);
		background: rgba(250, 250, 247, 0.5);
		cursor: pointer;
		font-size: var(--text-sm);
		font-family: 'Libre Baskerville', Georgia, serif;
		color: #151c1a;
	}

	.btn:hover {
		background: var(--paper);
		border-color: #7a5c1a;
	}

	.btn-sm {
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-xs);
	}

	.empty {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		font-style: italic;
		color: #374340;
		padding: var(--space-6) 0;
		text-align: center;
	}
</style>
