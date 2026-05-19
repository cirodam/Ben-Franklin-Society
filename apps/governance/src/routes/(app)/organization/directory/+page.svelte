<script lang="ts">
	import { Button, EmptyState } from '@bfs/ui';
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

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', { 
			month: 'long', 
			day: 'numeric', 
			year: 'numeric'
		});
	}
</script>

<div class="page">
	<header class="header">
		<h1 class="page-title">Directory</h1>
		<p class="page-description">Search for people and associations</p>
		<div class="header-actions">
			<Button href="/organization/directory/new">+ Add Person</Button>
		</div>
	</header>

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
			<h2 class="section-title">People</h2>
			<div class="results-list">
				{#each filteredPeople as p (p.uuid)}
					<a href="/organization/people/{p.uuid}" class="result-card">
						<div class="result-card__main">
							<div class="result-card__title">{p.given_name} {p.family_name}</div>
							<span class="result-card__handle">@{p.handle}</span>
						</div>
						<div class="result-card__meta">
							{#if p.status === 'active'}
								<span class="status-badge status-active">Active</span>
							{:else if p.status === 'suspended'}
								<span class="status-badge status-suspended">Suspended</span>
							{:else}
								<span class="status-badge status-inactive">{p.status}</span>
							{/if}
							<span class="result-card__date">Joined {formatDate(p.joined_at)}</span>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	{#if (filter === 'all' || filter === 'associations') && filteredAssociations.length > 0}
		<section class="results-section">
			<h2 class="section-title">Associations</h2>
			<div class="results-list">
				{#each filteredAssociations as a (a.uuid)}
					<a href="/organization/{a.type === 'committee' ? 'committees' : a.type === 'college' ? 'colleges' : a.type === 'service' ? 'services' : 'associations'}/{a.uuid}" class="result-card">
						<div class="result-card__main">
							<div class="result-card__title">{a.name}</div>
							<span class="result-card__handle">@{a.handle}</span>
						</div>
						<div class="result-card__meta">
							<span class="type-badge type-badge--{a.type}">{a.type}</span>
							{#if a.status === 'active'}
								<span class="status-badge status-active">Active</span>
							{:else if a.status === 'suspended'}
								<span class="status-badge status-suspended">Suspended</span>
							{:else}
								<span class="status-badge status-inactive">{a.status}</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
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
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.header {
		text-align: center;
		max-width: 800px;
		margin: 0 auto var(--space-6) auto;
	}

	.page-title {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: 400;
		color: #151c1a;
		margin: 0 0 var(--space-3) 0;
		line-height: 1.2;
	}

	.page-description {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: #5a5a50;
		line-height: 1.8;
		margin: 0 0 var(--space-6) 0;
	}

	.header-actions {
		display: flex;
		justify-content: center;
	}

	.toolbar {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 800px;
		margin: 0 auto;
		width: 100%;
	}

	.search {
		width: 100%;
		padding: var(--space-3) var(--space-4);
		border: 1px solid rgba(45, 90, 79, 0.3);
		background: var(--paper);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: #151c1a;
		outline: none;
		transition: border-color 0.2s;
	}
	
	.search:focus { 
		border-color: #d4a24a;
	}

	.search::placeholder {
		color: #374340;
		opacity: 0.6;
	}

	.filters {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
		justify-content: center;
	}

	.filter-chip {
		padding: var(--space-2) var(--space-4);
		border: 1px solid rgba(45, 90, 79, 0.3);
		background: transparent;
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		font-weight: 400;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #374340;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		transition: all 0.2s;
	}
	
	.filter-chip:hover { 
		border-color: #7a5c1a; 
		color: #151c1a;
	}
	
	.filter-chip--active {
		background: rgba(212, 162, 74, 0.15);
		border-color: #d4a24a;
		color: #7a5c1a;
	}
	
	.filter-chip__count {
		opacity: 0.7;
		font-size: var(--text-xs);
		font-variant-numeric: oldstyle-nums;
	}

	.results-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.section-title {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: var(--text-2xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0 0 var(--space-4) 0;
	}

	.results-list {
		display: flex;
		flex-direction: column;
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
	}

	.result-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.result-card:last-child {
		border-bottom: none;
	}

	.result-card:hover {
		border-color: #d4a24a;
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 4px 8px rgba(0, 0, 0, 0.08);
		text-decoration: none;
	}

	.result-card__main {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
		flex: 1;
	}

	.result-card__title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-weight: 600;
		font-size: var(--text-base);
		color: #151c1a;
	}

	.result-card__handle {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #7a5c1a;
		font-style: italic;
	}

	.result-card__meta {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-shrink: 0;
		flex-wrap: wrap;
	}

	.result-card__date {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-xs);
		color: #5a5a50;
		font-variant-numeric: oldstyle-nums;
	}

	.status-badge {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-xs);
		font-weight: 400;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		padding: 0.125rem 0.5rem;
		border: 1px solid;
		white-space: nowrap;
	}

	.status-active {
		background: rgba(90, 115, 90, 0.15);
		color: #3a5a3a;
		border-color: rgba(90, 115, 90, 0.3);
	}

	.status-suspended {
		background: rgba(212, 162, 74, 0.15);
		color: #7a5c1a;
		border-color: rgba(212, 162, 74, 0.3);
	}

	.status-inactive {
		background: rgba(45, 90, 79, 0.1);
		color: #374340;
		border-color: rgba(45, 90, 79, 0.2);
	}

	.type-badge {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-xs);
		font-weight: 400;
		letter-spacing: 0.15em;
		padding: 0.125rem 0.5rem;
		text-transform: capitalize;
		border: 1px solid;
		white-space: nowrap;
	}

	.type-badge--committee { 
		background: rgba(139, 115, 170, 0.12); 
		border-color: rgba(139, 115, 170, 0.3); 
		color: #5a4a6a; 
	}
	
	.type-badge--college { 
		background: rgba(90, 120, 140, 0.12); 
		border-color: rgba(90, 120, 140, 0.3); 
		color: #3a5a6a; 
	}
	
	.type-badge--service { 
		background: rgba(90, 115, 90, 0.12); 
		border-color: rgba(90, 115, 90, 0.3); 
		color: #3a5a3a; 
	}
	
	.type-badge--society { 
		background: rgba(212, 162, 74, 0.12); 
		border-color: rgba(212, 162, 74, 0.3); 
		color: #7a5c1a; 
	}
	
	.type-badge--general_assembly { 
		background: rgba(180, 100, 120, 0.12); 
		border-color: rgba(180, 100, 120, 0.3); 
		color: #6a3a4a; 
	}

	@media (max-width: 768px) {
		.result-card {
			flex-direction: column;
			align-items: flex-start;
		}
		
		.result-card__meta {
			width: 100%;
			justify-content: flex-start;
		}
	}
</style>
