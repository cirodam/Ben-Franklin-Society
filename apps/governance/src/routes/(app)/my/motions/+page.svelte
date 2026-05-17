<script lang="ts">
	import { Badge, EmptyState, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const statusVariant = (status: string): 'success' | 'warn' | 'danger' =>
		status === 'enacted' ? 'success' : 
		status === 'rejected' || status === 'withdrawn' ? 'danger' :
		'warn';
	
	type FilterOption = 'all' | 'draft' | 'active' | 'resolved';
	let filter = $state<FilterOption>('all');

	const filteredMotions = $derived(
		data.motions.filter(m => {
			if (filter === 'all') return true;
			if (filter === 'draft') return m.status === 'draft';
			if (filter === 'active') return ['introduced', 'deliberation', 'vote'].includes(m.status);
			if (filter === 'resolved') return ['enacted', 'rejected', 'withdrawn'].includes(m.status);
			return true;
		})
	);
</script>

<div class="page">
	<PageHeader 
		title="My Motions"
		description="Motions you've introduced"
	/>

	<div class="toolbar">
		<div class="filters">
			<button
				class="filter-chip"
				class:filter-chip--active={filter === 'all'}
				onclick={() => (filter = 'all')}
			>
				All
				<span class="filter-chip__count">{data.motions.length}</span>
			</button>
			<button
				class="filter-chip"
				class:filter-chip--active={filter === 'draft'}
				onclick={() => (filter = 'draft')}
			>
				Drafts
				<span class="filter-chip__count">
					{data.motions.filter(m => m.status === 'draft').length}
				</span>
			</button>
			<button
				class="filter-chip"
				class:filter-chip--active={filter === 'active'}
				onclick={() => (filter = 'active')}
			>
				Active
				<span class="filter-chip__count">
					{data.motions.filter(m => ['introduced', 'deliberation', 'vote'].includes(m.status)).length}
				</span>
			</button>
			<button
				class="filter-chip"
				class:filter-chip--active={filter === 'resolved'}
				onclick={() => (filter = 'resolved')}
			>
				Resolved
				<span class="filter-chip__count">
					{data.motions.filter(m => ['enacted', 'rejected', 'withdrawn'].includes(m.status)).length}
				</span>
			</button>
		</div>
	</div>

	{#if filteredMotions.length === 0}
		{#if filter === 'all'}
			<EmptyState 
				icon="📋"
				title="You haven't introduced any motions yet"
				description="Motions are formal proposals for action or changes to the society's governing documents."
			/>
		{:else}
			<EmptyState 
				icon="🔍"
				title="No {filter} motions found"
			/>
		{/if}
	{:else}
		<List>
			{#each filteredMotions as motion (motion.uuid)}
				<ListItem href="/motions/{motion.uuid}">
					<div class="motion-card__main">
						<div class="motion-card__title">{motion.title}</div>
						<div class="motion-card__body">{motion.body_name}</div>
					</div>
					<div class="motion-card__meta">
						<Badge label={motion.status} variant={statusVariant(motion.status)} />
						<span class="motion-card__date">
							{#if motion.enacted_at}
								Enacted {motion.enacted_at.slice(0, 10)}
							{:else if motion.resolved_at}
								Resolved {motion.resolved_at.slice(0, 10)}
							{:else}
								Created {motion.created_at.slice(0, 10)}
							{/if}
						</span>
					</div>
				</ListItem>
			{/each}
		</List>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.toolbar {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.filters {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.filter-chip {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-full, 9999px);
		border: 1px solid var(--color-border);
		background: transparent;
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		text-transform: capitalize;
		transition: background 0.1s, border-color 0.1s, color 0.1s;
	}
	.filter-chip:hover { border-color: var(--color-text-muted); color: var(--color-text); }
	.filter-chip--active {
		background: var(--color-text);
		border-color: var(--color-text);
		color: var(--color-bg, #fff);
	}
	.filter-chip__count {
		opacity: 0.7;
		font-size: var(--text-xs);
	}

	.motion-card__main {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
		flex: 1;
	}

	.motion-card__title {
		font-weight: var(--weight-semibold);
		font-size: var(--text-lg);
	}

	.motion-card__body {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.motion-card__meta {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-shrink: 0;
	}

	.motion-card__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
</style>
