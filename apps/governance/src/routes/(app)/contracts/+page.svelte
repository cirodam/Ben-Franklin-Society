<script lang="ts">
	import { Badge, Button, EmptyState, List, ListItem, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { contracts, actingAs } = $derived(data);

	const statusVariant = (s: string): 'success' | 'danger' | 'warn' | 'neutral' =>
		s === 'completed' ? 'success'
		: s === 'active' ? 'neutral'
		: s === 'terminated' || s === 'disputed' ? 'danger'
		: 'neutral';
</script>

<div class="page">
	<PageHeader title="Contracts">
		{#if actingAs}
			{#snippet actions()}
				<Button href="/contracts/new">New Contract</Button>
			{/snippet}
		{/if}
	</PageHeader>

	{#if contracts.length === 0}
		<EmptyState 
			icon="📝"
			title="No contracts yet"
			description={actingAs ? "Create the first contract to get started." : "No contracts available."}
		>
			{#if actingAs}
				{#snippet actions()}
					<Button href="/contracts/new">Create Contract</Button>
				{/snippet}
			{/if}
		</EmptyState>
	{:else}
		<List>
			{#each contracts as contract}
				<ListItem href="/contracts/{contract.uuid}">
					<div class="contract-header">
						<h3 class="contract-title">{contract.title}</h3>
						<Badge label={contract.status} variant={statusVariant(contract.status)} />
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
				</ListItem>
			{/each}
		</List>
	{/if}
</div>

<style>
	.page {
		max-width: 1000px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
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
