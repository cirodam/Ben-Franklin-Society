<script lang="ts">
	import { enhance } from '$app/forms';
	import { Modal, Button, Textarea } from '@bfs/ui';

	let {
		open = $bindable(false),
		parliamentarianNotes = ''
	}: {
		open?: boolean;
		parliamentarianNotes?: string | null;
	} = $props();

	let notesValue = $state(parliamentarianNotes || '');

	// Update local value when prop changes
	$effect(() => {
		notesValue = parliamentarianNotes || '';
	});
</script>

<Modal {open} title="Parliamentarian's Notes">
	<form id="parliamentarian-notes-form" method="POST" action="?/setParliamentarianNotes" use:enhance={() => {
		return ({ update }) => {
			update().then(() => {
				open = false;
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
	</form>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => open = false}>
			{#snippet children()}Cancel{/snippet}
		</Button>
		<Button type="submit" form="parliamentarian-notes-form">
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
