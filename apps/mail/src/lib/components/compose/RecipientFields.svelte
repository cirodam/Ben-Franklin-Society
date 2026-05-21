<script lang="ts">
	import { Input } from '@bfs/ui';

	interface ContactGroup {
		name: string;
		members: any[];
	}

	let {
		toValue = $bindable(''),
		ccValue = $bindable(''),
		bccValue = $bindable(''),
		contactGroups = []
	}: {
		toValue?: string;
		ccValue?: string;
		bccValue?: string;
		contactGroups?: ContactGroup[];
	} = $props();

	function addGroupToRecipients(groupName: string) {
		const currentValue = toValue.trim();
		toValue = currentValue ? `${currentValue}, ${groupName}` : groupName;
	}
</script>

<Input id="to" name="to" label="To" placeholder="@handle, @another" bind:value={toValue} required />

{#if contactGroups.length > 0}
	<div class="contact-groups-hint">
		<strong>Available Groups:</strong>
		{#each contactGroups as group, i}
			<button
				type="button"
				class="group-pill"
				onclick={() => addGroupToRecipients(group.name)}
				title="Click to add to To field"
			>
				{group.name} ({group.members.length})
			</button>
			{#if i < contactGroups.length - 1}{' '}{/if}
		{/each}
	</div>
{/if}

<Input id="cc" name="cc" label="Cc (optional)" placeholder="@handle" bind:value={ccValue} />

<Input id="bcc" name="bcc" label="Bcc (optional)" placeholder="@handle" bind:value={bccValue} />

<style>
	.contact-groups-hint {
		padding: var(--space-3);
		background: var(--parchment);
		border: 1px solid var(--border-base);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		margin-top: -var(--space-3);
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.contact-groups-hint strong {
		color: var(--ink-charcoal);
		margin-right: var(--space-1);
	}

	.group-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		background: white;
		border: 1px solid var(--postal-blue-mid);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--postal-blue-dark);
		cursor: pointer;
		transition: all 0.2s;
	}

	.group-pill:hover {
		background: var(--paper-light-blue);
		border-color: var(--postal-blue);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
</style>
