<script lang="ts">
	import { PageHeader, Card, Button, Input } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { q, result, recentTxs } = $derived(data);

	function fmt(n: number) { return n.toLocaleString(); }
	function date(s: string) { return s.slice(0, 16).replace('T', ' '); }
</script>

<div class="page">
	<PageHeader title="Account Lookup" />

	<form method="GET" action="/teller" class="lookup-form">
		<Input
			name="q"
			type="text"
			placeholder="Handle (e.g. jane_smith or food-service)"
			value={q}
			class="lookup-input"
		/>
		<Button type="submit" variant="primary">Look Up</Button>
	</form>

	{#if q && !result}
		<Card class="empty-card">
			<p>No account found for <code>@{q}</code>.</p>
		</Card>
	{/if}

	{#if result}
		<div class="result-section">
			<div class="result-label">{result.label}</div>

			<div class="account-list">
				{#each result.accounts as acct}
					<div class="account-row {acct.status === 'frozen' ? 'account-row--frozen' : ''}">
						<span class="account-name">{acct.name}</span>
						<span class="account-balance {acct.balance < 0 ? 'negative' : ''}">{fmt(acct.balance)} ƒ</span>
						{#if acct.status === 'frozen'}<span class="badge-frozen">Frozen</span>{/if}
					</div>
				{/each}
			</div>

			{#if recentTxs.length > 0}
				<Card class="table-card">
					<div class="card__label">Recent Transactions (Primary Account)</div>
					<table class="table">
						<thead>
							<tr>
								<th>Date</th>
								<th>Type</th>
								<th>From</th>
								<th>To</th>
								<th class="num">Amount</th>
								<th>Memo</th>
							</tr>
						</thead>
						<tbody>
							{#each recentTxs as tx}
								{@const primary = result.accounts.find(a => a.name === 'Primary') ?? result.accounts[0]}
								<tr>
									<td class="mono">{date(tx.created_at)}</td>
									<td>{tx.type}</td>
									<td class="mono">@{tx.from_handle}</td>
									<td class="mono">@{tx.to_handle}</td>
									<td class="num {tx.from_uuid === primary.uuid ? 'out' : 'in'}">
										{tx.from_uuid === primary.uuid ? '−' : '+'}{fmt(tx.amount)} ƒ
									</td>
									<td>{tx.memo ?? ''}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</Card>
			{/if}
		</div>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); }

	.lookup-form { display: flex; gap: var(--space-3); max-width: 500px; align-items: flex-start; }
	:global(.lookup-input) { flex: 1; }

	.empty-card { padding: var(--space-5); max-width: 400px; }
	.empty-card p { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); }

	.result-section { display: flex; flex-direction: column; gap: var(--space-4); }
	.result-label { font-size: var(--text-base); font-weight: var(--weight-medium); }

	.account-list { display: flex; flex-direction: column; gap: var(--space-2); max-width: 420px; }
	.account-row {
		display: flex; align-items: center; gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius);
	}
	.account-row--frozen { border-color: var(--color-warn); opacity: 0.85; }
	.account-name { flex: 1; font-size: var(--text-sm); }
	.account-balance { font-variant-numeric: tabular-nums; font-weight: var(--weight-medium); font-family: var(--font-mono); }
	.account-balance.negative { color: var(--color-danger); }
	.badge-frozen { font-size: var(--text-xs); padding: 1px var(--space-2); border-radius: var(--radius); background: var(--color-warn-subtle); color: var(--color-warn); }

	:global(.table-card) { overflow-x: auto; }
	.card__label { font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-faint); }
	.table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
	.table th { text-align: left; padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
	.table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-faint); vertical-align: top; }
	.table tr:last-child td { border-bottom: none; }
	.mono { font-family: var(--font-mono); font-size: var(--text-xs); }
	.num { text-align: right; font-variant-numeric: tabular-nums; font-family: var(--font-mono); }
	.in { color: var(--color-success); }
	.out { color: var(--color-danger); }
</style>
