<script lang="ts">
	import { Badge, Button, Card, EmptyState, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { services } = $derived(data);

	const statusVariant = (status: string) => 
		status === 'active' ? 'success' : 'muted';
</script>

<PageHeader 
	title="Services"
	description="Public services and infrastructure"
>
	{#snippet actions()}
		<Button href="/services/new">+ Create Service</Button>
	{/snippet}
</PageHeader>

<Card>
	<p style="margin: 0; line-height: 1.6;">
		Services are the organizations that deliver essential infrastructure and support to the community. 
		Each service operates under the oversight of a specialized committee selected by sortition from the 
		relevant professional college. Services handle everything from food distribution and housing to 
		health care and education—funded by the society and accountable to its members through the 
		committee structure.
	</p>
</Card>

{#if services.length > 0}
	<div class="service-grid">
		{#each services as service}
			<Card href="/services/{service.uuid}" hover>
				<h3 style="font-size: var(--text-lg); font-weight: var(--weight-semibold); margin: 0 0 var(--space-2) 0;">
					{service.name}
				</h3>
				<span style="font-size: var(--text-sm); color: var(--color-text-muted); font-family: var(--font-mono); display: block; margin-bottom: var(--space-2);">
					@{service.handle}
				</span>
				<Badge label={service.status} variant={statusVariant(service.status)} />
			</Card>
		{/each}
	</div>
{:else}
	<EmptyState 
		icon="🏢" 
		title="No services yet"
		description="Services will appear here once they're created."
	/>
{/if}

<style>
	.service-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-4);
	}
</style>
