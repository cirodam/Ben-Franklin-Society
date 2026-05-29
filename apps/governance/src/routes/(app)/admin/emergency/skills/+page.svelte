<script lang="ts">
	import { enhance } from '$app/forms';
	import DataTable from '@bfs/ui/src/DataTable.svelte';
	import { Badge, Button, Card, Input, Modal, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let editingSkill = $state<any>(null);

	const columns = [
		{ key: 'name' as const, label: 'Skill Name', width: '250px' },
		{ key: 'category' as const, label: 'Category', width: '150px' },
		{ key: 'description' as const, label: 'Description' },
		{ key: 'actions' as const, label: 'Actions', width: '150px' }
	];

	function openEdit(skill: any) {
		editingSkill = skill;
		showEditModal = true;
	}
</script>

<div class="page">
	<PageHeader title="Emergency Skills Management">
		{#snippet actions()}
			<Button variant="primary" size="sm" onclick={() => showAddModal = true}>+ Add Skill</Button>
		{/snippet}
	</PageHeader>

	<Card>
		<h2 class="section-title">Active Skills ({data.activeSkills.length})</h2>
		<DataTable {columns} rows={data.activeSkills} rowKey="uuid" empty="No active skills. Add your first skill to get started.">
			{#snippet row(skill)}
				<tr>
					<td><strong>{skill.name}</strong></td>
					<td>{skill.category || '—'}</td>
					<td class="description">{skill.description || '—'}</td>
					<td>
						<div class="actions">
							<Button size="xs" variant="ghost" onclick={() => openEdit(skill)}>Edit</Button>
							<form method="POST" action="?/deactivate" use:enhance>
								<input type="hidden" name="uuid" value={skill.uuid} />
								<Button size="xs" variant="danger-ghost" type="submit">Deactivate</Button>
							</form>
						</div>
					</td>
				</tr>
			{/snippet}
		</DataTable>
	</Card>

	{#if data.inactiveSkills.length > 0}
		<Card>
			<h2 class="section-title">Inactive Skills ({data.inactiveSkills.length})</h2>
			<DataTable {columns} rows={data.inactiveSkills} rowKey="uuid" empty="">
				{#snippet row(skill)}
					<tr class="inactive-row">
						<td><strong>{skill.name}</strong></td>
						<td>{skill.category || '—'}</td>
						<td class="description">{skill.description || '—'}</td>
						<td>
							<Badge label="Inactive" variant="warning" />
						</td>
					</tr>
				{/snippet}
			</DataTable>
		</Card>
	{/if}
</div>

<!-- Add Skill Modal -->
<Modal bind:open={showAddModal} title="Add Emergency Skill" size="md">
	<form method="POST" action="?/create" use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				showAddModal = false;
			}
		};
	}}>
		<div class="modal-content">
			<Input
				name="name"
				label="Skill Name"
				type="text"
				required
				placeholder="e.g., First Aid, Carpentry, HAM Radio Operation"
				hint="Clear, concise name for the skill"
			/>

			<Input
				name="category"
				label="Category"
				type="text"
				placeholder="e.g., Medical, Construction, Communication"
				hint="Optional grouping category"
			/>

			<Input
				name="description"
				label="Description"
				type="text"
				placeholder="e.g., Basic first aid and CPR certification"
				hint="Optional additional details"
			/>
		</div>

		<div class="modal-actions">
			<Button variant="ghost" type="button" onclick={() => showAddModal = false}>Cancel</Button>
			<Button type="submit">Add Skill</Button>
		</div>
	</form>
</Modal>

<!-- Edit Skill Modal -->
{#if editingSkill}
	<Modal bind:open={showEditModal} title="Edit {editingSkill.name}" size="md">
		<form method="POST" action="?/update" use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success') {
					showEditModal = false;
					editingSkill = null;
				}
			};
		}}>
			<input type="hidden" name="uuid" value={editingSkill.uuid} />
			
			<div class="modal-content">
				<Input
					name="name"
					label="Skill Name"
					type="text"
					required
					value={editingSkill.name}
					placeholder="e.g., First Aid, Carpentry, HAM Radio Operation"
					hint="Clear, concise name for the skill"
				/>

				<Input
					name="category"
					label="Category"
					type="text"
					value={editingSkill.category || ''}
					placeholder="e.g., Medical, Construction, Communication"
					hint="Optional grouping category"
				/>

				<Input
					name="description"
					label="Description"
					type="text"
					value={editingSkill.description || ''}
					placeholder="e.g., Basic first aid and CPR certification"
					hint="Optional additional details"
				/>
			</div>

			<div class="modal-actions">
				<Button variant="ghost" type="button" onclick={() => showEditModal = false}>Cancel</Button>
				<Button type="submit">Save Changes</Button>
			</div>
		</form>
	</Modal>
{/if}

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 1200px;
		margin: 0 auto;
	}

	.section-title {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin-bottom: var(--space-4);
	}

	.description {
		max-width: 400px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.actions {
		display: flex;
		gap: var(--space-2);
	}

	.inactive-row {
		opacity: 0.6;
	}

	.modal-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4) 0;
	}

	.modal-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-4);
		border-top: 1px solid var(--border);
	}
</style>
