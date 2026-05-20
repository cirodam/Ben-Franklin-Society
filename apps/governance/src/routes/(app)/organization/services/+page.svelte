<script lang="ts">
	import { Button, EmptyState } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { services } = $derived(data);
</script>

<div class="page">
	<header class="header">
		<h1 class="page-title">Services</h1>
		<p class="page-description">
			Services deliver essential infrastructure and support to the community. Each service operates 
			under committee oversight, handling everything from food distribution and housing to health care 
			and education.
		</p>
		<div class="header-actions">
			<Button href="/organization/services/new">Create Service</Button>
		</div>
	</header>

	{#if services.length > 0}
		<div class="list">
			{#each services as service}
				<a href="/organization/services/{service.uuid}" class="service-card">
					<h3 class="card__title">{service.name}</h3>
					<span class="card__handle">@{service.handle}</span>
				</a>
			{/each}
		</div>
	{:else}
		<EmptyState 
			title="No services yet"
			description="Services will appear here once they're created."
		/>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.header {
		text-align: center;
		max-width: 800px;
		margin: 0 auto var(--space-8) auto;
	}

	.page-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: clamp(2.25rem, 4.5vw, 3.5rem);
		font-weight: 400;
		color: #151c1a;
		margin: 0 0 var(--space-4) 0;
		line-height: 1.3;
	}

	.page-description {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: #5a5a50;
		line-height: 1.8;
		max-width: 65ch;
		margin: 0 auto var(--space-6) auto;
	}

	.header-actions {
		display: flex;
		justify-content: center;
	}

	.list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-4);
	}

	.service-card {
		display: block;
		padding: var(--space-5);
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.service-card:hover {
		border-color: #d4a24a;
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 4px 8px rgba(0, 0, 0, 0.08);
		text-decoration: none;
	}

	.card__title {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0 0 var(--space-2) 0;
	}

	.card__handle {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #7a5c1a;
		font-style: italic;
		display: block;
	}
</style>
