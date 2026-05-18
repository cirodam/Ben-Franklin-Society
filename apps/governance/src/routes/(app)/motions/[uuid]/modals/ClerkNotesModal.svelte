<script lang="ts">
	import { enhance } from '$app/forms';
	import { Modal, Button, Textarea } from '@bfs/ui';

	let {
		show = $bindable(false),
		clerkNotes = ''
	}: {
		show?: boolean;
		clerkNotes?: string | null;
	} = $props();

	let notesValue = $state(clerkNotes || '');

	// Update local value when prop changes
	$effect(() => {
		notesValue = clerkNotes || '';
	});
</script>

<Modal {show} title="Clerk's Notes">
	<form method="POST" action="?/setClerkNotes" use:enhance={() => {
		return ({ update }) => {
			update().then(() => {
				show = false;
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
		{#snippet actions()}
			<Button variant="secondary" onclick={() => show = false}>Cancel</Button>
			<Button type="submit">Save Notes</Button>
		{/snippet}
	</form>
</Modal>

<style>
	.modal-hint {
		margin: 0 0 var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-style: italic;
	}
</style>
