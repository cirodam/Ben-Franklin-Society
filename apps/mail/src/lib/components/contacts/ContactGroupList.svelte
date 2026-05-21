<script lang="ts">
	import { EmptyState } from '@bfs/ui';
	import ContactGroupCard from './ContactGroupCard.svelte';

	interface Member {
		handle_cache: string;
	}

	interface ContactGroup {
		uuid: string;
		name: string;
		members: Member[];
	}

	let {
		groups,
		editingUuid = $bindable(null),
		onStartEdit
	}: {
		groups: ContactGroup[];
		editingUuid: string | null;
		onStartEdit: (group: ContactGroup) => void;
	} = $props();

	function handleCancelEdit() {
		editingUuid = null;
	}
</script>

<div class="groups-list">
	{#if groups.length === 0}
		<EmptyState
			icon="📇"
			title="No contact groups yet"
			message="Create a group to send messages to multiple people at once"
		/>
	{:else}
		{#each groups as group}
			<ContactGroupCard
				{group}
				isEditing={editingUuid === group.uuid}
				onEdit={() => onStartEdit(group)}
				onCancelEdit={handleCancelEdit}
			/>
		{/each}
	{/if}
</div>

<style>
	.groups-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
</style>
