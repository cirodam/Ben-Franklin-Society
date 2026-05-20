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
		border: 1px solid var(--border);
		background: var(--paper);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
	}

	thead {
		background: var(--tint-green);
		border-bottom: 1px solid var(--border);
	}

	th {
		text-align: left;
		font-family: 'IM Fell English SC', serif;
		font-weight: 400;
		color: var(--ink-mid);
		font-size: var(--text-xs);
		text-transform: lowercase;
		letter-spacing: 0.1em;
		padding: var(--space-3) var(--space-4);
		white-space: nowrap;
	}

	:global(tbody tr) {
		border-bottom: 1px solid var(--border-faint);
	}

	:global(tbody tr:last-child) {
		border-bottom: none;
	}

	:global(tbody tr:hover) {
		background: var(--tint-gold);
	}

	:global(tbody td) {
		padding: var(--space-3) var(--space-4);
		vertical-align: middle;
		color: var(--ink);
	}

	.empty {
		text-align: center;
		color: #9ca3af;
		font-style: italic;
		padding: var(--space-8) !important;
	}
</style>
