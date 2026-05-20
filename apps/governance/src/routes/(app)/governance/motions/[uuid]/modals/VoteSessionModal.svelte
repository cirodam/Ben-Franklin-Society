<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Modal, Input, Select } from '@bfs/ui';

	let {
		open = $bindable(false),
		onClose
	}: {
		open?: boolean;
		onClose?: () => void;
	} = $props();

	let startImmediately = $state(true);
	let scheduledStartTime = $state('');
	let durationValue = $state('7');
	let durationUnit = $state<'minutes' | 'hours' | 'days'>('days');
	let voteSessionPassingThreshold = $state('50');
	let voteSessionRequiresQuorum = $state(false);
	let voteSessionQuorumThreshold = $state('50');

	// Calculate opens_at and closes_at based on settings
	const computedTimes = $derived.by(() => {
		let opensAt: Date;
		
		if (startImmediately) {
			opensAt = new Date();
		} else {
			opensAt = scheduledStartTime ? new Date(scheduledStartTime) : new Date();
		}

		// Calculate duration in milliseconds
		const duration = parseInt(durationValue) || 1;
		let durationMs = 0;
		switch (durationUnit) {
			case 'minutes':
				durationMs = duration * 60 * 1000;
				break;
			case 'hours':
				durationMs = duration * 60 * 60 * 1000;
				break;
			case 'days':
				durationMs = duration * 24 * 60 * 60 * 1000;
				break;
		}

		const closesAt = new Date(opensAt.getTime() + durationMs);

		return {
			opensAt: opensAt.toISOString(),
			closesAt: closesAt.toISOString()
		};
	});

	// Initialize defaults when modal opens
	$effect(() => {
		if (open) {
			startImmediately = true;
			durationValue = '7';
			durationUnit = 'days';
			voteSessionPassingThreshold = '50';
			voteSessionRequiresQuorum = false;
			voteSessionQuorumThreshold = '50';
			
			const now = new Date();
			const defaultScheduled = new Date(now.getTime() + 60 * 60 * 1000);
			scheduledStartTime = defaultScheduled.toISOString().slice(0, 16);
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
		<p class="modal-hint">Create a voting period for this motion. Members can vote while the session is open.</p>
		
		<!-- Hidden fields for computed times -->
		<input type="hidden" name="opens_at" value={computedTimes.opensAt} />
		<input type="hidden" name="closes_at" value={computedTimes.closesAt} />
		
		<!-- Start timing -->
		<div class="form-section">
			<h4 class="section-title">When to start:</h4>
			<label class="radio-label">
				<input 
					type="radio" 
					name="start_timing"
					checked={startImmediately}
					onchange={() => startImmediately = true} />
				Start immediately
			</label>
			<label class="radio-label">
				<input 
					type="radio" 
					name="start_timing"
					checked={!startImmediately}
					onchange={() => startImmediately = false} />
				Schedule for later
			</label>
			
			{#if !startImmediately}
				<Input 
					type="datetime-local"
					name="scheduled_start" 
					label="Start at:"
					bind:value={scheduledStartTime}
					required />
			{/if}
		</div>
		
		<!-- Duration -->
		<div class="form-section">
			<h4 class="section-title">Voting period duration:</h4>
			<div class="duration-input">
				<Input 
					type="number"
					name="duration_value" 
					label=""
					bind:value={durationValue}
					min="1"
					required />
				<Select 
					name="duration_unit"
					label=""
					bind:value={durationUnit}>
					<option value="minutes">Minutes</option>
					<option value="hours">Hours</option>
					<option value="days">Days</option>
				</Select>
			</div>
			<p class="time-preview">
				Opens: {new Date(computedTimes.opensAt).toLocaleString()}<br />
				Closes: {new Date(computedTimes.closesAt).toLocaleString()}
			</p>
		</div>
		
		<!-- Voting rules -->
		<div class="form-section">
			<h4 class="section-title">Voting threshold:</h4>
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
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" onclick={handleClose}>
			{#snippet children()}Cancel{/snippet}
		</Button>
		<Button type="submit" form="vote-session-form">
			{#snippet children()}{startImmediately ? 'Start Voting' : 'Schedule Vote'}{/snippet}
		</Button>
	{/snippet}
</Modal>

<style>
	.modal-hint {
		margin-bottom: var(--space-5);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.form-section {
		margin-bottom: var(--space-5);
		padding-bottom: var(--space-4);
		border-bottom: 1px solid var(--color-border);
	}

	.form-section:last-of-type {
		border-bottom: none;
	}

	.section-title {
		font-size: var(--text-base);
		font-weight: 600;
		margin: 0 0 var(--space-3);
		color: var(--color-text);
	}

	.radio-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text);
		cursor: pointer;
		margin-bottom: var(--space-2);
	}

	.radio-label input[type="radio"] {
		cursor: pointer;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text);
		cursor: pointer;
		margin: var(--space-3) 0;
	}

	.checkbox-label input[type="checkbox"] {
		cursor: pointer;
	}

	.duration-input {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
		align-items: end;
	}

	.time-preview {
		margin-top: var(--space-3);
		padding: var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		line-height: 1.6;
	}
</style>
