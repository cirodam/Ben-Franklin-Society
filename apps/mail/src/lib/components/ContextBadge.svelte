<script lang="ts">
	/**
	 * Context Badge Component
	 * 
	 * Displays a small badge indicating the current context mode
	 * (personal, association, or admin)
	 */
	
	interface Props {
		actingAsUuid: string;
		personUuid: string;
		isAdmin?: boolean;
		contextLabel?: string;
	}
	
	let { actingAsUuid, personUuid, isAdmin = false, contextLabel }: Props = $props();
	
	const isPersonal = $derived(actingAsUuid === personUuid);
	const isAssociation = $derived(!isPersonal);
	
	const badgeType = $derived(() => {
		if (isAdmin) return 'admin';
		if (isAssociation) return 'association';
		return 'personal';
	});
	
	const badgeLabel = $derived(() => {
		if (isAdmin) return 'Admin View';
		if (isAssociation && contextLabel) return contextLabel;
		if (isAssociation) return 'Association Context';
		return null; // Don't show badge for personal context
	});
</script>

{#if badgeLabel()}
	<div class="context-badge" class:admin={badgeType() === 'admin'} class:association={badgeType() === 'association'}>
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
	}
	
	.context-badge.association {
		background: var(--highlight-faint);
		color: var(--highlight);
		border: 1px solid var(--highlight-border);
	}
	
	.context-badge.admin {
		background: var(--error-faint);
		color: var(--error);
		border: 1px solid var(--error-border);
	}
</style>
