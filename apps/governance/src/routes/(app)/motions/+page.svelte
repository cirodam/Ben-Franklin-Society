<script lang="ts">
	import Badge from '@bfs/ui/src/Badge.svelte';
	import DataTable from '@bfs/ui/src/DataTable.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const columns = [
		{ key: 'title' as const,      label: 'Title' },
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
</script>

<div class="page">
	<h1>Motions</h1>
	<DataTable {columns} rows={data.motions} rowKey="uuid" empty="No motions yet.">
		{#snippet row(m)}
			<tr>
				<td class="title-cell">{m.title}</td>
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

	:global(.title-cell) {
		max-width: 400px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
