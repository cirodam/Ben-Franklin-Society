<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';
	import { Button, Input, PageHeader } from '@bfs/ui';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { templates } = $derived(data);

	let editingUuid = $state<string | null>(null);
	let isCreating = $state(false);
	let previewUuid = $state<string | null>(null);

	let templateName = $state('');
	let templateSubject = $state('');
	let templateBody = $state('');

	function startCreate() {
		isCreating = true;
		editingUuid = null;
		templateName = '';
		templateSubject = '';
		templateBody = '';
	}

	function startEdit(template: (typeof templates)[0]) {
		isCreating = false;
		editingUuid = template.uuid;
		previewUuid = null;
		templateName = template.name;
		templateSubject = template.subject;
		templateBody = template.body;
	}

	function cancel() {
		isCreating = false;
		editingUuid = null;
		previewUuid = null;
		templateName = '';
		templateSubject = '';
		templateBody = '';
	}

	function togglePreview(uuid: string) {
		previewUuid = previewUuid === uuid ? null : uuid;
	}
</script>

<PageHeader title="Message Templates" />

<div class="templates-page">
	{#if form?.error}
		<div class="error-message">{form.error}</div>
	{/if}

	{#if form?.success}
		<div class="success-message">Template saved successfully!</div>
	{/if}

	{#if !isCreating && !editingUuid}
		<div class="templates-header">
			<p class="description">
				Create reusable message templates to save time when sending common messages.
			</p>
			<Button onclick={startCreate}>New Template</Button>
		</div>

		{#if templates.length === 0}
			<div class="empty-state">
				<p>No templates yet. Create your first template to get started.</p>
			</div>
		{:else}
			<div class="templates-list">
				{#each templates as template}
					<div class="template-card">
						<div class="template-header">
							<h3>{template.name}</h3>
							<div class="template-actions">
								<Button size="sm" variant="secondary" onclick={() => togglePreview(template.uuid)}>
									{previewUuid === template.uuid ? 'Hide' : 'Preview'}
								</Button>
								<Button size="sm" onclick={() => startEdit(template)}>Edit</Button>
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

						{#if previewUuid === template.uuid}
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
				{/each}
			</div>
		{/if}
	{:else}
		<div class="template-form">
			<h2>{isCreating ? 'Create Template' : 'Edit Template'}</h2>

			<form
				method="POST"
				action={isCreating ? '?/create' : '?/update'}
				use:enhance={() => {
					return ({ result, update }) => {
						if (result.type === 'success') {
							cancel();
						}
						update();
					};
				}}
			>
				{#if editingUuid}
					<input type="hidden" name="uuid" value={editingUuid} />
				{/if}

				<label>
					<span>Template Name</span>
					<Input
						type="text"
						name="name"
						placeholder="e.g., Weekly Update"
						bind:value={templateName}
						required
					/>
				</label>

				<label>
					<span>Default Subject</span>
					<Input
						type="text"
						name="subject"
						placeholder="e.g., Weekly Update - {{date}}"
						bind:value={templateSubject}
						required
					/>
				</label>

				<label>
					<span>Default Body</span>
					<MarkdownEditor name="body" bind:value={templateBody} required />
				</label>

				<div class="form-actions">
					<Button type="submit">{isCreating ? 'Create Template' : 'Save Changes'}</Button>
					<Button type="button" variant="secondary" onclick={cancel}>Cancel</Button>
				</div>
			</form>
		</div>
	{/if}
</div>

<style>
	.templates-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.templates-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.description {
		color: var(--text-secondary);
		margin: 0;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-secondary);
	}

	.error-message,
	.success-message {
		padding: 1rem;
		margin-bottom: 1rem;
		border-radius: 4px;
	}

	.error-message {
		background: var(--error-background, #fee);
		color: var(--error-color, #c00);
		border: 1px solid var(--error-border, #fcc);
	}

	.success-message {
		background: var(--success-background, #efe);
		color: var(--success-color, #060);
		border: 1px solid var(--success-border, #cfc);
	}

	.templates-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

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

	.template-form {
		background: var(--card-background, white);
		border: 1px solid var(--border-color, #ddd);
		border-radius: 6px;
		padding: 2rem;
	}

	.template-form h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
	}

	.template-form label {
		display: block;
		margin-bottom: 1.5rem;
	}

	.template-form label span {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}
</style>
