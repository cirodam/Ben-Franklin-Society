<script lang="ts">
	/**
	 * Context Badge Component
	 * 
	 * Displays a small badge indicating the current context mode
	 * (association only - personal context shows no badge)
	 */
	
	interface Props {
		actingAsUuid: string;
		personUuid: string;
		contextLabel?: string;
	}
	
	let { actingAsUuid, personUuid, contextLabel }: Props = $props();
	
	const isPersonal = $derived(actingAsUuid === personUuid);
	
	const badgeLabel = $derived(() => {
		if (isPersonal) return null; // Don't show badge for personal context
		if (contextLabel) return contextLabel;
		return 'Association Context';
	});
</script>

{#if badgeLabel()}
	<div class="context-badge">
		{badgeLabel()}
	</div>
{/if}

<style>
	.context-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		background: var(--highlight-faint);
		color: var(--highlight);
		border: 1px solid var(--highlight-border);
	}
</style>
