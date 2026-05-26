<script lang="ts">
	import { enhance } from '$app/forms';
	import { PageHeader, Alert, Card, Button, Input, Select } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { accounts, preselect } = $derived(data);

	let sent = $state(false);
	
	// Format cents as currency (e.g., 1254 -> "12.54")
	function fmtCurrency(cents: number): string {
		return (cents / 100).toFixed(2);
	}
</script>

<div class="page">
	<PageHeader title="Send Payment" />

	{#if sent}
		<div class="success-receipt">
			<div class="receipt-stamp">Sent</div>
			
			<div class="receipt-header">
				<h2 class="receipt-title">Transfer Complete</h2>
				<p class="receipt-subtitle">Your franks have been sent successfully.</p>
			</div>
			
			<div class="receipt-actions">
				<a href="/" class="btn-inline">← Back to My Account</a>
				<span class="separator">·</span>
				<button class="btn-inline" onclick={() => sent = false}>Send Another</button>
			</div>
		</div>
	{:else}
		<Card class="form-card">
			{#if form?.error}
				<Alert variant="danger">{form.error}</Alert>
			{/if}
			<form method="POST" use:enhance={() => {
				return ({ result, update }) => {
					if (result.type === 'success') sent = true;
					update({ reset: result.type === 'success' });
				};
			}}>
				<div class="form-grid">
					<Select name="from_uuid" label="From account" required>
						{#each accounts as a}
							<option value={a.uuid} selected={a.uuid === preselect}>
							{a.name} — {fmtCurrency(a.franks_balance)} F / {fmtCurrency(a.florens_balance)} ₣
						</option>
					{/each}
				</Select>

				<Select name="currency" label="Currency">
					<option value="franks">🟢 Franks (local only)</option>
					<option value="florens">🟡 Florens (works everywhere)</option>
				</Select>

				<Input
					name="to_handle"
					label="To (handle)"
					type="text"
					placeholder="e.g. jane_smith or food-service"
					required
				/>

				<Input
					name="amount"
					label="Amount"
					type="number"
					min="0.01"
					step="0.01"
					required
				/>

				<Input
						class="field-wide"
					/>
				</div>

				<div class="form-actions">
					<Button type="submit" variant="primary">Send Payment</Button>
					<a href="/" class="btn-text">Cancel</a>
				</div>
			</form>
		</Card>
	{/if}
</div>

<style>
	.page { 
		display: flex; 
		flex-direction: column; 
		gap: var(--space-6);
	}

	.form-card { 
		max-width: 520px; 
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-5);
	}

	:global(.field-wide) { 
		grid-column: 1 / -1; 
	}

	.form-actions { 
		margin-top: var(--space-6);
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	/* Success receipt styling */
	.success-receipt {
		max-width: 520px;
		background: var(--olive-light);
		border: 2px solid var(--olive);
		border-top: 4px dashed var(--olive);
		border-radius: var(--radius-lg);
		padding: var(--space-8);
		position: relative;
	}

	.receipt-stamp {
		position: absolute;
		top: var(--space-5);
		right: var(--space-5);
		padding: 0.5rem 1.25rem;
		background: var(--olive);
		color: white;
		border-radius: var(--radius);
		text-transform: uppercase;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 700;
		letter-spacing: 0.12em;
		transform: rotate(-5deg);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
	}

	.receipt-header {
		margin-bottom: var(--space-6);
	}

	.receipt-title {
		font-family: var(--font-sans);
		font-size: var(--text-2xl);
		font-weight: 600;
		color: var(--olive);
		margin-bottom: var(--space-2);
	}

	.receipt-subtitle {
		font-family: var(--font-serif);
		font-size: var(--text-md);
		color: var(--ink);
		line-height: 1.6;
	}

	.receipt-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding-top: var(--space-4);
		border-top: 1px dashed var(--olive);
	}

	.separator {
		color: var(--ink-faint);
		user-select: none;
	}

	.btn-inline {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--copper);
		text-decoration: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: color 0.2s;
	}
	
	.btn-inline:hover { 
		color: var(--copper-mid);
		text-decoration: underline; 
	}

	.btn-text {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--ink-mid);
		text-decoration: none;
		transition: color 0.2s;
	}
	
	.btn-text:hover {
		color: var(--ink);
		text-decoration: underline;
	}

	@media (max-width: 640px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
