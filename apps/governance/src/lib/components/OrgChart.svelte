<script lang="ts">
	import { Card } from '@bfs/ui';

	type RoleNode = {
		uuid: string;
		title: string;
		section_name: string | null;
		compensation_franks: number;
		holders?: Array<{ uuid: string; handle: string; given_name: string; family_name: string }>;
		children: RoleNode[];
	};

	interface Props {
		roleHierarchy: RoleNode[];
		associationUuid?: string;
		canManage?: boolean;
	}

	let { roleHierarchy, associationUuid = '', canManage = false }: Props = $props();

	let showImportModal = $state(false);
	let importJson = $state('');
	let importError = $state('');

	function formatSection(sectionName: string | null): string {
		if (!sectionName) return '';
		if (sectionName === 'Assembly' || sectionName === 'Committee' || sectionName === 'Support') {
			return sectionName; // Don't add "Section" to body sections
		}
		return `${sectionName} Section`;
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
			
			// Create download
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
			// Validate JSON
			const data = JSON.parse(importJson);
			
			// Send to server
			const response = await fetch(`/api/org-charts/${associationUuid}/import`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Import failed');
			}
			
			// Reload page to show new data
			window.location.reload();
		} catch (error) {
			importError = error instanceof Error ? error.message : 'Invalid JSON';
		}
	}
</script>

{#if roleHierarchy.length > 0}
	<Card>
		<div class="card-header">
			<h2>Organization</h2>
			{#if canManage && associationUuid}
				<div class="card-actions">
					<button class="btn btn-sm" onclick={exportOrgChart}>
						📥 Export JSON
					</button>
					<button class="btn btn-sm" onclick={openImportModal}>
						📤 Import JSON
					</button>
				</div>
			{/if}
		</div>
		<div class="org-chart">
			{#each roleHierarchy as role}
				{@render roleTree(role, 0)}
			{/each}
		</div>
	</Card>
{/if}

{#if showImportModal}
	<div class="modal-overlay" onclick={closeImportModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Import Organization Chart</h3>
				<button class="btn-close" onclick={closeImportModal}>×</button>
			</div>
			<div class="modal-body">
				<p class="modal-description">
					Paste your organization chart JSON below. This will create roles, sections, and templates as defined in the JSON.
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
					<button class="btn btn-primary" onclick={handleImport}>
						Import
					</button>
					<button class="btn" onclick={closeImportModal}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#snippet roleTree(role: RoleNode, depth: number)}
	<div class="role-node" style="margin-left: {depth * 2}rem">
		<div class="role-card">
			<div class="role-header">
				<h3 class="role-name">{role.title}</h3>
			</div>
			<div class="role-details">
				{#if role.section_name}
					<span class="role-division">{formatSection(role.section_name)}</span>
				{/if}
				{#if role.compensation_franks > 0}
					<span class="role-comp">{formatCompensation(role.compensation_franks)}</span>
				{/if}
				{#if role.holders && role.holders.length > 0}
					<span class="role-holder">👤 {role.holders.map(h => `${h.given_name} ${h.family_name}`).join(', ')}</span>
				{:else}
					<span class="role-vacant">📋 Vacant</span>
				{/if}
			</div>
		</div>
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

	:global(.card h2) {
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		margin: 0;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border, #ccc);
		border-radius: 0.25rem;
		background: var(--color-bg, #fff);
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

	.btn:hover {
		opacity: 0.9;
	}

	.org-chart {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
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
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.role-name {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		margin: 0;
		color: var(--color-text);
	}

	.role-level {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		padding: 1px 8px;
	}

	.role-details {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.role-division::before {
		content: '📋 ';
	}

	.role-comp::before {
		content: '💰 ';
	}

	.role-holder {
		color: var(--color-success, #28a745);
		font-weight: var(--weight-medium);
	}

	.role-vacant {
		color: var(--color-warning, #ffc107);
		font-weight: var(--weight-medium);
	}

	.role-term::before {
		content: '⏱️ ';
	}

	.role-children {
		border-left: 2px solid var(--color-border);
		padding-left: var(--space-3);
		margin-left: var(--space-2);
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
		background: var(--color-bg, #fff);
		border-radius: 0.5rem;
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
		padding: 1rem;
		border-bottom: 1px solid var(--color-border, #e0e0e0);
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

	.modal-description {
		margin: 0 0 1rem 0;
		color: var(--color-text-muted, #666);
		font-size: 0.9rem;
	}

	.import-textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border, #ccc);
		border-radius: 0.25rem;
		font-family: monospace;
		font-size: 0.85rem;
		resize: vertical;
	}

	.import-error {
		margin: 0.5rem 0;
		padding: 0.75rem;
		background: var(--color-danger-light, #fee);
		border-left: 3px solid var(--color-danger, #dc3545);
		color: var(--color-danger, #dc3545);
		border-radius: 0.25rem;
		font-size: 0.9rem;
	}

	.modal-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		justify-content: flex-end;
	}
</style>
