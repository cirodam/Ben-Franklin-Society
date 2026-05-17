<script lang="ts">
	import { enhance } from '$app/forms';
	import { PageHeader, Alert, Card, Button, Input, Select } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { accounts, preselect } = $derived(data);

	let sent = $state(false);
</script>

<div class="page">
	<PageHeader title="Send Franks" />

	{#if sent}
		<Card class="success-card">
			<p>Transfer sent successfully.</p>
			<a href="/" class="btn-inline">Back to My Account</a>
			&nbsp;·&nbsp;
			<button class="btn-inline" onclick={() => sent = false}>Send another</button>
		</Card>
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
								{a.name} — {a.balance.toLocaleString()} ƒ
							</option>
						{/each}
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
						label="Amount (ƒ)"
						type="number"
						min="1"
						step="1"
						required
					/>

					<Input
						name="memo"
						label="Memo (optional)"
						type="text"
						maxlength="200"
						class="field-wide"
					/>
				</div>

				<div class="form-actions">
					<Button type="submit" variant="primary">Send</Button>
				</div>
			</form>
		</Card>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-6); }

	.form-card { max-width: 480px; }
	.success-card { max-width: 480px; color: var(--color-success); }

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	:global(.field-wide) { grid-column: 1 / -1; }

	.form-actions { margin-top: var(--space-5); }

	.btn-inline { font-size: var(--text-sm); color: var(--color-accent); background: none; border: none; cursor: pointer; padding: 0; text-decoration: none; }
	.btn-inline:hover { text-decoration: underline; }
</style>
