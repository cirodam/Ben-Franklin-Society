<script lang="ts" generics="T extends Record<string, unknown>">
	import type { Snippet } from 'svelte';

	type Column<R> = {
		key: keyof R;
		label: string;
		width?: string;
	};

	let {
		columns,
		rows,
		rowKey,
		empty = 'No records found.',
		row: rowSnippet,
	}: {
		columns: Column<T>[];
		rows: T[];
		rowKey: keyof T;
		empty?: string;
		row: Snippet<[T]>;
	} = $props();
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				{#each columns as col}
					<th style={col.width ? `width:${col.width}` : ''}>{col.label}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if rows.length === 0}
				<tr>
					<td class="empty" colspan={columns.length}>{empty}</td>
				</tr>
			{:else}
				{#each rows as r (r[rowKey])}
					{@render rowSnippet(r)}
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		width: 100%;
		overflow-x: auto;
		border: 1px solid rgba(45, 90, 79, 0.2);
		background: white;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
	}

	thead {
		background: rgba(45, 90, 79, 0.03);
		border-bottom: 1px solid rgba(45, 90, 79, 0.2);
	}

	th {
		text-align: left;
		font-family: 'IM Fell English SC', serif;
		font-weight: 400;
		color: #374340;
		font-size: var(--text-xs);
		text-transform: lowercase;
		letter-spacing: 0.1em;
		padding: var(--space-3) var(--space-4);
		white-space: nowrap;
	}

	:global(tbody tr) {
		border-bottom: 1px solid rgba(45, 90, 79, 0.1);
	}

	:global(tbody tr:last-child) {
		border-bottom: none;
	}

	:global(tbody tr:hover) {
		background: rgba(122, 92, 26, 0.03);
	}

	:global(tbody td) {
		padding: var(--space-3) var(--space-4);
		vertical-align: middle;
		color: #151c1a;
	}

	.empty {
		text-align: center;
		color: #9ca3af;
		font-style: italic;
		padding: var(--space-8) !important;
	}
</style>
