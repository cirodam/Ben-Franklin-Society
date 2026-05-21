<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { Button, PageHeader, Alert } from '@bfs/ui';
	import LabelForm from '$lib/components/labels/LabelForm.svelte';
	import LabelList from '$lib/components/labels/LabelList.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { labels } = $derived(data);

	let editingUuid = $state<string | null>(null);
	let isCreating = $state(false);

	let labelName = $state('');
	let labelColor = $state('#3d5a80');

	function startCreate() {
		isCreating = true;
		editingUuid = null;
		labelName = '';
		labelColor = '#3d5a80';
	}

	function startEdit(label: (typeof labels)[0]) {
		isCreating = false;
		editingUuid = label.uuid;
		labelName = label.name;
		labelColor = label.color || '#3d5a80';
	}

	function cancel() {
		isCreating = false;
		editingUuid = null;
		labelName = '';
		labelColor = '#3d5a80';
	}
</script>

<PageHeader title="Labels" />

<div class="labels-page">
	{#if form?.error}
		<Alert variant="error" message={form.error} />
	{/if}

	{#if form?.success}
		<Alert variant="success" message="Label saved successfully!" />
	{/if}

	{#if !isCreating && !editingUuid}
		<div class="labels-header">
			<p class="description">
				Organize your messages with personal labels. Labels are private and help you categorize
				threads.
			</p>
			<Button onclick={startCreate}>New Label</Button>
		</div>

		<LabelList {labels} onEdit={startEdit} />
	{:else}
		<LabelForm
			{isCreating}
			{editingUuid}
			bind:labelName
			bind:labelColor
			onCancel={cancel}
		/>
	{/if}
</div>

<style>
	.labels-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.labels-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		gap: 2rem;
	}

	.description {
		color: var(--text-secondary);
		margin: 0;
		flex: 1;
	}
</style>
