<script lang="ts">
	import { documentTypes } from '$lib/documents';
	import type { LibraryItemSummary } from '$lib/server/documents/library-types.js';

	interface Props {
		query: string;
		typeFilter: string[];
		statusFilter: string;
		ownerFilter: string;
		items: LibraryItemSummary[];
		stats: Record<string, { total: number; [key: string]: any }>;
		onQueryChange: (q: string) => void;
		onTypeToggle: (type: string) => void;
		onStatusChange: (status: string) => void;
		onOwnerChange: (owner: string) => void;
		onCreateClick: () => void;
	}

	let {
		query = $bindable(),
		typeFilter,
		statusFilter,
		ownerFilter,
		items,
		stats,
		onQueryChange,
		onTypeToggle,
		onStatusChange,
		onOwnerChange,
		onCreateClick
	}: Props = $props();

	const allTypes = documentTypes.getAllTypes();

	// Compute available statuses based on selected types
	const availableStatuses = $derived(
		typeFilter.length === 0 
			? documentTypes.getAllStatuses()
			: documentTypes.getStatusesForTypes(typeFilter)
	);
</script>

<div class="toolbar">
	<button class="btn btn--primary" onclick={onCreateClick}>
		+ New Document
	</button>
	
	<input
		class="search"
		type="search"
		placeholder="Search by title or slug…"
		bind:value={query}
		onchange={() => onQueryChange(query)}
	/>

	<div class="filter-row">
		<div class="filter-group">
			<span class="filter-label">Owner:</span>
			<div class="filters">
				<button
					class="filter-chip"
					class:filter-chip--active={ownerFilter === 'mine'}
					onclick={() => onOwnerChange('mine')}
				>
					My Documents
				</button>
				<button
					class="filter-chip"
					class:filter-chip--active={ownerFilter === 'all'}
					onclick={() => onOwnerChange('all')}
				>
					All Documents
				</button>
			</div>
		</div>

		<div class="filter-group">
			<span class="filter-label">Type:</span>
			<div class="filters">
				{#each allTypes as type}
					{@const stat = stats[type]}
					{@const typeConfig = documentTypes.get(type)}
					<button
						class="filter-chip"
						class:filter-chip--active={typeFilter.includes(type)}
						onclick={() => onTypeToggle(type)}
					>
						{typeConfig.icon} {typeConfig.label}
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
				{#each ['all', ...availableStatuses] as s}
					{@const matchingCount = items.filter(item => s === 'all' || item.metadata.status === s).length}
					{#if s === 'all' || matchingCount > 0}
						<button
							class="filter-chip"
							class:filter-chip--active={statusFilter === s}
							onclick={() => onStatusChange(s)}
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

<style>
	.toolbar {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.btn {
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		cursor: pointer;
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		transition: all 0.15s;
	}

	.btn:hover {
		background: var(--color-background-hover);
		border-color: var(--color-border-hover);
	}

	.btn--primary {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.btn--primary:hover {
		background: var(--color-primary-hover);
		border-color: var(--color-primary-hover);
	}

	.search {
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		width: 100%;
		max-width: 400px;
	}

	.filter-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
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
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.filter-chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		background: var(--color-background);
		font-size: var(--text-sm);
		cursor: pointer;
		transition: all 0.15s;
	}

	.filter-chip:hover {
		background: var(--color-background-hover);
		border-color: var(--color-border-hover);
	}

	.filter-chip--active {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.filter-chip__count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 var(--space-1);
		background: rgba(255, 255, 255, 0.2);
		border-radius: var(--radius-full);
		font-size: var(--text-xs);
		font-weight: var(--weight-bold);
	}

	.filter-chip--active .filter-chip__count {
		background: rgba(255, 255, 255, 0.3);
	}
</style>
