<script lang="ts">
	import { Badge, Button, Card, EmptyState, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { colleges } = $derived(data);
</script>

<div class="page">
	<PageHeader 
		title="Colleges" 
		description="Professional communities and sortition pools"
	>
		{#snippet actions()}
			<Button href="/colleges/new">+ Create College</Button>
		{/snippet}
	</PageHeader>

	<Card padding="lg" class="description">
		<p>
			Colleges are voluntary associations of people who share a professional interest or skill. 
			Members join colleges to collaborate, learn from peers, and maintain professional standards. 
			When specialized committees need members with domain expertise, they draw randomly from the 
			relevant college through sortition—ensuring that governance decisions are made by people with 
			actual knowledge of the subject matter.
		</p>
	</Card>

	{#if colleges.length > 0}
		<div class="list">
			{#each colleges as college}
				<Card href="/colleges/{college.uuid}" hover>
					<h3 class="card__title">{college.name}</h3>
					<span class="card__handle">@{college.handle}</span>
					<Badge 
						label={college.status} 
						variant={college.status === 'active' ? 'success' : 'neutral'} 
					/>
				</Card>
			{/each}
		</div>
	{:else}
		<EmptyState 
			icon="🎓"
			title="No colleges yet"
		/>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
	}

	:global(.description) {
		margin-bottom: var(--space-6);
	}

	:global(.description p) {
		margin: 0;
		font-size: var(--text-base);
		line-height: 1.6;
		color: var(--color-text);
	}

	.list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-4);
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
