<script lang="ts">
	import { Badge, Button, Card, EmptyState, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { services } = $derived(data);

	const statusVariant = (s: string): 'success' | 'neutral' => s === 'active' ? 'success' : 'neutral';
</script>

<div class="page">
	<PageHeader 
		title="Services"
		description="Public services and infrastructure"
	>
		{#snippet actions()}
			<Button href="/organization/services/new">+ Create Service</Button>
		{/snippet}
	</PageHeader>

	<Card>
		<p style="margin: 0; line-height: 1.6;">
			Services deliver essential infrastructure and support to the community. Each service operates 
			under committee oversight, handling everything from food distribution and housing to health care 
			and education.
		</p>
	</Card>

	{#if services.length > 0}
		<div class="list">
			{#each services as service}
				<a href="/organization/services/{service.uuid}" class="service-card">
					<h3 class="card__title">{service.name}</h3>
					<span class="card__handle">@{service.handle}</span>
					<Badge label={service.status} variant={statusVariant(service.status)} />
				</a>
			{/each}
		</div>
	{:else}
		<EmptyState 
			icon="🏢" 
			title="No services yet"
			description="Services will appear here once they're created."
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

	.service-card {
		display: block;
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.service-card:hover {
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
