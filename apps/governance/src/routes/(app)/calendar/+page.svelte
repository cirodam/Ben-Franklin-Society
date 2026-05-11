<script lang="ts">
	import DataTable from '@bfs/ui/src/DataTable.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const columns = [
		{ key: 'title' as const,       label: 'Event' },
		{ key: 'starts_at' as const,   label: 'Starts',    width: '160px' },
		{ key: 'ends_at' as const,     label: 'Ends',      width: '160px' },
		{ key: 'location' as const,    label: 'Location',  width: '180px' },
	];

	function fmt(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleString(undefined, {
			month: 'short', day: 'numeric', year: 'numeric',
			hour: '2-digit', minute: '2-digit',
		});
	}
</script>

<div class="page">
	<h1>Calendar</h1>
	<DataTable {columns} rows={data.events} rowKey="uuid" empty="No upcoming events.">
		{#snippet row(e)}
			<tr>
				<td>{e.title}</td>
				<td>{fmt(e.starts_at)}</td>
				<td>{fmt(e.ends_at)}</td>
				<td>{e.location ?? '—'}</td>
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
</style>
