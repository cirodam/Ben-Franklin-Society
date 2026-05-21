<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@bfs/ui';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';

	interface Template {
		uuid: string;
		name: string;
		subject: string;
		body: string;
	}

	let {
		template,
		showPreview = false,
		onTogglePreview,
		onEdit
	}: {
		template: Template;
		showPreview?: boolean;
		onTogglePreview: () => void;
		onEdit: () => void;
	} = $props();
</script>

<div class="template-card">
	<div class="template-header">
		<h3>{template.name}</h3>
		<div class="template-actions">
			<Button size="sm" variant="secondary" onclick={onTogglePreview}>
				{showPreview ? 'Hide' : 'Preview'}
			</Button>
			<Button size="sm" onclick={onEdit}>Edit</Button>
			<form method="POST" action="?/delete" use:enhance>
				<input type="hidden" name="uuid" value={template.uuid} />
				<Button
					type="submit"
					size="sm"
					variant="danger"
					onclick={(e) => {
						if (!confirm('Delete this template?')) e.preventDefault();
					}}
				>
					Delete
				</Button>
			</form>
		</div>
	</div>

	{#if showPreview}
		<div class="template-preview">
			<div class="preview-section">
				<strong>Subject:</strong>
				<p>{template.subject}</p>
			</div>
			<div class="preview-section">
				<strong>Body:</strong>
				<MarkdownRenderer markdown={template.body} />
			</div>
		</div>
	{/if}
</div>

<style>
	.template-card {
		border: 1px solid var(--border-color, #ddd);
		border-radius: 6px;
		padding: 1.5rem;
		background: var(--card-background, white);
	}

	.template-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.template-header h3 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--text-primary);
	}

	.template-actions {
		display: flex;
		gap: 0.5rem;
	}

	.template-actions form {
		display: inline;
	}

	.template-preview {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color, #eee);
	}

	.preview-section {
		margin-bottom: 1rem;
	}

	.preview-section strong {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--text-secondary);
	}

	.preview-section p {
		margin: 0;
		padding: 0.5rem;
		background: var(--background-secondary, #f9f9f9);
		border-radius: 4px;
	}
</style>
