<script lang="ts">
	import { EmptyState, List, ListItem, PageHeader } from '@bfs/ui';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import { documentTypes } from '$lib/documents';
	import LibraryStats from './LibraryStats.svelte';
	import LibraryFilters from './LibraryFilters.svelte';
	import CreateDocumentDialog from './CreateDocumentDialog.svelte';

	let { data }: { data: PageData } = $props();

	let query = $state(data.filters.query);
	let typeFilter = $state<string[]>(data.filters.types);
	let statusFilter = $state<string>(data.filters.status);
	let ownerFilter = $state<string>(data.filters.owner);
	
	let showCreateDialog = $state(false);
	let deleteConfirm = $state<string | null>(null); // UUID of document to delete
	
	async function handleDelete(uuid: string) {
		const formData = new FormData();
		formData.append('uuid', uuid);
		
		const response = await fetch('?/delete', {
			method: 'POST',
			body: formData
		});
		
		if (response.ok) {
			// Reload the page to show updated list
			window.location.reload();
		}
	}

	const allTypes = documentTypes.getAllTypes();

	// Update URL when filters change
	function updateFilters() {
		const params = new URLSearchParams();
		if (typeFilter.length > 0 && typeFilter.length < allTypes.length) {
			params.set('type', typeFilter.join(','));
		}
		if (statusFilter !== 'all') {
			params.set('status', statusFilter);
		}
		if (query.trim()) {
			params.set('q', query.trim());
		}
		if (ownerFilter !== 'mine') {
			params.set('owner', ownerFilter);
		}
		const url = params.toString() ? `?${params}` : '';
		goto(`/library${url}`, { replaceState: true, keepFocus: true });
	}

	function toggleType(type: string) {
		if (typeFilter.includes(type)) {
			typeFilter = typeFilter.filter(t => t !== type);
		} else {
			typeFilter = [...typeFilter, type];
		}
		updateFilters();
	}
</script>

