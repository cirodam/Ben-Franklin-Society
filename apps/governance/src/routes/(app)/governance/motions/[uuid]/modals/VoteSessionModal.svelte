<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Modal, Input } from '@bfs/ui';

	let {
		open = $bindable(false),
		onClose
	}: {
		open?: boolean;
		onClose?: () => void;
	} = $props();

	let voteSessionOpensAt = $state('');
	let voteSessionClosesAt = $state('');
	let voteSessionPassingThreshold = $state('50');
	let voteSessionRequiresQuorum = $state(false);
	let voteSessionQuorumThreshold = $state('50');

	// Initialize defaults when modal opens
	$effect(() => {
		if (open) {
			const now = new Date();
			const defaultOpens = new Date(now.getTime() + 60 * 60 * 1000);
			const defaultCloses = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
			
			voteSessionOpensAt = defaultOpens.toISOString().slice(0, 16);
			voteSessionClosesAt = defaultCloses.toISOString().slice(0, 16);
			voteSessionPassingThreshold = '50';
			voteSessionRequiresQuorum = false;
			voteSessionQuorumThreshold = '50';
		}
	});

	function handleClose() {
		open = false;
		onClose?.();
	}
</script>

<Modal {open} title="Create Vote Session" onclose={handleClose}>
	<form id="vote-session-form" method="POST" action="?/createVoteSession" use:enhance={() => {
		return async ({ update }) => {
			await update();
			handleClose();
		};
	}}>
		<p class="modal-hint">Schedule a voting period for this motion. Members can vote during the open period.</p>
		
		<Input 
			type="datetime-local"
			name="opens_at" 
			label="Opens At:"
			bind:value={voteSessionOpensAt}
			required />
		
		<Input 
			type="datetime-local"
			name="closes_at" 
			label="Closes At:"
			bind:value={voteSessionClosesAt}
			required />
		
		<Input 
			type="number"
			name="passing_threshold" 
			label="Passing Threshold (%):"
			bind:value={voteSessionPassingThreshold}
			min="0"
			max="100"
			required />
		
		<label class="checkbox-label">
			<input 
				type="checkbox" 
				name="requires_quorum"
				bind:checked={voteSessionRequiresQuorum} />
			Requires Quorum
		</label>
		
		{#if voteSessionRequiresQuorum}
			<Input 
				type="number"
				name="quorum_threshold" 
				label="Quorum Threshold (%):"
				bind:value={voteSessionQuorumThreshold}
				min="0"
				max="100"
				required />
		{/if}
	</form>
	{#snippet footer()}
		<Button variant="secondary" onclick={handleClose}>
			{#snippet children()}Cancel{/snippet}
		</Button>
		<Button type="submit" form="vote-session-form">
			{#snippet children()}Create Session{/snippet}
		</Button>
	{/snippet}
</Modal>

<style>
	.modal-hint {
		margin-bottom: var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text);
		cursor: pointer;
		margin: var(--space-4) 0;
	}

	.checkbox-label input[type="checkbox"] {
		cursor: pointer;
	}
</style>
