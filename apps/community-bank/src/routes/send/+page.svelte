<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { accounts, preselect } = $derived(data);

	let sent = $state(false);
</script>

<div class="page">
	<div class="page-header">
		<h1>Send Franks</h1>
	</div>

	{#if sent}
		<div class="card success-card">
			<p>Transfer sent successfully.</p>
			<a href="/" class="btn-inline">Back to My Account</a>
			&nbsp;·&nbsp;
			<button class="btn-inline" onclick={() => sent = false}>Send another</button>
		</div>
	{:else}
		<div class="card">
			{#if form?.error}
				<div class="error-banner">{form.error}</div>
			{/if}
			<form method="POST" use:enhance={() => {
				return ({ result, update }) => {
					if (result.type === 'success') sent = true;
					update({ reset: result.type === 'success' });
				};
			}}>
				<div class="form-grid">
					<label class="field">
						<span>From account</span>
						<select class="input" name="from_uuid" required>
							{#each accounts as a}
								<option value={a.uuid} selected={a.uuid === preselect}>
									{a.name} — {a.balance.toLocaleString()} ƒ
								</option>
							{/each}
						</select>
					</label>

					<label class="field">
						<span>To (handle)</span>
						<input class="input" name="to_handle" type="text"
						       placeholder="e.g. jane_smith or food-service" required />
					</label>

					<label class="field">
						<span>Amount (ƒ)</span>
						<input class="input" name="amount" type="number" min="1" step="1" required />
					</label>

					<label class="field field--wide">
						<span>Memo (optional)</span>
						<input class="input" name="memo" type="text" maxlength="200" />
					</label>
				</div>

				<div class="form-actions">
					<button type="submit" class="btn btn--primary">Send</button>
				</div>
			</form>
		</div>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-6); }
	.page-header h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		max-width: 480px;
	}

	.success-card { color: var(--color-success); }

	.error-banner {
		background: var(--color-danger-subtle);
		color: var(--color-danger);
		border-radius: var(--radius);
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
		margin-bottom: var(--space-4);
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	.field { display: flex; flex-direction: column; gap: var(--space-1); }
	.field--wide { grid-column: 1 / -1; }
	.field span { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-text-muted); }

	.input {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-bg);
		color: var(--color-text);
		width: 100%;
		box-sizing: border-box;
	}
	.input:focus { outline: 2px solid var(--color-accent); outline-offset: 1px; }

	.form-actions { margin-top: var(--space-5); }

	.btn {
		display: inline-flex; align-items: center;
		font-family: var(--font-sans); font-size: var(--text-sm);
		padding: var(--space-2) var(--space-5);
		border: 1px solid transparent; border-radius: var(--radius);
		cursor: pointer; font-weight: var(--weight-medium);
	}
	.btn--primary { background: var(--color-accent); color: #fff; }
	.btn--primary:hover { opacity: 0.9; }

	.btn-inline { font-size: var(--text-sm); color: var(--color-accent); background: none; border: none; cursor: pointer; padding: 0; text-decoration: none; }
	.btn-inline:hover { text-decoration: underline; }
</style>
