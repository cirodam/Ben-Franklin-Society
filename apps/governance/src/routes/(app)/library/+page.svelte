<script lang="ts">
	import { EmptyState, List, ListItem, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';
	import type { DocumentStatus } from '$lib/server/library.js';

	let { data }: { data: PageData } = $props();

	let query = $state('');
	let statusFilter = $state<DocumentStatus | 'all'>('all');

	const statuses: (DocumentStatus | 'all')[] = ['all', 'adopted', 'draft', 'repealed'];

	const filtered = $derived(
		data.documents.filter((d) => {
			const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
			const q = query.trim().toLowerCase();
			const matchesQuery =
				!q || d.title.toLowerCase().includes(q) || d.slug.toLowerCase().includes(q);
			return matchesStatus && matchesQuery;
		})
	);

	const statusVariant: Record<string, string> = {
		draft:    'status--draft',
		adopted:  'status--adopted',
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
</script>

<div class="page">
	<PageHeader 
		title="Library"
		description="Browse the society's governing corpus and other documents"
	/>

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
		
		<div class="toolbar">
			<input
				class="search"
				type="search"
				placeholder="Search by title or slug…"
				bind:value={query}
			/>
			<div class="filters">
				{#each statuses as s}
					<button
						class="filter-chip"
						class:filter-chip--active={statusFilter === s}
						onclick={() => (statusFilter = s)}
					>
						{s === 'all' ? 'All' : s}
						{#if s !== 'all'}
							<span class="filter-chip__count">
								{data.documents.filter((d) => d.status === s).length}
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		{#if filtered.length === 0}
			<EmptyState 
				icon="🔍"
				title="No documents match your search"
			/>
		{:else}
			<List>
				{#each filtered as d}
					<ListItem href="/library/{d.slug}">
						<div class="doc-item__main">
							<span class="doc-item__title">{d.title}</span>
							<code class="doc-item__slug">{d.slug}</code>
						</div>
						<div class="doc-item__meta">
						<span class="seniority-badge {getSeniorityVariant(d.seniority)}">{getSeniorityName(d.seniority)}</span>
							{#if d.adopted_at}
								<span class="doc-item__date">Adopted {d.adopted_at.slice(0, 10)}</span>
							{:else}
								<span class="doc-item__date">Created {d.created_at.slice(0, 10)}</span>
							{/if}
							<span class="status-badge {statusVariant[d.status] ?? ''}">{d.status}</span>
						</div>
				</ListItem>
			{/each}
		</List>
		{/if}
	</section>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.corpus-section {
		background: linear-gradient(to bottom, #fefce8, var(--color-background));
		border: 2px solid #fbbf24;
		border-radius: var(--radius-lg);
		padding: var(--space-6);
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
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.search {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		font-size: var(--text-sm);
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
		opacity: 0.6;
		font-size: var(--text-xs);
	}

	.doc-item__main {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
	}
	.doc-item__title {
		font-weight: var(--weight-medium);
		font-size: var(--text-sm);
	}
	.doc-item__slug {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.doc-item__meta {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-shrink: 0;
	}
	.doc-item__owner,
	.doc-item__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	:global(.doc-item--corpus) {
		background: linear-gradient(to right, #fefce8, var(--color-background));
		border-left: 3px solid #fbbf24;
	}

	.seniority-badge {
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

	.seniority--1 { background: #fefce8; border-color: #fbbf24; color: #92400e; }
	.seniority--2 { background: #dbeafe; border-color: #3b82f6; color: #1e40af; }
	.seniority--3 { background: #ede9fe; border-color: #8b5cf6; color: #6b21a8; }
	.seniority--4 { background: #fce7f3; border-color: #ec4899; color: #9f1239; }
	.seniority--5 { background: #e0f2fe; border-color: #0ea5e9; color: #075985; }
	.seniority--6 { background: #f0fdf4; border-color: #22c55e; color: #166534; }

	.status-badge {
		font-size: var(--text-xs);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: 1px solid transparent;
		white-space: nowrap;
	}
	.status--draft    { background: var(--color-surface); border-color: var(--color-border); color: var(--color-text-muted); }
	.status--adopted  { background: #dcfce7; border-color: #86efac; color: #166534; }
	.status--repealed { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
</style>

