<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, PageHeader, Button, Input } from '@bfs/ui';
	import ContextBadge from '$lib/components/ContextBadge.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { accounts, session, isAdmin } = $derived(data);
	
	const isPersonal = $derived(session && session.acting_as_uuid === session.person_uuid);
	
	const pageTitle = $derived(() => {
		if (!session) return 'My Accounts';
		if (isAdmin && !isPersonal) return 'All Bank Accounts';
		if (!isPersonal) return 'Association Accounts';
		return 'My Accounts';
	});

	let showCreateForm = $state(false);
	let newAccountName = $state('');

	function fmt(n: number) {
		return n.toLocaleString();
	}
</script>

<div class="page">
	<div class="page-header-with-badge">
		<PageHeader title={pageTitle()} />
		{#if session}
			<ContextBadge 
				actingAsUuid={session.acting_as_uuid}
				personUuid={session.person_uuid}
				isAdmin={isAdmin}
			/>
		{/if}
	</div>

	{#if form?.error}
		<div class="error-message">
			{form.error}
		</div>
	{/if}

	{#if form?.success}
		<div class="success-message">
			Account created successfully!
		</div>
	{/if}

	<div class="account-grid">
		{#each accounts as acct}
			<a href="/accounts/{acct.uuid}" class="account-link">
				<Card class="account-card {acct.is_frozen === 1 ? 'account-card--frozen' : ''}"
					<div class="account-card__header">
						<div class="account-card__name t-label">{acct.name}</div>
						{#if acct.is_frozen === 1}
							<div class="account-card__badge frozen">Frozen</div>
						{/if}
					</div>
					<div class="account-card__balance t-balance" class:negative={acct.balance < 0} class:positive={acct.balance > 0}>
						{fmt(acct.balance)} ƒ
					</div>
					<div class="account-card__action">
						View Details →
					</div>
				</Card>
			</a>
		{/each}

		<!-- Create New Account Card -->
		{#if !showCreateForm}
			<Card class="create-account-card">
				<button type="button" class="create-account-button" onclick={() => showCreateForm = true}>
					<div class="create-icon">+</div>
					<div class="create-text">Create New Account</div>
				</button>
			</Card>
		{:else}
			<Card class="create-account-form-card">
				<form method="POST" action="?/create_account" use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							showCreateForm = false;
							newAccountName = '';
						}
					};
				}}>
					<div class="form-header">
						<h3>Create New Account</h3>
						<button type="button" class="cancel-btn" onclick={() => showCreateForm = false}>×</button>
					</div>
					<Input
						id="name"
						name="name"
						label="Account Name"
						placeholder="e.g., Savings, Emergency Fund, Business"
						bind:value={newAccountName}
						required
					/>
					<div class="form-actions">
						<Button type="submit">Create Account</Button>
						<Button type="button" variant="secondary" onclick={() => showCreateForm = false}>Cancel</Button>
					</div>
				</form>
			</Card>
		{/if}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		max-width: 600px;
	}
	
	.page-header-with-badge {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
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

	.success-message {
		padding: var(--space-4);
		background: var(--olive-light);
		border: 1px solid var(--olive);
		border-radius: var(--radius);
		color: var(--olive);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
	}

	.account-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.account-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	:global(.account-card) {
		padding: var(--space-5);
		transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
	}

	.account-link:hover :global(.account-card) {
		border-color: var(--copper);
		box-shadow: 0 4px 12px rgba(139, 90, 60, 0.15);
		transform: translateY(-2px);
	}

	.account-card--frozen :global(.card) {
		border-color: var(--color-danger);
		background: var(--color-danger-subtle);
	}

	.account-card__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-3);
	}

	.account-card__name {
		font-size: var(--text-lg);
	}

	.account-card__balance {
		font-size: var(--text-3xl);
		margin-bottom: var(--space-3);
		color: var(--ink);
	}
	
	.account-card__balance.negative {
		color: var(--color-danger);
	}
	
	.account-card__balance.positive {
		color: var(--olive);
	}

	.account-card__badge {
		display: inline-block;
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.25rem var(--space-3);
		border-radius: var(--radius);
	}
	
	.account-card__badge.frozen {
		background: var(--color-danger);
		color: white;
		border: 1.5px solid var(--color-danger);
	}

	.account-card__action {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-accent);
		margin-top: var(--space-2);
	}

	.account-link:hover .account-card__action {
		text-decoration: underline;
	}

	/* Create Account Card */
	:global(.create-account-card) {
		border: 2px dashed var(--color-border);
		background: var(--color-bg);
	}

	.create-account-button {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--space-6);
		background: none;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	.create-account-button:hover {
		background: var(--color-surface);
	}

	.create-icon {
		font-size: 2rem;
		color: var(--color-accent);
		font-weight: 300;
	}

	.create-text {
		font-family: var(--font-sans);
		font-size: var(--text-base);
		font-weight: 500;
		color: var(--color-accent);
	}

	/* Create Account Form */
	:global(.create-account-form-card) {
		padding: var(--space-5);
		background: var(--parchment);
	}

	.form-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
	}

	.form-header h3 {
		margin: 0;
		font-family: var(--font-sans);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--ink);
	}

	.cancel-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--color-text-subtle);
		cursor: pointer;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s;
	}

	.cancel-btn:hover {
		color: var(--color-text);
	}

	.form-actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-4);
	}
</style>
