<script lang="ts">
	import Badge from '@bfs/ui/src/Badge.svelte';
	import { Button, EmptyState, List, ListItem, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	type FilterType = 'all' | 'people' | 'associations';
	let query = $state('');
	let filter = $state<FilterType>('all');

	const filteredPeople = $derived(
		data.people.filter((p) => {
			if (filter !== 'all' && filter !== 'people') return false;
			const q = query.toLowerCase().trim();
			if (!q) return true;
			return (
				p.handle.toLowerCase().includes(q) ||
				p.given_name.toLowerCase().includes(q) ||
				p.family_name.toLowerCase().includes(q)
			);
		})
	);

	const filteredAssociations = $derived(
		data.associations.filter((a) => {
			if (filter !== 'all' && filter !== 'associations') return false;
			const q = query.toLowerCase().trim();
			if (!q) return true;
			return (
				a.handle.toLowerCase().includes(q) ||
				a.name.toLowerCase().includes(q)
			);
		})
	);

	const statusVariant = (s: string): 'success' | 'warn' | 'danger' =>
		s === 'active' ? 'success' : s === 'suspended' ? 'warn' : 'danger';
</script>

<div class="page">
	<PageHeader 
		title="Directory" 
		description="Search for people and associations"
	>
		{#snippet actions()}
			<Button href="/organization/directory/new">+ Add Person</Button>
		{/snippet}
	</PageHeader>

	<div class="toolbar">
		<input
			class="search"
			type="search"
			placeholder="Search by name or handle…"
			bind:value={query}
		/>
		<div class="filters">
			<button
				class="filter-chip"
				class:filter-chip--active={filter === 'all'}
				onclick={() => (filter = 'all')}
			>
				All
				<span class="filter-chip__count">
					{data.people.length + data.associations.length}
				</span>
			</button>
			<button
				class="filter-chip"
				class:filter-chip--active={filter === 'people'}
				onclick={() => (filter = 'people')}
			>
				People
				<span class="filter-chip__count">{data.people.length}</span>
			</button>
			<button
				class="filter-chip"
				class:filter-chip--active={filter === 'associations'}
				onclick={() => (filter = 'associations')}
			>
				Associations
				<span class="filter-chip__count">{data.associations.length}</span>
			</button>
		</div>
	</div>

	{#if (filter === 'all' || filter === 'people') && filteredPeople.length > 0}
		<section class="results-section">
			<h2 class="section-title">👤 People</h2>
			<List>
				{#each filteredPeople as p (p.uuid)}
					<ListItem href="/organization/people/{p.uuid}">
						<div class="result-card__main">
							<div class="result-card__title">{p.given_name} {p.family_name}</div>
							<code class="result-card__handle">@{p.handle}</code>
						</div>
						<div class="result-card__meta">
							<Badge label={p.status} variant={statusVariant(p.status)} />
							<span class="result-card__date">Joined {p.joined_at.slice(0, 10)}</span>
						</div>
					</ListItem>
				{/each}
			</List>
		</section>
	{/if}

	{#if (filter === 'all' || filter === 'associations') && filteredAssociations.length > 0}
		<section class="results-section">
			<h2 class="section-title">🏛️ Associations</h2>
			<List>
				{#each filteredAssociations as a (a.uuid)}
					<ListItem href="/{a.type === 'committee' ? 'committees' : a.type === 'college' ? 'colleges' : a.type === 'service' ? 'services' : 'associations'}/{a.uuid}">
						<div class="result-card__main">
							<div class="result-card__title">{a.name}</div>
							<code class="result-card__handle">@{a.handle}</code>
						</div>
						<div class="result-card__meta">
							<span class="type-badge type-badge--{a.type}">{a.type}</span>
							<Badge label={a.status} variant={statusVariant(a.status)} />
						</div>
					</ListItem>
				{/each}
			</List>
		</section>
	{/if}

	{#if filteredPeople.length === 0 && filteredAssociations.length === 0}
		<EmptyState 
			icon="🔍"
			title="No results found"
		/>
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

	.search {
		width: 100%;
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		font-size: var(--text-base);
		color: var(--color-text);
		outline: none;
	}
	.search:focus { border-color: var(--color-primary, #3b82f6); }

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

	.results-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.section-title {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		margin: 0;
	}

	.result-card__main {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
		flex: 1;
	}

	.result-card__title {
		font-weight: var(--weight-medium);
		font-size: var(--text-base);
	}

	.result-card__handle {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.result-card__meta {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-shrink: 0;
	}

	.result-card__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.type-badge {
		font-size: var(--text-xs);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-weight: var(--weight-medium);
		text-transform: capitalize;
		background: var(--color-accent-subtle);
		color: var(--color-accent);
		border: 1px solid var(--color-accent);
		white-space: nowrap;
	}

	.type-badge--committee { background: #ede9fe; border-color: #8b5cf6; color: #6b21a8; }
	.type-badge--college { background: #dbeafe; border-color: #3b82f6; color: #1e40af; }
	.type-badge--service { background: #dcfce7; border-color: #22c55e; color: #166534; }
	.type-badge--society { background: #fefce8; border-color: #fbbf24; color: #92400e; }
	.type-badge--general_assembly { background: #fce7f3; border-color: #ec4899; color: #9f1239; }

	.empty {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		text-align: center;
		padding: var(--space-8);
	}
</style>
