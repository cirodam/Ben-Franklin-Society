<script lang="ts">
	import { EmptyState, List, ListItem, PageHeader } from '@bfs/ui';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import type { DocumentStatus } from '$lib/server/library.js';

	let { data }: { data: PageData } = $props();

	let query = $state(data.filters.query);
	let typeFilter = $state<string[]>(data.filters.types);
	let statusFilter = $state<string>(data.filters.status);

	const allTypes = ['governing', 'motion'];
	const statuses = ['all', 'draft', 'introduced', 'deliberation', 'adopted', 'enacted', 'rejected', 'withdrawn', 'repealed'];

	// Update URL when filters change
	function updateFilters() {
		const params = new URLSearchParams();
		if (typeFilter.length > 0 && typeFilter.length < allTypes.length) {
			params.set('type', typeFilter.join(','));
		}
		if (statusFilter !== 'all') {
			params.set('status', statusFilter);
		}
		if (query.trim()) {
			params.set('q', query.trim());
		}
		const url = params.toString() ? `?${params}` : '';
		goto(`/library${url}`, { replaceState: true, keepFocus: true });
	}

	const statusVariant: Record<string, string> = {
		draft: 'status--draft',
		introduced: 'status--introduced',
		deliberation: 'status--deliberation',
		adopted: 'status--adopted',
		enacted: 'status--enacted',
		rejected: 'status--rejected',
		withdrawn: 'status--withdrawn',
		repealed: 'status--repealed',
	};

	function getSeniorityName(seniority: number): string {
		const names: Record<number, string> = {
			1: 'Charter',
			2: 'Constitution',
			3: 'Bylaw',
			4: 'Ordinance',
			5: 'Regulation',
			6: 'Policy'
		};
		return names[seniority] ?? 'Document';
	}

	function getSeniorityVariant(seniority: number): string {
		return `seniority--${seniority}`;
	}

	function getItemHref(item: any): string {
		if (item.type === 'motion') {
			return `/motions/${item.uuid}`;
		}
		return `/library/${item.slug}`;
	}

	function getItemIcon(item: any): string {
		switch (item.type) {
			case 'governing': return '📜';
			case 'motion': return '📋';
			case 'budget': return '💰';
			case 'report': return '📊';
			default: return '📄';
		}
	}

	function getItemSubtitle(item: any): string {
		if (item.type === 'governing' && item.metadata.seniority) {
			return getSeniorityName(item.metadata.seniority);
		}
		if (item.type === 'motion' && item.metadata.motion_number) {
			return item.metadata.motion_number;
		}
		return item.type;
	}

	function toggleType(type: string) {
		if (typeFilter.includes(type)) {
			typeFilter = typeFilter.filter(t => t !== type);
		} else {
			typeFilter = [...typeFilter, type];
		}
		updateFilters();
	}
</script>

