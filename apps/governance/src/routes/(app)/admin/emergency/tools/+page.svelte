<script lang="ts">
	import { enhance } from '$app/forms';
	import DataTable from '@bfs/ui/src/DataTable.svelte';
	import { Badge, Button, Card, Input, Modal, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let editingTool = $state<any>(null);

	const columns = [
		{ key: 'name' as const, label: 'Tool/Equipment Name', width: '250px' },
		{ key: 'category' as const, label: 'Category', width: '150px' },
		{ key: 'description' as const, label: 'Description' },
		{ key: 'actions' as const, label: 'Actions', width: '150px' }
	];

	function openEdit(tool: any) {
		editingTool = tool;
		showEditModal = true;
	}
</script>

<div class="page">
	<PageHeader title="Emergency Tools & Equipment Management">
		{#snippet actions()}
			<Button variant="primary" size="sm" onclick={() => showAddModal = true}>+ Add Tool</Button>
		{/snippet}
	</PageHeader>

	<Card>
		<h2 class="section-title">Active Tools & Equipment ({data.activeTools.length})</h2>
		<DataTable {columns} rows={data.activeTools} rowKey="uuid" empty="No active tools. Add your first tool to get started.">
			{#snippet row(tool)}
				<tr>
					<td><strong>{tool.name}</strong></td>
					<td>{tool.category || '—'}</td>
					<td class="description">{tool.description || '—'}</td>
					<td>
						<div class="actions">
							<Button size="xs" variant="ghost" onclick={() => openEdit(tool)}>Edit</Button>
							<form method="POST" action="?/deactivate" use:enhance>
								<input type="hidden" name="uuid" value={tool.uuid} />
								<Button size="xs" variant="danger-ghost" type="submit">Deactivate</Button>
							</form>
						</div>
					</td>
				</tr>
			{/snippet}
		</DataTable>
	</Card>

	{#if data.inactiveTools.length > 0}
		<Card>
			<h2 class="section-title">Inactive Tools & Equipment ({data.inactiveTools.length})</h2>
			<DataTable {columns} rows={data.inactiveTools} rowKey="uuid" empty="">
				{#snippet row(tool)}
					<tr class="inactive-row">
						<td><strong>{tool.name}</strong></td>
						<td>{tool.category || '—'}</td>
						<td class="description">{tool.description || '—'}</td>
						<td>
							<Badge label="Inactive" variant="warning" />
						</td>
					</tr>
				{/snippet}
			</DataTable>
		</Card>
	{/if}
</div>

<!-- Add Tool Modal -->
<Modal bind:open={showAddModal} title="Add Emergency Tool/Equipment" size="md">
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
				label="Tool/Equipment Name"
				type="text"
				required
				placeholder="e.g., Chainsaw, Generator, Water Filter"
				hint="Clear, concise name for the tool or equipment"
			/>

			<Input
				name="category"
				label="Category"
				type="text"
				placeholder="e.g., Power, Tools, Medical, Communication"
				hint="Optional grouping category"
			/>

			<Input
				name="description"
				label="Description"
				type="text"
				placeholder="e.g., Gasoline-powered 5000W portable generator"
				hint="Optional additional details"
			/>
		</div>

		<div class="modal-actions">
			<Button variant="ghost" type="button" onclick={() => showAddModal = false}>Cancel</Button>
			<Button type="submit">Add Tool</Button>
		</div>
	</form>
</Modal>

<!-- Edit Tool Modal -->
{#if editingTool}
	<Modal bind:open={showEditModal} title="Edit {editingTool.name}" size="md">
		<form method="POST" action="?/update" use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success') {
					showEditModal = false;
					editingTool = null;
				}
			};
		}}>
			<input type="hidden" name="uuid" value={editingTool.uuid} />
			
			<div class="modal-content">
				<Input
					name="name"
					label="Tool/Equipment Name"
					type="text"
					required
					value={editingTool.name}
					placeholder="e.g., Chainsaw, Generator, Water Filter"
					hint="Clear, concise name for the tool or equipment"
				/>

				<Input
					name="category"
					label="Category"
					type="text"
					value={editingTool.category || ''}
					placeholder="e.g., Power, Tools, Medical, Communication"
					hint="Optional grouping category"
				/>

				<Input
					name="description"
					label="Description"
					type="text"
					value={editingTool.description || ''}
					placeholder="e.g., Gasoline-powered 5000W portable generator"
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
