<script lang="ts">
	import { documentTypes } from '$lib/document-types';

	interface Props {
		stats: Record<string, { total: number; [key: string]: any }>;
	}

	let { stats }: Props = $props();

	const allTypes = documentTypes.getAllTypes();
</script>

<div class="stats-bar">
	{#each allTypes as type}
		{@const stat = stats[type]}
		{#if stat}
			{@const typeConfig = documentTypes.get(type)}
			<div class="stat-card">
				<div class="stat-card__icon">{typeConfig.icon}</div>
				<div class="stat-card__content">
					<div class="stat-card__value">{stat.total}</div>
					<div class="stat-card__label">{typeConfig.pluralLabel}</div>
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	.stats-bar {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.stat-card__icon {
		font-size: var(--text-3xl);
	}

	.stat-card__content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.stat-card__value {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		line-height: 1.2;
	}

	.stat-card__label {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
</style>
