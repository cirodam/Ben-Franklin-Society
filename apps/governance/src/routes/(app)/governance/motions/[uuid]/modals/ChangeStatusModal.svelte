<script lang="ts">
	import { enhance } from '$app/forms';
	import { Modal, Button, Select } from '@bfs/ui';

	let {
		open = $bindable(false),
		currentStatus = 'draft'
	}: {
		open?: boolean;
		currentStatus?: string;
	} = $props();

	let selectedStatus = $state<string>(currentStatus);

	const statuses = [
		{ value: 'draft', label: 'Draft' },
		{ value: 'introduced', label: 'Introduced' },
		{ value: 'deliberation', label: 'Deliberation' },
		{ value: 'voting', label: 'Voting' },
		{ value: 'adopted', label: 'Adopted' },
		{ value: 'enacted', label: 'Enacted' },
		{ value: 'rejected', label: 'Rejected' },
		{ value: 'withdrawn', label: 'Withdrawn' }
	];

	// Update local value when props change
	$effect(() => {
		selectedStatus = currentStatus;
	});
</script>

<Modal {open} title="Change Motion Status">
	<form id="change-status-form" method="POST" action="?/changeStatus" use:enhance={() => {
		return async ({ update }) => {
			await update();
			open = false;
		};
	}}>
		<p class="modal-hint">
			⚠️ <strong>Use with caution:</strong> This allows you to manually change the motion status. 
			This is intended for correcting errors or recovering from incorrect states.
		</p>
		
		<Select 
			id="new-status" 
			name="new_status" 
			label="New Status:"
			bind:value={selectedStatus}
		>
			{#each statuses as status}
				<option value={status.value} disabled={status.value === currentStatus}>
					{status.label} {status.value === currentStatus ? '(current)' : ''}
				</option>
			{/each}
		</Select>

		<p class="warning-note">
			This bypasses normal workflow validation. Use the standard action buttons when possible.
		</p>
	</form>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => open = false}>
			{#snippet children()}Cancel{/snippet}
		</Button>
		<Button type="submit" form="change-status-form" variant="danger">
			{#snippet children()}Change Status{/snippet}
		</Button>
	{/snippet}
</Modal>

<style>
	.modal-hint {
		margin: 0 0 var(--space-4);
		padding: var(--space-3);
		background: #fff3e0;
		border: 1px solid #ffb74d;
		border-radius: var(--radius);
		font-size: var(--text-sm);
		color: #e65100;
	}

	.warning-note {
		margin: var(--space-4) 0 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-style: italic;
	}
</style>