<div class="page">
	<PageHeader 
		title="Library"
		description="Browse the society's governing documents, motions, and other records"
	/>
	
	<LibraryStats stats={data.stats} />

	<section class="browse-section">
		<LibraryFilters
			bind:query
			{typeFilter}
			{statusFilter}
			{ownerFilter}
			items={data.items}
			stats={data.stats}
			onQueryChange={updateFilters}
			onTypeToggle={toggleType}
			onStatusChange={(s) => { statusFilter = s; updateFilters(); }}
			onOwnerChange={(o) => { ownerFilter = o; updateFilters(); }}
			onCreateClick={() => showCreateDialog = true}
		/>

		{#if data.items.length === 0}
			<EmptyState 
				icon="🔍"
				title="No documents match your search"
			/>
		{:else}
			<List>
				{#each data.items as item}
					<div class="list-item-wrapper">
						<ListItem href={documentTypes.getDetailRoute(item)}>
							<div class="doc-item__main">
								<div class="doc-item__title-row">
									<span class="doc-item__icon">{documentTypes.getIcon(item.type)}</span>
									<span class="doc-item__title">{item.title}</span>
								</div>
								<code class="doc-item__slug">{item.slug}</code>
							</div>
							<div class="doc-item__meta">
								<span class="type-badge">{documentTypes.getSubtitle(item)}</span>
								{#if item.metadata.status}
									<span class="status-badge {documentTypes.getStatusClass(item, item.metadata.status)}">{item.metadata.status}</span>
								{/if}
								<span class="doc-item__date">
									{new Date(item.updated_at).toLocaleDateString()}
								</span>
							</div>
						</ListItem>
						{#if item.owner_uuid === data.person?.uuid && item.type === 'prose'}
							<div class="item-actions">
								<a href="/library/{item.slug}/edit" class="action-btn action-btn--edit" onclick={(e) => e.stopPropagation()}>
									✎
								</a>
								{#if deleteConfirm === item.uuid}
									<button class="action-btn action-btn--confirm" onclick={() => handleDelete(item.uuid)}>
										✓
									</button>
									<button class="action-btn action-btn--cancel" onclick={() => deleteConfirm = null}>
										×
									</button>
								{:else}
									<button class="action-btn action-btn--delete" onclick={() => deleteConfirm = item.uuid}>
										🗑
									</button>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</List>
		{/if}
	</section>
</div>

<CreateDocumentDialog 
	bind:open={showCreateDialog}
	person={data.person}
	onClose={() => showCreateDialog = false}
/>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.browse-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.doc-item__main {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		min-width: 0;
	}

	.doc-item__title-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.doc-item__icon {
		font-size: var(--text-lg);
		flex-shrink: 0;
	}

	.doc-item__title {
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	.doc-item__slug {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.doc-item__meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.doc-item__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.type-badge {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		text-transform: capitalize;
	}

	.status-badge {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		text-transform: capitalize;
	}

	.status--draft { background: #f3f4f6; color: #374151; }
	.status--introduced { background: #dbeafe; color: #1e40af; }
	.status--deliberation { background: #fef3c7; color: #92400e; }
	.status--adopted,
	.status--enacted { background: #d1fae5; color: #065f46; }
	.status--rejected,
	.status--withdrawn,
	.status--repealed { background: #fee2e2; color: #991b1b; }

	.seniority-badge {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
	}

	.seniority--1 { background: #fef3c7; color: #92400e; } /* Charter */
	.seniority--2 { background: #dbeafe; color: #1e40af; } /* Constitution */
	.seniority--3 { background: #e0e7ff; color: #3730a3; } /* Bylaw */
	.seniority--4 { background: #f3e8ff; color: #6b21a8; } /* Ordinance */
	.seniority--5 { background: #fce7f3; color: #9f1239; } /* Regulation */
	.seniority--6 { background: #f3f4f6; color: #374151; } /* Policy */

	/* List item actions */
	.list-item-wrapper {
		position: relative;
	}

	.item-actions {
		position: absolute;
		top: 50%;
		right: var(--space-4);
		transform: translateY(-50%);
		display: flex;
		gap: var(--space-2);
		z-index: 10;
	}

	.action-btn {
		padding: var(--space-2);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--text-sm);
		cursor: pointer;
		transition: all 0.15s;
		text-decoration: none;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
	}

	.action-btn:hover {
		background: var(--color-background);
	}

	.action-btn--edit {
		color: #3b82f6;
		border-color: #3b82f6;
	}

	.action-btn--edit:hover {
		background: #eff6ff;
	}

	.action-btn--delete {
		color: #dc2626;
		border-color: #fca5a5;
	}

	.action-btn--delete:hover {
		background: #fee2e2;
		border-color: #dc2626;
	}

	.action-btn--confirm {
		color: #059669;
		border-color: #059669;
	}

	.action-btn--confirm:hover {
		background: #d1fae5;
	}

	.action-btn--cancel {
		color: #6b7280;
		border-color: #d1d5db;
	}

	.action-btn--cancel:hover {
		background: #f3f4f6;
	}

	/* Modal styles */
	.modal-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: var(--space-4);
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		border: none;
		cursor: pointer;
		z-index: 1000;
	}

	.modal {
		position: relative;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		max-width: 500px;
		width: 100%;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		z-index: 1001;
	}

	.modal h2 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-xl);
		color: var(--color-text);
	}

	.form-group {
		margin-bottom: var(--space-4);
	}

	.form-group label {
		display: block;
		margin-bottom: var(--space-2);
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		font-size: var(--text-base);
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: var(--color-primary, #3b82f6);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		margin-top: var(--space-6);
	}

	.btn {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn:hover {
		background: var(--color-background);
	}

	.btn--primary {
		background: var(--color-primary, #3b82f6);
		color: white;
		border-color: var(--color-primary, #3b82f6);
	}

	.btn--primary:hover {
		background: var(--color-primary-dark, #2563eb);
	}
</style>

