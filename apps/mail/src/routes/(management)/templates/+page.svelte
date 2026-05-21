<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { Button, PageHeader, Alert } from '@bfs/ui';
	import TemplateForm from '$lib/components/templates/TemplateForm.svelte';
	import TemplateList from '$lib/components/templates/TemplateList.svelte';

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
</script>

<PageHeader title="Message Templates" />

<div class="templates-page">
	{#if form?.error}
		<Alert variant="error" message={form.error} />
	{/if}

	{#if form?.success}
		<Alert variant="success" message="Template saved successfully!" />
	{/if}

	{#if !isCreating && !editingUuid}
		<div class="templates-header">
			<p class="description">
				Create reusable message templates to save time when sending common messages.
			</p>
			<Button onclick={startCreate}>New Template</Button>
		</div>

		<TemplateList {templates} bind:previewUuid onEdit={startEdit} />
	{:else}
		<TemplateForm
			{isCreating}
			{editingUuid}
			bind:templateName
			bind:templateSubject
			bind:templateBody
			onCancel={cancel}
		/>
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
</style>
