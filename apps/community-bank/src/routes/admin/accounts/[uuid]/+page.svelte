<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { account, transactions, auditLog, principalLabel, page, pageSize } = $derived(data);

	function fmt(n: number) { return n.toLocaleString(); }
	function date(s: string) { return s.slice(0, 16).replace('T', ' '); }
</script>

<div class="page">
	<div class="page-header">
		<a href="/admin" class="back-link">← Accounts</a>
		<h1>
			{account.name}
			<span class="handle">@{account.handle_cache}</span>
		</h1>
		<div class="principal">{principalLabel}</div>
	</div>

	{#if form?.error}
		<div class="error-banner">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="success-banner">Action completed successfully.</div>
	{/if}

	<!-- Balance + freeze toggle -->
	<div class="info-row">
		<div class="stat-card">
			<div class="stat-card__label">Balance</div>
			<div class="stat-card__value {account.balance < 0 ? 'negative' : ''}">{fmt(account.balance)} ƒ</div>
		</div>
		<div class="stat-card">
			<div class="stat-card__label">Status</div>
			<div class="stat-card__value">{account.status}</div>
		</div>
		<div class="freeze-actions">
			{#if account.status === 'active'}
				<form method="POST" action="?/freeze" use:enhance>
					<button type="submit" class="btn btn--danger">Freeze Account</button>
				</form>
			{:else}
				<form method="POST" action="?/unfreeze" use:enhance>
					<button type="submit" class="btn btn--primary">Unfreeze Account</button>
				</form>
			{/if}
		</div>
	</div>

	<!-- Manual correction -->
	<div class="card form-card">
		<div class="card__label">Manual Correction</div>
		<form method="POST" action="?/correct" use:enhance class="correction-form">
			<div class="form-row">
				<label class="field">
					<span>Direction</span>
					<select class="input" name="direction" required>
						<option value="">Select…</option>
						<option value="credit">Credit (add funds)</option>
						<option value="debit">Debit (remove funds)</option>
					</select>
				</label>

				<label class="field">
					<span>Amount (ƒ)</span>
					<input class="input" name="amount" type="number" min="1" step="1" required />
				</label>

				<label class="field field--wide">
					<span>Memo (required, min 10 chars — describe why)</span>
					<input class="input" name="memo" type="text" minlength="10" maxlength="500" required />
				</label>
			</div>
			<button type="submit" class="btn btn--warn">Post Correction</button>
		</form>
	</div>

	<!-- Transaction history -->
	<div class="card table-card">
		<div class="card__label">
			Transaction History — page {page + 1}
			{#if page > 0}
				<a href="/admin/accounts/{account.uuid}?page={page - 1}" class="page-link">← Prev</a>
			{/if}
			{#if transactions.length === pageSize}
				<a href="/admin/accounts/{account.uuid}?page={page + 1}" class="page-link">Next →</a>
			{/if}
		</div>
		{#if transactions.length === 0}
			<p class="empty">No transactions yet.</p>
		{:else}
			<table class="table">
				<thead>
					<tr>
						<th>Date</th>
						<th>Type</th>
						<th>Source</th>
						<th>From</th>
						<th>To</th>
						<th class="num">Amount</th>
						<th>Slip</th>
						<th>Memo</th>
					</tr>
				</thead>
				<tbody>
					{#each transactions as tx}
						<tr>
							<td class="mono">{date(tx.created_at)}</td>
							<td>{tx.type}</td>
							<td>{tx.source}</td>
							<td class="mono">@{tx.from_handle}</td>
							<td class="mono">@{tx.to_handle}</td>
							<td class="num {tx.from_uuid === account.uuid ? 'out' : 'in'}">
								{tx.from_uuid === account.uuid ? '−' : '+'}{fmt(tx.amount)} ƒ
							</td>
							<td class="mono">{tx.slip_serial ?? ''}</td>
							<td>{tx.memo ?? ''}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>

	<!-- Audit log -->
	{#if auditLog.length > 0}
		<div class="card table-card">
			<div class="card__label">Admin Audit Log</div>
			<table class="table">
				<thead>
					<tr>
						<th>Date</th>
						<th>Action</th>
						<th>Memo</th>
					</tr>
				</thead>
				<tbody>
					{#each auditLog as entry}
						<tr>
							<td class="mono">{date(entry.created_at)}</td>
							<td>{entry.action}</td>
							<td>{entry.memo}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); display: flex; align-items: baseline; gap: var(--space-3); }
	.handle { font-family: var(--font-mono); font-size: var(--text-base); color: var(--color-text-muted); }

	.page { display: flex; flex-direction: column; gap: var(--space-6); }

	.page-header { display: flex; flex-direction: column; gap: var(--space-1); }
	.back-link { font-size: var(--text-sm); color: var(--color-text-muted); text-decoration: none; }
	.back-link:hover { color: var(--color-accent); }
	.principal { font-size: var(--text-sm); color: var(--color-text-muted); }

	.error-banner { background: var(--color-danger-subtle); color: var(--color-danger); border-radius: var(--radius); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); }
	.success-banner { background: var(--color-success-subtle); color: var(--color-success); border-radius: var(--radius); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); }

	.info-row { display: flex; gap: var(--space-4); align-items: flex-end; flex-wrap: wrap; }
	.stat-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5); min-width: 140px; }
	.stat-card__label { font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); margin-bottom: var(--space-1); }
	.stat-card__value { font-size: var(--text-xl); font-weight: var(--weight-bold); font-variant-numeric: tabular-nums; }
	.stat-card__value.negative { color: var(--color-danger); }
	.freeze-actions { margin-left: auto; }

	.btn { display: inline-flex; align-items: center; font-family: var(--font-sans); font-size: var(--text-sm); padding: var(--space-2) var(--space-4); border: 1px solid transparent; border-radius: var(--radius); cursor: pointer; font-weight: var(--weight-medium); text-decoration: none; }
	.btn--primary { background: var(--color-accent); color: #fff; }
	.btn--primary:hover { opacity: 0.9; }
	.btn--danger { background: var(--color-danger); color: #fff; }
	.btn--danger:hover { opacity: 0.9; }
	.btn--warn { background: #b45309; color: #fff; }
	.btn--warn:hover { opacity: 0.9; }

	.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
	.card__label { font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-faint); display: flex; gap: var(--space-4); align-items: center; }

	.form-card { padding: var(--space-5); }
	.correction-form { display: flex; flex-direction: column; gap: var(--space-4); }
	.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
	.field { display: flex; flex-direction: column; gap: var(--space-1); }
	.field--wide { grid-column: 1 / -1; }
	.field span { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-text-muted); }
	.input { font-family: var(--font-sans); font-size: var(--text-sm); padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-bg); color: var(--color-text); width: 100%; box-sizing: border-box; }
	.input:focus { outline: 2px solid var(--color-accent); outline-offset: 1px; }

	.table-card { overflow-x: auto; }
	.table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
	.table th { text-align: left; padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
	.table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-faint); vertical-align: top; }
	.table tr:last-child td { border-bottom: none; }
	.mono { font-family: var(--font-mono); font-size: var(--text-xs); }
	.num { text-align: right; font-variant-numeric: tabular-nums; font-family: var(--font-mono); }
	.in { color: var(--color-success); }
	.out { color: var(--color-danger); }

	.page-link { font-size: var(--text-xs); color: var(--color-accent); text-decoration: none; }
	.page-link:hover { text-decoration: underline; }

	.empty { padding: var(--space-6); text-align: center; color: var(--color-text-muted); margin: 0; }
</style>
