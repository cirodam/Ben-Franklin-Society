<script lang="ts">
	import { Badge } from '@bfs/ui';

	interface Props {
		referendum: {
			title: string;
			opens_at?: string;
			closes_at?: string;
			closed_at?: string | null;
			description?: string | null;
		};
		status: 'scheduled' | 'closed';
		formatDate?: (isoString: string) => string;
	}

	let { referendum, status, formatDate }: Props = $props();
</script>

<div class="referendum-item">
	<div class="referendum-item__header">
		<span class="referendum-item__title">{referendum.title}</span>
		{#if status === 'scheduled'}
			<Badge label="Scheduled" variant="accent" />
		{:else}
			<Badge label="Closed" variant="neutral" />
		{/if}
	</div>
	<span class="referendum-item__meta">
		{#if status === 'scheduled' && referendum.opens_at}
			Opens {new Date(referendum.opens_at).toLocaleDateString()}
		{:else if status === 'closed' && formatDate}
			Closed {formatDate(referendum.closed_at || referendum.closes_at || '')}
		{/if}
	</span>
	{#if referendum.description}
		<p class="referendum-item__description">{referendum.description}</p>
	{/if}
</div>

<style>
	.referendum-item {
		padding: var(--space-5);
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		transition: all 0.2s;
	}

	.referendum-item:hover {
		border-color: var(--gold);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 4px 8px rgba(0, 0, 0, 0.08);
	}

	.referendum-item__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-2);
	}

	.referendum-item__title {
		font-family: var(--font-prose);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--ink);
	}

	.referendum-item__meta {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
		font-variant-numeric: oldstyle-nums;
	}

	.referendum-item__description {
		font-family: var(--font-prose);
		color: var(--ink-mid);
		font-size: var(--text-sm);
		line-height: 1.6;
		margin-top: var(--space-2);
	}
</style>
