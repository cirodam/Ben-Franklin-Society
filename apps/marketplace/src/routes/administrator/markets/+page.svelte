<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Badge, Button, EmptyState, Input, PageHeader, Textarea } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { marketplaces } = $derived(data);

	let showCreate = $state(false);
</script>

<div class="page">
	<PageHeader title="Marketplaces">
		{#snippet actions()}
			<Button onclick={() => (showCreate = !showCreate)} variant="primary">
				{showCreate ? 'Cancel' : '+ New Marketplace'}
			</Button>
		{/snippet}
	</PageHeader>

	{#if showCreate}
		<div class="create-card">
			<h2>New Marketplace</h2>
			{#if form?.error}
				<Alert variant="danger">{form.error}</Alert>
			{/if}
			<form method="POST" action="?/create" use:enhance class="create-form">
				<Input label="Name" name="name" type="text" required value="" />
				<Input label="Location" name="location" type="text" required value="" />
				<Input label="Usual Schedule (optional)" name="default_schedule" type="text"
					value="" placeholder="e.g. Every Saturday, 8am–1pm" />
				<Textarea label="Description (optional)" name="description" rows={3} value="" />
				<div class="form-actions">
					<Button type="submit" variant="primary">Create</Button>
				</div>
			</form>
		</div>
	{/if}

	{#if marketplaces.length === 0}
		<EmptyState title="No marketplaces yet." />
	{:else}
		<div class="market-list">
			{#each marketplaces as market}
				<a href="/administrator/markets/{market.uuid}" class="market-row">
					<div class="market-name">{market.name}</div>
					<div class="market-location">{market.location}</div>
					<div class="market-status">
					<Badge variant={market.status === 'active' ? 'success' : 'danger'}>{market.status}</Badge>
					</div>
					<div class="market-arrow">→</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 760px; }
	h2 { margin: 0; font-size: var(--text-base); font-weight: var(--weight-semibold); }

	.create-card {
		display: flex; flex-direction: column; gap: var(--space-4);
		padding: var(--space-5);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.create-form { display: flex; flex-direction: column; gap: var(--space-4); }
	.form-actions { display: flex; justify-content: flex-end; }

	.market-list { display: flex; flex-direction: column; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
	.market-row {
		display: grid; grid-template-columns: 1fr 200px 80px 20px;
		align-items: center; gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--color-border-faint);
		text-decoration: none; color: var(--color-text); font-size: var(--text-sm);
	}
	.market-row:last-child { border-bottom: none; }
	.market-row:hover { background: var(--color-surface-alt, #f8fafc); }
	.market-name { font-weight: var(--weight-medium); }
	.market-location { color: var(--color-text-muted); font-size: var(--text-xs); }
	.market-arrow { color: var(--color-text-muted); }
</style>
