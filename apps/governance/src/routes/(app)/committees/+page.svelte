<script lang="ts">
	import { Badge, Button, Card, EmptyState, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { committees } = $derived(data);

	const statusVariant = (s: string): 'success' | 'neutral' => s === 'active' ? 'success' : 'neutral';
</script>

<div class="page">
	<PageHeader 
		title="Committees"
		description="Specialized deliberative bodies"
	>
		{#snippet actions()}
			<Button href="/committees/new">+ Create Committee</Button>
		{/snippet}
	</PageHeader>

	<Card>
		<p style="margin: 0; line-height: 1.6;">
			Committees are specialized governing bodies responsible for specific domains like agriculture, 
			health care, or energy. Members are typically selected by sortition—some from the general 
			membership, others from relevant professional colleges when domain expertise is needed. 
			Committees deliberate on policy, oversee their associated services, and propose changes to the 
			General Assembly. Terms are limited to prevent entrenchment of power.
		</p>
	</Card>

	{#if committees.length > 0}
		<div class="list">
			{#each committees as committee}
				<a href="/committees/{committee.uuid}" class="committee-card">
					<h3 class="card__title">{committee.name}</h3>
					<span class="card__handle">@{committee.handle}</span>
					<Badge label={committee.status} variant={statusVariant(committee.status)} />
				</a>
			{/each}
		</div>
	{:else}
		<EmptyState 
			icon="📋"
			title="No committees yet"
			description="Committees are specialized governing bodies for specific domains."
		/>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-4);
	}

	.committee-card {
		display: block;
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.committee-card:hover {
		border-color: var(--color-accent);
		box-shadow: var(--shadow-md);
		text-decoration: none;
	}

	.card__title {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-2) 0;
	}

	.card__handle {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		display: block;
		margin-bottom: var(--space-2);
	}
</style>
