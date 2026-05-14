<script lang="ts">
	import { goto } from '$app/navigation';
	import Badge from '@bfs/ui/src/Badge.svelte';
	import DataTable from '@bfs/ui/src/DataTable.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let searchInput = $state(data.filters.search ?? '');
	let statusFilter = $state(data.filters.status ?? '');
	let bodyFilter = $state(data.filters.body ?? '');

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchInput) params.set('q', searchInput);
		if (statusFilter) params.set('status', statusFilter);
		if (bodyFilter) params.set('body', bodyFilter);
		goto(`/motions?${params.toString()}`);
	}

	function clearFilters() {
		searchInput = '';
		statusFilter = '';
		bodyFilter = '';
		goto('/motions');
	}

	const columns = [
		{ key: 'title' as const,      label: 'Title' },
		{ key: 'body_name' as const,  label: 'Body',     width: '160px' },
		{ key: 'status' as const,     label: 'Status',   width: '130px' },
		{ key: 'created_at' as const, label: 'Created',  width: '130px' },
		{ key: 'resolved_at' as const, label: 'Resolved', width: '130px' },
	];

	const statusVariant = (s: string) =>
		s === 'enacted'     ? 'success'
		: s === 'rejected'  ? 'danger'
		: s === 'withdrawn' ? 'neutral'
		: s === 'vote'      ? 'warn'
		: 'accent';

	const statuses = ['draft', 'introduced', 'deliberation', 'vote', 'enacted', 'rejected', 'withdrawn'];
</script>

<div class="page">
	<div class="page-header">
		<div>
			<h1>Motion Archive</h1>
			<p class="page-subtitle">Search and browse all motions across all deliberative bodies</p>
		</div>
	</div>

	<section class="filters-card">
		<div class="filters">
			<div class="filter-field">
				<label for="search">Search</label>
				<input
					id="search"
					type="text"
					bind:value={searchInput}
					placeholder="Search titles and text..."
					class="input"
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
				/>
			</div>

			<div class="filter-field">
				<label for="status">Status</label>
				<select id="status" bind:value={statusFilter} class="select" onchange={applyFilters}>
					<option value="">All statuses</option>
					{#each statuses as status}
						<option value={status}>{status}</option>
					{/each}
				</select>
			</div>

			<div class="filter-field">
				<label for="body">Body</label>
				<select id="body" bind:value={bodyFilter} class="select" onchange={applyFilters}>
					<option value="">All bodies</option>
					{#each data.associations as assoc}
						<option value={assoc.uuid}>{assoc.name}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="filter-actions">
			<button type="button" class="btn btn--primary" onclick={applyFilters}>Apply Filters</button>
			{#if searchInput || statusFilter || bodyFilter}
				<button type="button" class="btn btn--secondary" onclick={clearFilters}>Clear Filters</button>
			{/if}
		</div>

		{#if searchInput || statusFilter || bodyFilter}
			<div class="filter-summary">
				Showing {data.motions.length} motion{data.motions.length === 1 ? '' : 's'}
				{#if searchInput}matching "{searchInput}"{/if}
				{#if statusFilter}with status "{statusFilter}"{/if}
				{#if bodyFilter}from {data.associations.find(a => a.uuid === bodyFilter)?.name ?? 'selected body'}{/if}
			</div>
		{/if}
	</section>

	<DataTable {columns} rows={data.motions} rowKey="uuid" empty="No motions match your filters.">
		{#snippet row(m)}
			<tr>
				<td class="title-cell"><a href="/motions/{m.uuid}">{m.title}</a></td>
				<td>{m.body_name}</td>
				<td><Badge label={m.status} variant={statusVariant(m.status)} /></td>
				<td>{m.created_at.slice(0, 10)}</td>
				<td>{m.resolved_at ? m.resolved_at.slice(0, 10) : '—'}</td>
			</tr>
		{/snippet}
	</DataTable>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.page-header h1 {
		margin: 0;
	}

	.page-subtitle {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: 0;
	}

	:global(.title-cell) {
		max-width: 400px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Filters */
	.filters-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.filters {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: var(--space-4);
	}

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.filter-field label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	.input,
	.select {
		font-size: var(--text-sm);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-background);
		color: var(--color-text);
		width: 100%;
		box-sizing: border-box;
	}

	.filter-actions {
		display: flex;
		gap: var(--space-3);
	}

	.filter-summary {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		padding: var(--space-2);
		background: var(--color-accent-subtle);
		border-radius: var(--radius);
		text-align: center;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.filters {
			grid-template-columns: 1fr;
		}

		.filter-actions {
			flex-direction: column;
		}

		.filter-actions button {
			width: 100%;
		}
	}
</style>
