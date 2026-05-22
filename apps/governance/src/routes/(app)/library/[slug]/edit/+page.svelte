<script lang="ts">
	import { PageHeader } from '@bfs/ui';
	import { MotionEditor, GoverningDocEditor } from '@bfs/ui';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import type { MotionDocument, GoverningDocument } from '@bfs/types';

	let { data }: { data: PageData } = $props();

	const docType = data.documentType;
	
	// State for the document being edited
	let document = $state<MotionDocument | GoverningDocument>(
		JSON.parse(JSON.stringify(data.document))
	);
	
	function handleUpdate(updated: MotionDocument | GoverningDocument) {
		document = updated;
	}
</script>

<div class="page">
	<PageHeader 
		title="Edit {docType === 'motion' ? 'Motion' : 'Governing Document'}"
		description={document.title}
	/>

	<form method="POST" action="?/save" use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				goto(`/library/${document.slug}`);
			}
		};
	}}>
		<input type="hidden" name="document" value={JSON.stringify(document)} />
		
		<div class="editor-container">
			{#if docType === 'motion'}
				<MotionEditor 
					motion={document as MotionDocument} 
					onUpdate={handleUpdate}
					readonly={false}
				/>
			{:else if docType === 'governing'}
				<GoverningDocEditor 
					document={document as GoverningDocument} 
					onUpdate={handleUpdate}
					readonly={false}
				/>
			{/if}
		</div>

		<div class="form-actions">
			<button type="button" class="btn" onclick={() => goto(`/library/${document.slug}`)}>
				Cancel
			</button>
			<button type="submit" class="btn btn--primary">
				Save Changes
			</button>
		</div>
	</form>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 900px;
		margin: 0 auto;
		padding-bottom: var(--space-8);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form-section {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}

	.form-section h2 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-lg);
		color: var(--color-text);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
	}

	.section-header h2 {
		margin: 0;
	}

	.form-group {
		margin-bottom: var(--space-4);
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	.form-group label {
		display: block;
		margin-bottom: var(--space-2);
		font-weight: var(--weight-medium);
		color: var(--color-text);
		font-size: var(--text-sm);
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		font-size: var(--text-base);
		font-family: inherit;
	}

	.form-group textarea {
		resize: vertical;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-primary, #3b82f6);
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
	}

	.paragraphs {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.paragraph-editor {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.paragraph-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) var(--space-3);
		background: var(--color-background);
		border-bottom: 1px solid var(--color-border);
	}

	.paragraph-number {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
	}

	.paragraph-actions {
		display: flex;
		gap: var(--space-1);
	}

	.paragraph-editor textarea {
		width: 100%;
		border: none;
		border-radius: 0;
		padding: var(--space-3);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding-top: var(--space-4);
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

	.btn--secondary {
		background: var(--color-background);
	}

	.icon-btn {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--text-base);
		line-height: 1;
		cursor: pointer;
		transition: all 0.15s;
	}

	.icon-btn:hover:not(:disabled) {
		background: var(--color-background);
	}

	.icon-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.icon-btn--danger {
		color: #dc2626;
		font-size: var(--text-xl);
	}

	.icon-btn--danger:hover:not(:disabled) {
		background: #fee2e2;
		border-color: #fca5a5;
	}

	.party-section {
		padding: var(--space-4);
		background: rgba(91, 140, 184, 0.05);
		border: 1px solid rgba(91, 140, 184, 0.2);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-4);
	}

	.party-section h3 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-lg);
		color: var(--color-text);
	}
</style>
