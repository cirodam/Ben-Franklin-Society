<script lang="ts">
	import { goto } from '$app/navigation';
	import Badge from '@bfs/ui/src/Badge.svelte';
	import DataTable from '@bfs/ui/src/DataTable.svelte';
	import { Button, PageHeader, Select } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let statusFilter = $state(data.filters.status ?? '');
	let bodyFilter = $state(data.filters.body ?? '');

	function applyFilters() {
		const params = new URLSearchParams();
		if (statusFilter) params.set('status', statusFilter);
		if (bodyFilter) params.set('body', bodyFilter);
		goto(`/vote-sessions?${params.toString()}`);
	}

	function clearFilters() {
		statusFilter = '';
		bodyFilter = '';
		goto('/governance/vote-sessions');
	}

	const columns = [
		{ key: 'motion_title' as const, label: 'Motion' },
		{ key: 'body_name' as const, label: 'Body', width: '180px' },
		{ key: 'status' as const, label: 'Status', width: '120px' },
		{ key: 'opens_at' as const, label: 'Opens', width: '150px' },
		{ key: 'closes_at' as const, label: 'Closes', width: '150px' },
	];

	const statusVariant = (s: string) =>
		s === 'open' ? 'success'
		: s === 'finalized' ? 'neutral'
		: s === 'scheduled' ? 'accent'
		: 'warn'; // closed

	const statuses = ['scheduled', 'open', 'closed', 'finalized'];

	function formatDateTime(dt: string | null): string {
		if (!dt) return '—';
		const d = new Date(dt);
		return d.toLocaleString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			hour: 'numeric', 
			minute: '2-digit' 
		});
	}
</script>

<div class="page">
	<PageHeader 
		title="Vote Sessions" 
		description="View and participate in active voting sessions"
	/>

	<section class="filters-card">
		<div class="filters">
			<div class="filter-field">
				<Select label="Status" bind:value={statusFilter} onchange={applyFilters}>
					<option value="">All statuses</option>
					{#each statuses as status}
						<option value={status}>{status}</option>
					{/each}
				</Select>
			</div>

			<div class="filter-field">
				<Select label="Body" bind:value={bodyFilter} onchange={applyFilters}>
					<option value="">All bodies</option>
					{#each data.associations as assoc}
						<option value={assoc.uuid}>{assoc.name}</option>
					{/each}
				</Select>
			</div>

			<div class="filter-actions">
				<Button variant="secondary" onclick={clearFilters}>Clear</Button>
			</div>
		</div>
	</section>

	<section class="main-card">
		<DataTable
			data={data.sessions}
			{columns}
			onRowClick={(session) => goto(`/vote-sessions/${session.uuid}`)}
		>
			{#snippet cell(col, row)}
				{#if col.key === 'motion_title'}
					<div class="motion-cell">
						<span class="motion-title">{row.motion_title}</span>
						{#if row.body_abbreviation}
							<span class="body-abbr">({row.body_abbreviation})</span>
						{/if}
					</div>
				{:else if col.key === 'body_name'}
					{row.body_name}
				{:else if col.key === 'status'}
					<Badge variant={statusVariant(row.status)}>
						{row.status}
					</Badge>
				{:else if col.key === 'opens_at'}
					{formatDateTime(row.opens_at)}
				{:else if col.key === 'closes_at'}
					{formatDateTime(row.closes_at)}
				{/if}
			{/snippet}
		</DataTable>

		{#if data.sessions.length === 0}
			<div class="empty">
				<p>No vote sessions found.</p>
			</div>
		{/if}
	</section>
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-6);
	}

	.filters-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.filters {
		display: flex;
		gap: var(--space-3);
		align-items: flex-end;
	}

	.filter-field {
		flex: 1;
		min-width: 200px;
	}

	.filter-actions {
		display: flex;
		gap: var(--space-2);
	}

	.main-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.motion-cell {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.motion-title {
		font-weight: 500;
	}

	.body-abbr {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.empty {
		padding: var(--space-8);
		text-align: center;
		color: var(--color-text-muted);
	}
</style>
