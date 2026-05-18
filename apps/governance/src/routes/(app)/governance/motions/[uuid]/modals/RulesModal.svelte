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
		show = $bindable(false),
		voteRuleUuid = null,
		deliberationRuleUuid = null,
		voteRules = [],
		deliberationRules = []
	}: {
		show?: boolean;
		voteRuleUuid?: string | null;
		deliberationRuleUuid?: string | null;
		voteRules?: VoteRule[];
		deliberationRules?: DeliberationRule[];
	} = $props();

	let selectedVotingRuleUuid = $state<string | null>(voteRuleUuid);
	let selectedDeliberationRuleUuid = $state<string | null>(deliberationRuleUuid);

	// Update local values when props change
	$effect(() => {
		selectedVotingRuleUuid = voteRuleUuid;
		selectedDeliberationRuleUuid = deliberationRuleUuid;
	});
</script>

<Modal {show} title="Set Motion Rules">
	<form method="POST" action="?/setMotionRules" use:enhance={() => {
		return async ({ update }) => {
			await update();
			show = false;
		};
	}}>
		<p class="modal-hint">These rules determine how this motion will be voted on and how long the deliberation period lasts.</p>
		
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
		{#snippet actions()}
			<Button variant="secondary" onclick={() => show = false}>Cancel</Button>
			<Button type="submit">Save Changes</Button>
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
