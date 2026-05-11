<script lang="ts">
	import Badge from '@bfs/ui/src/Badge.svelte';
	import DataTable from '@bfs/ui/src/DataTable.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const columns = [
		{ key: 'handle' as const,      label: 'Handle',     width: '160px' },
		{ key: 'given_name' as const,  label: 'Name' },
		{ key: 'date_of_birth' as const, label: 'DOB',      width: '120px' },
		{ key: 'status' as const,      label: 'Status',     width: '110px' },
		{ key: 'joined_at' as const,   label: 'Joined',     width: '130px' },
	];

	const statusVariant = (s: string) =>
		s === 'active' ? 'success' : s === 'suspended' ? 'warn' : 'danger';
</script>

<div class="page">
	<h1>People</h1>
	<DataTable {columns} rows={data.people} rowKey="uuid" empty="No people yet.">
		{#snippet row(p)}
			<tr>
				<td><code>{p.handle}</code></td>
				<td>{p.given_name} {p.family_name}</td>
				<td>{p.date_of_birth}</td>
				<td><Badge label={p.status} variant={statusVariant(p.status)} /></td>
				<td>{p.joined_at.slice(0, 10)}</td>
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