<div class="page">
	<PageHeader 
		title="Library"
		description="Browse the society's governing corpus, motions, and other documents"
	/>

	<div class="stats-bar">
		{#each allTypes as type}
			{@const stat = data.stats[type]}
			{#if stat}
				<div class="stat-card">
					<div class="stat-card__icon">{getItemIcon({ type })}</div>
					<div class="stat-card__content">
						<div class="stat-card__value">{stat.total}</div>
						<div class="stat-card__label">{type === 'governing' ? 'Governing Docs' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}</div>
					</div>
				</div>
			{/if}
		{/each}
	</div>

	{#if data.corpus.length > 0}
		<section class="corpus-section">
			<h2 class="section-title">📜 Corpus of Law</h2>
			<p class="section-desc">All adopted documents that govern the society</p>
			<List>
				{#each data.corpus as doc}
					<ListItem href="/library/{doc.slug}" class="doc-item--corpus">
						<div class="doc-item__main">
							<span class="doc-item__title">{doc.title}</span>
							<code class="doc-item__slug">{doc.slug}</code>
						</div>
						<div class="doc-item__meta">
							<span class="seniority-badge {getSeniorityVariant(doc.seniority)}">{getSeniorityName(doc.seniority)}</span>
							{#if doc.adopted_at}
								<span class="doc-item__date">Adopted {doc.adopted_at.slice(0, 10)}</span>
							{/if}
						</div>
					</ListItem>
				{/each}
			</List>
		</section>
	{/if}

	<section class="browse-section">
		<div class="toolbar">
			<input
				class="search"
				type="search"
				placeholder="Search by title or slug…"
				bind:value={query}
				onchange={updateFilters}
			/>

			<div class="filter-row">
				<div class="filter-group">
					<span class="filter-label">Type:</span>
					<div class="filters">
						{#each allTypes as type}
							{@const stat = data.stats[type]}
							<button
								class="filter-chip"
								class:filter-chip--active={typeFilter.includes(type)}
								onclick={() => toggleType(type)}
							>
								{getItemIcon({ type })} {type.charAt(0).toUpperCase() + type.slice(1)}
								{#if stat}
									<span class="filter-chip__count">{stat.total}</span>
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<div class="filter-group">
					<span class="filter-label">Status:</span>
					<div class="filters">
						{#each statuses as s}
							{@const matchingCount = data.items.filter(item => s === 'all' || item.metadata.status === s).length}
							{#if s === 'all' || matchingCount > 0}
								<button
									class="filter-chip"
									class:filter-chip--active={statusFilter === s}
									onclick={() => { statusFilter = s; updateFilters(); }}
								>
									{s === 'all' ? 'All' : s}
									{#if s !== 'all'}
										<span class="filter-chip__count">{matchingCount}</span>
									{/if}
								</button>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		</div>

		{#if data.items.length === 0}
			<EmptyState 
				icon="🔍"
				title="No documents match your search"
			/>
		{:else}
			<List>
				{#each data.items as item}
					<ListItem href={getItemHref(item)}>
						<div class="doc-item__main">
							<div class="doc-item__title-row">
								<span class="doc-item__icon">{getItemIcon(item)}</span>
								<span class="doc-item__title">{item.title}</span>
							</div>
							<code class="doc-item__slug">{item.slug}</code>
						</div>
						<div class="doc-item__meta">
							<span class="type-badge">{getItemSubtitle(item)}</span>
							{#if item.metadata.status}
								<span class="status-badge {statusVariant[item.metadata.status] ?? ''}">{item.metadata.status}</span>
							{/if}
							<span class="doc-item__date">
								{new Date(item.updated_at).toLocaleDateString()}
							</span>
						</div>
					</ListItem>
				{/each}
			</List>
		{/if}
	</section>
</div>
<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

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

	.corpus-section {
		background: linear-gradient(to bottom, #fefce8, var(--color-background));
		border: 2px solid #fbbf24;
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}

	.browse-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.section-title {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-2) 0;
	}

	.section-desc {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-4) 0;
	}

	.toolbar {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
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

	.filter-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.filter-label {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.filters {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.filter-chip {
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-full, 9999px);
		border: 1px solid var(--color-border);
		background: transparent;
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: var(--space-1);
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
		font-size: var(--text-xs);
		opacity: 0.8;
	}

	.doc-item__main {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		min-width: 0;
	}

	.doc-item__title-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.doc-item__icon {
		font-size: var(--text-lg);
		flex-shrink: 0;
	}

	.doc-item__title {
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	.doc-item__slug {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.doc-item__meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.doc-item__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.type-badge {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		text-transform: capitalize;
	}

	.status-badge {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		text-transform: capitalize;
	}

	.status--draft { background: #f3f4f6; color: #374151; }
	.status--introduced { background: #dbeafe; color: #1e40af; }
	.status--deliberation { background: #fef3c7; color: #92400e; }
	.status--adopted,
	.status--enacted { background: #d1fae5; color: #065f46; }
	.status--rejected,
	.status--withdrawn,
	.status--repealed { background: #fee2e2; color: #991b1b; }

	.seniority-badge {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
	}

	.seniority--1 { background: #fef3c7; color: #92400e; } /* Charter */
	.seniority--2 { background: #dbeafe; color: #1e40af; } /* Constitution */
	.seniority--3 { background: #e0e7ff; color: #3730a3; } /* Bylaw */
	.seniority--4 { background: #f3e8ff; color: #6b21a8; } /* Ordinance */
	.seniority--5 { background: #fce7f3; color: #9f1239; } /* Regulation */
	.seniority--6 { background: #f3f4f6; color: #374151; } /* Policy */
</style>

