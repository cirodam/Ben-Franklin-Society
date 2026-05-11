<script lang="ts">
	import Badge from '@bfs/ui/src/Badge.svelte';
	import DataTable from '@bfs/ui/src/DataTable.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const columns = [
		{ key: 'title' as const,      label: 'Title' },
		{ key: 'slug' as const,       label: 'Slug',    width: '180px' },
		{ key: 'status' as const,     label: 'Status',  width: '110px' },
		{ key: 'created_at' as const, label: 'Created', width: '130px' },
	];
</script>

<div class="page">
	<h1>Documents</h1>
	<DataTable {columns} rows={data.documents} rowKey="uuid" empty="No documents yet.">
		{#snippet row(d)}
			<tr>
				<td>{d.title}</td>
				<td><code>{d.slug}</code></td>
				<td><Badge label={d.status} variant={d.status === 'active' ? 'success' : 'neutral'} /></td>
				<td>{d.created_at.slice(0, 10)}</td>
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
