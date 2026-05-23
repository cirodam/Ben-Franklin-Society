<script lang="ts">
	import { Badge } from '@bfs/ui';

	interface Props {
		petition: {
			uuid: string;
			title: string;
			created_at: string;
			signature_count: number | null;
			is_signed_by?: string | null;
		};
	}

	let { petition }: Props = $props();

	function formatDate(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<a href="/governance/petitions/{petition.uuid}" class="petition-card">
	<div class="petition-card__header">
		<span class="petition-card__title">{petition.title}</span>
		<div class="petition-card__badges">
			{#if petition.is_signed_by}
				<Badge label="Signed" variant="success" />
			{/if}
			<Badge label="Open" variant="warn" />
		</div>
	</div>
	<div class="petition-card__meta">
		<span class="petition-card__date">Created {formatDate(petition.created_at)}</span>
		<span class="petition-card__signatures">
			{petition.signature_count || 0} {petition.signature_count === 1 ? 'signature' : 'signatures'}
		</span>
	</div>
</a>

<style>
	.petition-card {
		display: block;
		padding: var(--space-5);
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		transition: all 0.2s;
		text-decoration: none;
		color: inherit;
	}

	.petition-card:hover {
		border-color: var(--gold);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 4px 8px rgba(0, 0, 0, 0.08);
	}

	.petition-card__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.petition-card__title {
		font-family: var(--font-prose);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--ink);
		flex: 1;
	}

	.petition-card__badges {
		display: flex;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.petition-card__meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
	}

	.petition-card__date {
		font-variant-numeric: oldstyle-nums;
	}

	.petition-card__signatures {
		font-weight: 500;
	}
</style>
