<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { q, accounts } = $derived(data);

	function fmt(n: number) { return n.toLocaleString(); }
</script>

<div class="page">
	<h1>Accounts</h1>

	<form method="GET" action="/admin" class="search-form">
		<input
			class="input"
			name="q"
			type="text"
			placeholder="Search by handle or account name…"
			value={q}
			autofocus
		/>
		<button type="submit" class="btn btn--primary">Search</button>
		{#if q}<a href="/admin" class="btn btn--ghost">Clear</a>{/if}
	</form>

	<div class="card table-card">
		<div class="card__label">
			{#if q}Results for "{q}"{:else}All Accounts{/if}
			— {accounts.length} shown
		</div>
		{#if accounts.length === 0}
			<p class="empty">No accounts found.</p>
		{:else}
			<table class="table">
				<thead>
					<tr>
						<th>Handle</th>
						<th>Account Name</th>
						<th class="num">Balance (ƒ)</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each accounts as acct}
						<tr class={acct.status === 'frozen' ? 'row--frozen' : ''}>
							<td class="mono">@{acct.handle_cache}</td>
							<td>{acct.name}</td>
							<td class="num {acct.balance < 0 ? 'negative' : ''}">{fmt(acct.balance)}</td>
							<td>
								{#if acct.status === 'frozen'}
									<span class="badge badge--frozen">Frozen</span>
								{:else}
									<span class="badge badge--active">Active</span>
								{/if}
							</td>
							<td>
								<a href="/admin/accounts/{acct.uuid}" class="link">View →</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<style>
	h1 { margin: 0 0 var(--space-6); font-size: var(--text-xl); font-weight: var(--weight-bold); }

	.page { display: flex; flex-direction: column; gap: var(--space-5); }

	.search-form { display: flex; gap: var(--space-3); max-width: 520px; }
	.input { flex: 1; font-family: var(--font-sans); font-size: var(--text-sm); padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-bg); color: var(--color-text); }
	.input:focus { outline: 2px solid var(--color-accent); outline-offset: 1px; }

	.btn { display: inline-flex; align-items: center; font-family: var(--font-sans); font-size: var(--text-sm); padding: var(--space-2) var(--space-4); border: 1px solid transparent; border-radius: var(--radius); cursor: pointer; font-weight: var(--weight-medium); text-decoration: none; }
	.btn--primary { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }
	.btn--primary:hover { opacity: 0.9; }
	.btn--ghost { background: transparent; color: var(--color-text-muted); border-color: var(--color-border); }
	.btn--ghost:hover { background: var(--color-surface); }

	.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
	.card__label { font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-faint); }

	.table-card { overflow-x: auto; }
	.table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
	.table th { text-align: left; padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
	.table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-faint); vertical-align: middle; }
	.table tr:last-child td { border-bottom: none; }
	.row--frozen td { background: var(--color-warn-subtle, #fff8e1); }

	.mono { font-family: var(--font-mono); font-size: var(--text-xs); }
	.num { text-align: right; font-variant-numeric: tabular-nums; font-family: var(--font-mono); }
	.negative { color: var(--color-danger); }

	.badge { font-size: var(--text-xs); padding: 2px var(--space-2); border-radius: var(--radius); font-weight: var(--weight-medium); }
	.badge--active { background: var(--color-success-subtle, #e6f4ea); color: var(--color-success); }
	.badge--frozen { background: var(--color-warn-subtle, #fff8e1); color: var(--color-warn); }

	.link { font-size: var(--text-sm); color: var(--color-accent); text-decoration: none; }
	.link:hover { text-decoration: underline; }

	.empty { padding: var(--space-6); text-align: center; color: var(--color-text-muted); margin: 0; }
</style>
