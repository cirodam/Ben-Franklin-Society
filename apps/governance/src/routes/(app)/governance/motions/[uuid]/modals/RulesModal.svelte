<script lang="ts">
	import { enhance } from '$app/forms';
	import { Modal, Button, Select } from '@bfs/ui';

	type VoteRule = {
		uuid: string;
		name: string;
		numerator: number;
		denominator: number;
	};

	type DeliberationRule = {
		uuid: string;
		name: string;
		minimum_days: number;
	};

	let {
		open = $bindable(false),
		voteRuleUuid = '',
		deliberationRuleUuid = '',
		voteRules = [],
		deliberationRules = []
	}: {
		open?: boolean;
		voteRuleUuid?: string;
		deliberationRuleUuid?: string;
		voteRules?: VoteRule[];
		deliberationRules?: DeliberationRule[];
	} = $props();

	let selectedVotingRuleUuid = $state<string>(voteRuleUuid || '');
	let selectedDeliberationRuleUuid = $state<string>(deliberationRuleUuid || '');
	let errorMessage = $state<string>('');

	// Update local values when props change
	$effect(() => {
		selectedVotingRuleUuid = voteRuleUuid || '';
		selectedDeliberationRuleUuid = deliberationRuleUuid || '';
		errorMessage = '';
	});
</script>

<Modal {open} title="Set Motion Rules">
	<form id="rules-form" method="POST" action="?/setMotionRules" use:enhance={() => {
		errorMessage = '';
		return async ({ result, update }) => {
			if (result.type === 'failure') {
				errorMessage = result.data?.error || 'Failed to set rules';
			} else if (result.type === 'success') {
				await update();
				open = false;
			} else {
				await update();
			}
		};
	}}>
		<p class="modal-hint">These rules determine how this motion will be voted on and how long the deliberation period lasts.</p>
		
		{#if errorMessage}
			<div class="error-message">{errorMessage}</div>
		{/if}
		
		<Select 
			id="vote-rule" 
			name="vote_rule_uuid" 
			label="Voting Threshold:"
			bind:value={selectedVotingRuleUuid}
		>
			<option value="">Not set</option>
			{#each voteRules as rule}
				<option value={rule.uuid}>
					{rule.name} ({rule.numerator}/{rule.denominator})
				</option>
			{/each}
		</Select>
		
		<Select 
			id="deliberation-rule" 
			name="deliberation_rule_uuid" 
			label="Deliberation Period:"
			bind:value={selectedDeliberationRuleUuid}
		>
			<option value="">Not set</option>
			{#each deliberationRules as rule}
				<option value={rule.uuid}>
					{rule.name} ({rule.minimum_days} days)
				</option>
			{/each}
		</Select>
	</form>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => open = false}>
			{#snippet children()}Cancel{/snippet}
		</Button>
		<Button type="submit" form="rules-form">
			{#snippet children()}Save Changes{/snippet}
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
	
	.error-message {
		margin: 0 0 var(--space-3);
		padding: var(--space-2) var(--space-3);
		background-color: rgba(220, 38, 38, 0.1);
		border: 1px solid rgba(220, 38, 38, 0.3);
		border-radius: var(--radius-md);
		color: #991b1b;
		font-size: var(--text-sm);
	}
</style>
