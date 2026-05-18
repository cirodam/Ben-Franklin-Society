<script lang="ts">
	import DataTable from '@bfs/ui/src/DataTable.svelte';
	import { Button, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const columns = [
		{ key: 'key' as const,         label: 'Key',         width: '220px' },
		{ key: 'value' as const,       label: 'Value',       width: '200px' },
		{ key: 'description' as const, label: 'Description' },
		{ key: 'updated_at' as const,  label: 'Last updated', width: '130px' },
	];
</script>

<div class="page">
	<PageHeader title="Community Config">
		{#snippet actions()}
			<Button href="/admin/config/edit" variant="secondary">✏️ Edit Config</Button>
		{/snippet}
	</PageHeader>
	<DataTable {columns} rows={data.entries} rowKey="key" empty="No configuration entries yet. Values are set via enacted motions.">
		{#snippet row(e)}
			<tr>
				<td><code>{e.key}</code></td>
				<td><code>{e.value}</code></td>
				<td>{e.description}</td>
				<td>{e.updated_at.slice(0, 10)}</td>
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

	code {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
</style>
