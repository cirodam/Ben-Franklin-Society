<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { PageHeader, Card, Button, Input, EmptyState, Alert } from '@bfs/ui';
	import ContextBadge from '$lib/components/ContextBadge.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { q, accounts, session } = $derived(data);

	let showCreateForm = $state(false);

	// Format cents as currency (e.g., 1254 -> "12.54")
	function fmtCurrency(cents: number): string {
		return (cents / 100).toFixed(2);
	}

	// Success handling - redirect to new account
	$effect(() => {
		if (form?.success && form?.created) {
			showCreateForm = false;
			goto(`/admin/accounts/${form.created}`);
		}
	});
</script>

<div class="page">
	<div class="page-header-with-badge">
		<PageHeader title="Bank Administration" />
		{#if session}
			<ContextBadge 
				actingAsUuid={session.acting_as_uuid}
				personUuid={session.person_uuid}
				isAdmin={true}
			/>
		{/if}
	</div>

	<div class="actions-bar">
		<form method="GET" action="/admin" class="search-form">
			<Input
				name="q"
				type="text"
				placeholder="Search by handle or account name…"
				value={q}
				class="search-input"
			/>
			<Button type="submit" variant="primary">Search</Button>
			{#if q}<Button href="/admin" variant="ghost">Clear</Button>{/if}
		</form>
		<Button onclick={() => showCreateForm = !showCreateForm} variant="primary">
			{showCreateForm ? 'Cancel' : '+ Create Account'}
		</Button>
	</div>

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	<!-- Create Account Form -->
	{#if showCreateForm}
		<Card class="form-card">
			<h2 class="form-title">Create New Account</h2>
			<form method="POST" action="?/create" use:enhance>
				<div class="form-grid">
					<Input
						name="owner_uuid"
						type="text"
						label="Owner UUID"
						required
						placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
						pattern="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
						class="field-wide"
					/>

					<Input
						name="name"
						type="text"
						label="Account Name"
						required
						placeholder="Primary"
					/>

					<label class="checkbox-label">
						<input type="checkbox" name="demurrage_exempt" value="true" />
						Exempt from demurrage
					</label>
				</div>

				<div class="form-actions">
					<Button type="submit" variant="primary">Create Account</Button>
					<Button type="button" variant="secondary" onclick={() => showCreateForm = false}>Cancel</Button>
				</div>
			</form>
		</Card>
	{/if}

	<Card class="table-card">
		<div class="card__label">
			{#if q}Results for "{q}"{:else}All Accounts{/if}
			— {accounts.length} shown
		</div>
		{#if accounts.length === 0}
			<EmptyState title="No accounts found." />
		{:else}
			<table class="table">
				<thead>
					<tr>
						<th>UUID</th>
						<th>Account Name</th>
						<th class="num">Franks</th>
						<th class="num">Florens</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each accounts as acct}
						<tr class={acct.is_frozen === 1 ? 'row--frozen' : ''}>
							<td class="mono">{acct.uuid.slice(0, 8)}</td>
							<td>{acct.name}</td>
					<td class="num {acct.franks_balance < 0 ? 'negative' : ''}">🟢 {fmtCurrency(acct.franks_balance)}</td>
					<td class="num {acct.florens_balance < 0 ? 'negative' : ''}">🟡 {fmtCurrency(acct.florens_balance)}</td>
							<td>
								{#if acct.is_frozen === 1}
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
	</Card>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); }
	
	.page-header-with-badge {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.actions-bar {
		display: flex;
		gap: var(--space-3);
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.search-form { display: flex; gap: var(--space-3); flex: 1; max-width: 520px; align-items: flex-start; }
	:global(.search-input) { flex: 1; }

	.form-card {
		padding: var(--space-5);
	}

	.form-title {
		margin: 0 0 var(--space-4);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
		margin-bottom: var(--space-4);
	}

	:global(.field-wide) {
		grid-column: 1 / -1;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		grid-column: 1 / -1;
		cursor: pointer;
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		padding-top: var(--space-2);
	}

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
</style>
