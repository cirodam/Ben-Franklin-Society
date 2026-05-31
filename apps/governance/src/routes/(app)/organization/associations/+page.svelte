<script lang="ts">
	import Badge from '@bfs/ui/src/Badge.svelte';
	import DataTable from '@bfs/ui/src/DataTable.svelte';
	import { Input, PageHeader, Select } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let typeFilter = $state('all');
	let statusFilter = $state('all');

	const filteredAssociations = $derived.by(() => {
		let result = data.associations;

		// Apply search
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(a =>
				a.name.toLowerCase().includes(q) ||
				a.handle.toLowerCase().includes(q)
			);
		}

		// Apply type filter
		if (typeFilter !== 'all') {
			result = result.filter(a => a.type === typeFilter);
		}

		// Apply status filter
		if (statusFilter !== 'all') {
			result = result.filter(a => a.status === statusFilter);
		}

		return result;
	});

	const columns = [
		{ key: 'handle' as const,  label: 'Handle',      width: '160px' },
		{ key: 'name' as const,    label: 'Name' },
		{ key: 'type' as const,    label: 'Type',        width: '130px' },
		{ key: 'status' as const,  label: 'Status',      width: '110px' },
		{ key: 'created_at' as const, label: 'Established', width: '130px' },
	];

	const typeVariant = (t: string) =>
		t === 'general_assembly' ? 'accent'
		: t === 'college' ? 'accent'
		: 'neutral';

	const systemRoute: Record<string, string> = {
		general_assembly: '/general-assembly',
	};

	function hrefFor(a: { type: string; uuid: string }): string {
		return systemRoute[a.type]
			?? (a.type === 'service'   ? `/services/${a.uuid}`
			:  a.type === 'committee' ? `/organization/committees/${a.uuid}`
			:  a.type === 'college'   ? `/colleges/${a.uuid}`
			:  `/associations/${a.uuid}`);
	}
</script>

<div class="page">
	<PageHeader title="Associations" />
	
	<div class="controls">
		<Input
			type="search"
			placeholder="Search by name or handle..."
			bind:value={searchQuery}
		/>
		
		<div class="filters">
			<Select bind:value={typeFilter}>
				<option value="all">All Types</option>
				<option value="general_assembly">General Assembly</option>
				<option value="college">College</option>
				<option value="service">Service</option>
				<option value="committee">Committee</option>
				<option value="association">Association</option>
			</Select>

			<Select bind:value={statusFilter}>
				<option value="all">All Statuses</option>
				<option value="active">Active</option>
				<option value="inactive">Inactive</option>
			</Select>
		</div>
	</div>

	<DataTable {columns} rows={filteredAssociations as any} rowKey="uuid" empty="No associations match your search.">
		{#snippet row(a)}
			{@const assoc = a as unknown as typeof data.associations[number]}
			<tr>
				<td><a href={hrefFor(assoc)}><code>{assoc.handle}</code></a></td>
				<td><a href={hrefFor(assoc)}>{assoc.name}</a></td>
				<td><Badge label={assoc.type} variant={typeVariant(assoc.type)} /></td>
				<td><Badge label={assoc.status} variant={assoc.status === 'active' ? 'success' : 'neutral'} /></td>
				<td>{assoc.created_at.slice(0, 10)}</td>
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

	.controls {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		flex-wrap: wrap;
	}

	.search-input {
		flex: 1;
		min-width: 280px;
		font-size: var(--text-sm);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.search-input::placeholder {
		color: var(--color-text-muted);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px var(--color-accent-subtle);
	}

	.filters {
		display: flex;
		gap: var(--space-2);
	}

	.filter-select {
		font-size: var(--text-sm);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-surface);
		color: var(--color-text);
		cursor: pointer;
	}

	.filter-select:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px var(--color-accent-subtle);
	}

	code {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
</style>
