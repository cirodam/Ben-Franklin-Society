<script lang="ts">
	import { Button, Modal, Select } from '@bfs/ui';
	import { enhance } from '$app/forms';

	interface Person {
		uuid: string;
		given_name: string;
		family_name: string;
		handle: string;
	}

	interface Props {
		open: boolean;
		roleTitle: string;
		allPeople: Person[];
		onclose: () => void;
	}

	let { open = $bindable(), roleTitle, allPeople, onclose }: Props = $props();

	let selectedPersonUuid = $state<string>('');

	$effect(() => {
		if (open) {
			selectedPersonUuid = '';
		}
	});

	function handleClose() {
		open = false;
		onclose();
	}
</script>

<Modal bind:open title="Assign Person to Role" size="md">
	<form method="POST" action="?/assign_role" use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				handleClose();
			}
		};
	}}>
		<div class="assign-form">
			<p class="form-description">
				Select a person to assign to the <strong>{roleTitle}</strong> role.
			</p>
			
			<Select 
				name="person_uuid" 
				label="Person"
				bind:value={selectedPersonUuid}
				required
			>
				<option value="">Select a person...</option>
				{#each allPeople as person}
					<option value={person.uuid}>
						{person.given_name} {person.family_name} (@{person.handle})
					</option>
				{/each}
			</Select>
		</div>

		<div class="modal-actions">
			<Button type="submit" disabled={!selectedPersonUuid}>Assign Role</Button>
			<Button type="button" variant="secondary" onclick={handleClose}>
				Cancel
			</Button>
		</div>
	</form>
</Modal>

<style>
	.assign-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.form-description {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #374340;
		margin: 0;
	}

	.form-description strong {
		color: #151c1a;
		font-weight: 600;
	}

	.modal-actions {
		display: flex;
		gap: var(--space-2);
		justify-content: flex-end;
		margin-top: var(--space-5);
		padding-top: var(--space-4);
		border-top: 1px solid rgba(45, 90, 79, 0.15);
	}
</style>
