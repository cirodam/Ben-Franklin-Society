<script lang="ts">
	import { enhance } from '$app/forms';
	import { Modal, Button, Textarea } from '@bfs/ui';

	let {
		show = $bindable(false),
		parliamentarianNotes = ''
	}: {
		show?: boolean;
		parliamentarianNotes?: string | null;
	} = $props();

	let notesValue = $state(parliamentarianNotes || '');

	// Update local value when prop changes
	$effect(() => {
		notesValue = parliamentarianNotes || '';
	});
</script>

<Modal {show} title="Parliamentarian's Notes">
	<form method="POST" action="?/setParliamentarianNotes" use:enhance={() => {
		return ({ update }) => {
			update().then(() => {
				show = false;
			});
		};
	}}>
		<p class="modal-hint">Procedural notes, rule interpretations, precedent references...</p>
		<Textarea 
			name="parliamentarian_notes" 
			bind:value={notesValue}
			rows={8}
			placeholder="Enter parliamentarian's notes here..."
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
