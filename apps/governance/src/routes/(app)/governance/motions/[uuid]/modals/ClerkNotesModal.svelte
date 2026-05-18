<script lang="ts">
	import { enhance } from '$app/forms';
	import { Modal, Button, Textarea } from '@bfs/ui';

	let {		open = $bindable(false),
		clerkNotes = ''
	}: {
		open?: boolean;
		clerkNotes?: string | null;
	} = $props();

	let notesValue = $state(clerkNotes || '');

	// Update local value when prop changes
	$effect(() => {
		notesValue = clerkNotes || '';
	});
</script>

<Modal {open} title="Clerk's Notes">
	<form id="clerk-notes-form" method="POST" action="?/setClerkNotes" use:enhance={() => {
		return ({ update }) => {
			update().then(() => {
				open = false;
			});
		};
	}}>
		<p class="modal-hint">Administrative reminders for actions needed if this motion passes...</p>
		<Textarea 
			name="clerk_notes" 
			bind:value={notesValue}
			rows={8}
			placeholder="Enter clerk's notes here..."
			autofocus />
	</form>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => open = false}>
			{#snippet children()}Cancel{/snippet}
		</Button>
		<Button type="submit" form="clerk-notes-form">
			{#snippet children()}Save Notes{/snippet}
		</Button>
	{/snippet}
</Modal>

<style>
	.modal-hint {
		margin: 0 0 var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-style: italic;
	}
</style>
