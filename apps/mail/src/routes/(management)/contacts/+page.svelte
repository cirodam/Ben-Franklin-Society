<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { Button, PageHeader, Alert } from '@bfs/ui';
	import ContactGroupForm from '$lib/components/contacts/ContactGroupForm.svelte';
	import ContactGroupList from '$lib/components/contacts/ContactGroupList.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { groups } = $derived(data);

	// Edit state
	let editingUuid = $state<string | null>(null);
	let isCreating = $state(false);
	let groupName = $state('');
	let groupMembers = $state('');

	function startEdit(group: (typeof groups)[0]) {
		editingUuid = group.uuid;
		isCreating = false;
		groupName = group.name;
		groupMembers = group.members.map((m) => '@' + m.handle_cache).join(', ');
	}

	function startCreate() {
		isCreating = true;
		editingUuid = null;
		groupName = '';
		groupMembers = '';
	}

	function cancelEdit() {
		editingUuid = null;
		isCreating = false;
		groupName = '';
		groupMembers = '';
	}
</script>

<div class="page">
	<PageHeader title="Contact Groups" />

	{#if form?.error}
		<Alert variant="error" message={form.error} />
	{/if}

	<!-- Create New Group -->
	<div class="create-section">
		{#if !isCreating}
			<Button onclick={startCreate}>+ New Group</Button>
		{:else}
			<ContactGroupForm
				bind:groupName
				bind:groupMembers
				onCancel={cancelEdit}
			/>
		{/if}
	</div>

	<!-- Group List -->
	<ContactGroupList {groups} bind:editingUuid onStartEdit={startEdit} />
</div>

<style>
	.page {
		max-width: 900px;
		margin: 0 auto;
		padding: var(--space-6);
	}

	.create-section {
		margin-bottom: var(--space-6);
	}
</style>
