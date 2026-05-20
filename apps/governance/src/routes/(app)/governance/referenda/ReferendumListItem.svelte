<script lang="ts">
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
			<span class="badge badge-info">Scheduled</span>
		{:else}
			<span class="badge badge-neutral">Closed</span>
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
		border-color: #d4a24a;
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
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-lg);
		font-weight: 600;
		color: #151c1a;
	}

	.badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-xs);
		font-weight: 400;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		border-radius: 2px;
		margin-left: var(--space-2);
	}

	.badge-info {
		background: rgba(90, 120, 140, 0.15);
		color: #3a5a6a;
		border: 1px solid rgba(90, 120, 140, 0.3);
	}

	.badge-neutral {
		background: rgba(45, 90, 79, 0.1);
		color: #374340;
		border: 1px solid rgba(45, 90, 79, 0.2);
	}

	.referendum-item__meta {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #5a5a50;
		font-variant-numeric: oldstyle-nums;
	}

	.referendum-item__description {
		font-family: 'Libre Baskerville', Georgia, serif;
		color: #5a5a50;
		font-size: var(--text-sm);
		line-height: 1.6;
		margin-top: var(--space-2);
	}
</style>
