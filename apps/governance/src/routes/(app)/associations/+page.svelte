<script lang="ts">
	import Badge from '@bfs/ui/src/Badge.svelte';
	import DataTable from '@bfs/ui/src/DataTable.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const columns = [
		{ key: 'handle' as const,  label: 'Handle',      width: '160px' },
		{ key: 'name' as const,    label: 'Name' },
		{ key: 'type' as const,    label: 'Type',        width: '130px' },
		{ key: 'status' as const,  label: 'Status',      width: '110px' },
		{ key: 'created_at' as const, label: 'Established', width: '130px' },
	];

	const typeVariant = (t: string) =>
		t === 'general_assembly' ? 'accent'
		: t === 'central_bank' ? 'accent'
		: t === 'social_insurance_fund' ? 'accent'
		: t === 'community_bank' ? 'accent'
		: t === 'college' ? 'accent'
		: 'neutral';

	const systemRoute: Record<string, string> = {
		general_assembly:    '/general-assembly',
		central_bank:        '/central-bank',
		social_insurance_fund: '/social-insurance',
		community_bank:      '/community-bank',
	};

	function hrefFor(a: { type: string; uuid: string }): string {
		return systemRoute[a.type] ?? `/associations/${a.uuid}`;
	}
</script>

<div class="page">
	<h1>Associations</h1>
	<DataTable {columns} rows={data.associations} rowKey="uuid" empty="No associations yet.">
		{#snippet row(a)}
			<tr>
				<td><a href={hrefFor(a)}><code>@{a.handle}</code></a></td>
				<td><a href={hrefFor(a)}>{a.name}</a></td>
				<td><Badge label={a.type} variant={typeVariant(a.type)} /></td>
				<td><Badge label={a.status} variant={a.status === 'active' ? 'success' : 'neutral'} /></td>
				<td>{a.created_at.slice(0, 10)}</td>
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
