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
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}

	thead {
		background: var(--color-bg);
		border-bottom: 1px solid var(--color-border);
	}

	th {
		text-align: left;
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: var(--space-3) var(--space-4);
		white-space: nowrap;
	}

	:global(tbody tr) {
		border-bottom: 1px solid var(--color-border-faint);
	}

	:global(tbody tr:last-child) {
		border-bottom: none;
	}

	:global(tbody tr:hover) {
		background: var(--color-bg);
	}

	:global(tbody td) {
		padding: var(--space-3) var(--space-4);
		vertical-align: middle;
		color: var(--color-text);
	}

	.empty {
		text-align: center;
		color: var(--color-text-subtle);
		padding: var(--space-8) !important;
	}
</style>
