<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { contracts, actingAs } = $derived(data);

	const statusColors: Record<string, string> = {
		draft: 'var(--color-text-muted)',
		active: 'var(--color-primary)',
		completed: 'var(--color-success)',
		disputed: 'var(--color-warning)',
		terminated: 'var(--color-danger)',
	};
</script>

<div class="page">
	<div class="page-header">
		<h1>Contracts</h1>
		{#if actingAs}
			<a href="/contracts/new" class="btn btn--primary">New Contract</a>
		{/if}
	</div>

	{#if contracts.length === 0}
		<div class="empty-state">
			<p>No contracts yet.</p>
			{#if actingAs}
				<p><a href="/contracts/new">Create the first contract</a></p>
			{/if}
		</div>
	{:else}
		<div class="contracts-list">
			{#each contracts as contract}
				<a href="/contracts/{contract.uuid}" class="contract-card">
					<div class="contract-header">
						<h3 class="contract-title">{contract.title}</h3>
						<span class="status-badge" style="color: {statusColors[contract.status] ?? 'var(--color-text)'}">
							{contract.status}
						</span>
					</div>
					<div class="contract-meta">
						<div class="parties">
							<span class="party">{contract.parties[0]?.principal_name} ({contract.parties[0]?.role})</span>
							<span class="separator">↔</span>
							<span class="party">{contract.parties[1]?.principal_name} ({contract.parties[1]?.role})</span>
						</div>
						<div class="dates">
							{#if contract.effective_date}
								<span class="date">Effective: {contract.effective_date}</span>
							{/if}
							{#if contract.expiry_date}
								<span class="date">Expires: {contract.expiry_date}</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1000px;
		margin: 0 auto;
		padding: var(--space-6);
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-6);
	}

	.page-header h1 {
		margin: 0;
	}

	.btn {
		padding: var(--space-2) var(--space-4);
		border: none;
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		text-decoration: none;
		display: inline-block;
	}

	.btn--primary {
		background: var(--color-primary);
		color: white;
	}

	.btn--primary:hover {
		background: var(--color-primary-dark);
	}

	.empty-state {
		text-align: center;
		padding: var(--space-8);
		color: var(--color-text-muted);
	}

	.empty-state p {
		margin: var(--space-2) 0;
	}

	.contracts-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.contract-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.contract-card:hover {
		border-color: var(--color-primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.contract-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.contract-title {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	.status-badge {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: var(--space-1) var(--space-2);
		background: var(--color-surface-raised);
		border-radius: var(--radius-sm);
		white-space: nowrap;
	}

	.contract-meta {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.parties {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.party {
		font-weight: var(--weight-medium);
	}

	.separator {
		color: var(--color-border);
	}

	.dates {
		display: flex;
		gap: var(--space-4);
	}

	.date {
		font-size: var(--text-xs);
	}
</style>
