<script lang="ts">
	import DataTable from '@bfs/ui/src/DataTable.svelte';
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
	<div class="page-header">
		<h1>Community Config</h1>
		<a href="/config/edit" class="btn btn--secondary">✏️ Edit Config</a>
	</div>
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

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
	}

	.page-header h1 {
		margin: 0;
	}

	.btn {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		white-space: nowrap;
	}

	.btn--secondary {
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text);
	}

	.btn:hover {
		filter: brightness(0.92);
	}

	code {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
</style>
