<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, PageHeader, Button, Input } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { accounts, preselect } = $derived(data);

	let fromUuid = $state(preselect || (accounts[0]?.uuid ?? ''));
	let toUuid = $state('');
	let amount = $state('');
	let memo = $state('');

	// Available destination accounts (exclude the selected source account)
	const toAccounts = $derived(accounts.filter(a => a.uuid !== fromUuid));

	function fmt(n: number) {
		return n.toLocaleString();
	}

	// Auto-select first available destination if source changes
	$effect(() => {
		if (toUuid && toUuid === fromUuid) {
			toUuid = toAccounts[0]?.uuid ?? '';
		}
	});
</script>

<div class="page">
	<PageHeader title="Transfer Between Accounts" />

	{#if form?.error}
		<div class="error-message">
			{form.error}
		</div>
	{/if}

	<Card class="transfer-card">
		<form method="POST" use:enhance>
			<div class="form-group">
				<label for="from_uuid" class="t-label">From Account</label>
				<select id="from_uuid" name="from_uuid" bind:value={fromUuid} required class="select-input">
					{#each accounts as acct}
						<option value={acct.uuid}>
							{acct.name} ({fmt(acct.balance)} ƒ)
						</option>
					{/each}
				</select>
			</div>

			<div class="transfer-arrow">↓</div>

			<div class="form-group">
				<label for="to_uuid" class="t-label">To Account</label>
				<select id="to_uuid" name="to_uuid" bind:value={toUuid} required class="select-input">
					<option value="">-- Select destination --</option>
					{#each toAccounts as acct}
						<option value={acct.uuid}>
							{acct.name} ({fmt(acct.balance)} ƒ)
						</option>
					{/each}
				</select>
			</div>

			<Input
				id="amount"
				name="amount"
				label="Amount (Franks)"
				type="number"
				min="1"
				step="1"
				bind:value={amount}
				required
			/>

			<Input
				id="memo"
				name="memo"
				label="Memo (optional)"
				placeholder="e.g., Savings deposit, Moving funds"
				bind:value={memo}
			/>

			<div class="form-actions">
				<Button type="submit">Transfer Franks</Button>
				<Button type="button" variant="secondary" href="/">Cancel</Button>
			</div>
		</form>
	</Card>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 520px;
	}

	.error-message {
		padding: var(--space-4);
		background: var(--color-danger-subtle);
		border: 1px solid var(--color-danger);
		border-radius: var(--radius);
		color: var(--color-danger);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
	}

	:global(.transfer-card) {
		background: var(--parchment);
	}

	.form-group {
		margin-bottom: var(--space-5);
	}

	.form-group label {
		display: block;
		margin-bottom: var(--space-2);
	}

	.select-input {
		width: 100%;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-family: var(--font-sans);
		font-size: var(--text-base);
		color: var(--color-text);
		background: white;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.select-input:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px rgba(139, 90, 60, 0.1);
	}

	.transfer-arrow {
		text-align: center;
		font-size: var(--text-2xl);
		color: var(--color-accent);
		margin: var(--space-4) 0;
		font-weight: 300;
	}

	.form-actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-6);
	}
</style>
