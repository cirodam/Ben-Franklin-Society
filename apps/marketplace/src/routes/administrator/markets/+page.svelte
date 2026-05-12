<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { marketplaces } = $derived(data);

	let showCreate = $state(false);
</script>

<div class="page">
	<div class="page-header">
		<h1>Marketplaces</h1>
		<button class="btn btn-primary" onclick={() => (showCreate = !showCreate)}>
			{showCreate ? 'Cancel' : '+ New Marketplace'}
		</button>
	</div>

	{#if showCreate}
		<div class="create-card">
			<h2>New Marketplace</h2>
			{#if form?.error}
				<div class="form-error">{form.error}</div>
			{/if}
			<form method="POST" action="?/create" use:enhance class="create-form">
				<div class="field">
					<label for="name">Name</label>
					<input id="name" name="name" type="text" required />
				</div>
				<div class="field">
					<label for="location">Location</label>
					<input id="location" name="location" type="text" required />
				</div>
				<div class="field">
					<label for="default_schedule">Usual Schedule (optional)</label>
					<input id="default_schedule" name="default_schedule" type="text" placeholder="e.g. Every Saturday, 8am–1pm" />
				</div>
				<div class="field">
					<label for="description">Description (optional)</label>
					<textarea id="description" name="description" rows="3"></textarea>
				</div>
				<div class="form-actions">
					<button type="submit" class="btn btn-primary">Create</button>
				</div>
			</form>
		</div>
	{/if}

	{#if marketplaces.length === 0}
		<p class="empty">No marketplaces yet.</p>
	{:else}
		<div class="market-list">
			{#each marketplaces as market}
				<a href="/administrator/markets/{market.uuid}" class="market-row">
					<div class="market-name">{market.name}</div>
					<div class="market-location">{market.location}</div>
					<div class="market-status">
						<span class="badge {market.status === 'active' ? 'badge-active' : 'badge-closed'}">{market.status}</span>
					</div>
					<div class="market-arrow">→</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 760px; }
	.page-header { display: flex; align-items: center; justify-content: space-between; }
	h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }
	h2 { margin: 0; font-size: var(--text-base); font-weight: var(--weight-semibold); }
	.empty { color: var(--color-text-muted); font-size: var(--text-sm); }

	.create-card {
		display: flex; flex-direction: column; gap: var(--space-4);
		padding: var(--space-5);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.create-form { display: flex; flex-direction: column; gap: var(--space-4); }
	.field { display: flex; flex-direction: column; gap: var(--space-1); }
	.field label { font-size: var(--text-sm); font-weight: var(--weight-medium); }
	.field input, .field textarea {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-family: inherit;
	}
	.field textarea { resize: vertical; }
	.form-actions { display: flex; justify-content: flex-end; }
	.form-error { padding: var(--space-3) var(--space-4); background: #fee2e2; border: 1px solid #fca5a5; border-radius: var(--radius-md); font-size: var(--text-sm); color: #7f1d1d; }

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

	.badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: capitalize; }
	.badge-active { background: #d1fae5; color: #065f46; }
	.badge-closed { background: #fee2e2; color: #7f1d1d; }

	.btn { padding: var(--space-2) var(--space-5); border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer; border: none; text-decoration: none; display: inline-flex; align-items: center; }
	.btn-primary { background: var(--color-accent); color: #fff; }
	.btn:hover { filter: brightness(0.92); }
</style>
