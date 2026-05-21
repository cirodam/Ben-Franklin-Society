<script lang="ts">
	import { enhance } from '$app/forms';
	import { AccountFinder, Alert, Button, Card, EmptyState, Input, PageHeader } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { slips } = $derived(data);

	// Account selection state
	let fromAccount = $state<any | null>(null);
	let toAccount = $state<any | null>(null);
	let showFromFinder = $state(false);
	let showToFinder = $state(false);
	
	// Manual handle fallback
	let fromHandle = $state('');
	let toHandle = $state('');

	function fmt(n: number) { return n.toLocaleString(); }
	function date(s: string) { return s.slice(0, 16).replace('T', ' '); }
	
	// Success handling - reset form
	$effect(() => {
		if (form?.success) {
			fromAccount = null;
			toAccount = null;
			fromHandle = '';
			toHandle = '';
		}
	});
</script>

<div class="page">
	<PageHeader title="Enter Slip Transaction">
		<p class="subtitle">Record a transfer from a physical transaction slip. The slip serial number is required.</p>
	</PageHeader>

	<Card class="form-card">
		{#if form?.error}
			<Alert variant="danger">{form.error}</Alert>
		{/if}
		{#if form?.success}
			<Alert variant="success">Slip recorded successfully.</Alert>
		{/if}

		<form method="POST" use:enhance>
			<div class="form-grid">
				<!-- From Account -->
				<div class="field field--wide">
					<span>From account</span>
					{#if fromAccount}
						<div class="selected-account">
							<div>
								<strong>{fromAccount.name}</strong> — {fromAccount.name}
							</div>
							<button type="button" class="btn-sm" onclick={() => fromAccount = null}>Change</button>
						</div>
						<input type="hidden" name="from_handle" value={fromAccount.name} />
					{:else if showFromFinder}
						<AccountFinder onselect={(acc) => { fromAccount = acc; showFromFinder = false; }} showFilters={false} autoFocus={true} />
						<button type="button" class="btn-text" onclick={() => showFromFinder = false}>
							Use manual handle instead
						</button>
					{:else}
						<div class="input-group">
							<input 
								class="input" 
								bind:value={fromHandle}
								name="from_handle" 
								type="text" 
								placeholder="e.g. jane_smith" 
								required 
								autofocus 
							/>
							<button type="button" class="btn-finder" onclick={() => showFromFinder = true}>
								🔍 Find Account
							</button>
						</div>
					{/if}
				</div>

				<!-- To Account -->
				<div class="field field--wide">
					<span>To account</span>
					{#if toAccount}
						<div class="selected-account">
							<div>
								<strong>{toAccount.name}</strong> — {toAccount.name}
							</div>
							<button type="button" class="btn-sm" onclick={() => toAccount = null}>Change</button>
						</div>
						<input type="hidden" name="to_handle" value={toAccount.name} />
					{:else if showToFinder}
						<AccountFinder onselect={(acc) => { toAccount = acc; showToFinder = false; }} showFilters={false} />
						<button type="button" class="btn-text" onclick={() => showToFinder = false}>
							Use manual handle instead
						</button>
					{:else}
						<div class="input-group">
							<input 
								class="input" 
								bind:value={toHandle}
								name="to_handle" 
								type="text" 
								placeholder="e.g. food-service" 
								required 
							/>
							<button type="button" class="btn-finder" onclick={() => showToFinder = true}>
								🔍 Find Account
							</button>
						</div>
					{/if}
				</div>

				<Input
					name="amount"
					type="number"
					label="Amount (ƒ)"
					min="1"
					step="1"
					required
				/>

				<Input
					name="slip_serial"
					type="text"
					label="Slip serial number"
					placeholder="e.g. TXS-00421"
					required
				/>

				<Input
					name="memo"
					type="text"
					label="Memo (optional)"
					maxlength="200"
					class="field-wide"
				/>
			</div>

			<div class="form-actions">
				<Button type="submit" variant="primary">Record Slip</Button>
			</div>
		</form>
	</Card>

	<!-- Session slip log -->
	<section class="log-section">
		<h2>Today's Slip Log</h2>
		<p class="log-subtitle">All slip transactions you've entered today, for end-of-session review.</p>

		{#if slips.length === 0}
			<Card><EmptyState title="No slips entered yet today." /></Card>
		{:else}
			<Card class="table-card">
				<table class="table">
					<thead>
						<tr>
							<th>Time</th>
							<th>Serial</th>
							<th>From</th>
							<th>To</th>
							<th class="num">Amount</th>
							<th>Memo</th>
						</tr>
					</thead>
					<tbody>
						{#each slips as tx}
							<tr>
								<td class="mono">{date(tx.created_at)}</td>
								<td class="mono">{tx.slip_serial}</td>
								<td class="mono">@{tx.from_handle}</td>
								<td class="mono">@{tx.to_handle}</td>
								<td class="num">{fmt(tx.amount)} ƒ</td>
								<td>{tx.memo ?? ''}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</Card>
			<div class="log-total">
				{slips.length} slip{slips.length === 1 ? '' : 's'} recorded today —
				total volume: {fmt(slips.reduce((s, t) => s + t.amount, 0))} ƒ
			</div>
		{/if}
	</section>
</div>

<style>
	h2 { margin: 0; font-size: var(--text-base); font-weight: var(--weight-bold); }

	.page { display: flex; flex-direction: column; gap: var(--space-6); }
	.subtitle { margin: var(--space-1) 0 0; font-size: var(--text-sm); color: var(--color-text-muted); }

	:global(.form-card) { padding: var(--space-6); max-width: 640px); }

	.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
	.field { display: flex; flex-direction: column; gap: var(--space-2); }
	.field--wide { grid-column: 1 / -1; }
	:global(.field-wide) { grid-column: 1 / -1; }
	.field span { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-text-muted); }

	.input { font-family: var(--font-sans); font-size: var(--text-sm); padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-bg); color: var(--color-text); width: 100%; box-sizing: border-box; }
	.input:focus { outline: 2px solid var(--color-accent); outline-offset: 1px; }

	.input-group {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}
	
	.input-group .input {
		flex: 1;
	}

	.selected-account {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-3);
		background: var(--color-accent-subtle);
		border: 1px solid var(--color-accent);
		border-radius: var(--radius);
	}
	
	.badge {
		display: inline-block;
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		padding: 2px var(--space-2);
		border-radius: var(--radius);
		text-transform: uppercase;
		margin-left: var(--space-2);
	}
	
	.badge--standard {
		background: var(--color-surface);
		color: var(--color-text-muted);
	}
	
	.badge--official {
		background: var(--color-accent-subtle);
		color: var(--color-accent);
	}
	
	.badge--system {
		background: var(--color-danger-subtle);
		color: var(--color-danger);
	}

	.form-actions { margin-top: var(--space-5); }
	
	.btn-sm {
		font-size: var(--text-xs);
		padding: 3px var(--space-2);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text);
		cursor: pointer;
		font-weight: var(--weight-medium);
	}
	
	.btn-finder {
		font-size: var(--text-sm);
		padding: var(--space-2) var(--space-3);
		background: var(--color-accent);
		color: #fff;
		border: 1px solid var(--color-accent);
		border-radius: var(--radius);
		cursor: pointer;
		font-weight: var(--weight-medium);
		white-space: nowrap;
	}
	
	.btn-finder:hover {
		opacity: 0.9;
	}
	
	.btn-text {
		font-size: var(--text-xs);
		padding: var(--space-1);
		background: transparent;
		color: var(--color-text-muted);
		border: none;
		cursor: pointer;
		text-decoration: underline;
		margin-top: var(--space-1);
	}
	
	.btn-text:hover {
		color: var(--color-text);
	}

	.log-section { display: flex; flex-direction: column; gap: var(--space-3); }
	.log-subtitle { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); }

	:global(.table-card) { overflow-x: auto; }
	.table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
	.table th { text-align: left; padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
	.table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-faint); vertical-align: top; }
	.table tr:last-child td { border-bottom: none; }
	.mono { font-family: var(--font-mono); font-size: var(--text-xs); }
	.num { text-align: right; font-variant-numeric: tabular-nums; font-family: var(--font-mono); }

	.log-total { font-size: var(--text-sm); color: var(--color-text-muted); }
</style>
