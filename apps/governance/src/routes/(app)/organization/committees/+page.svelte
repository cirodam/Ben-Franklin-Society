<script lang="ts">
	import { Button, EmptyState } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { committees } = $derived(data);
</script>

<div class="page">
	<header class="header">
		<h1 class="page-title">Committees</h1>
		<p class="page-description">
			Committees are specialized governing bodies responsible for specific domains like agriculture, 
			health care, or energy. Members are typically selected by sortition—some from the general 
			membership, others from relevant professional colleges when domain expertise is needed. 
			Committees deliberate on policy, oversee their associated services, and propose changes to the 
			General Assembly. Terms are limited to prevent entrenchment of power.
		</p>
		<div class="header-actions">
			<Button href="/organization/committees/new">+ Create Committee</Button>
		</div>
	</header>

	{#if committees.length > 0}
		<div class="list">
			{#each committees as committee}
				<a href="/organization/committees/{committee.uuid}" class="committee-card">
					<h3 class="card__title">{committee.name}</h3>
					<span class="card__handle">@{committee.handle}</span>
					{#if committee.status === 'active'}
						<span class="status-badge status-active">Active</span>
					{:else}
						<span class="status-badge status-inactive">{committee.status}</span>
					{/if}
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

	.committee-card {
		display: block;
		padding: var(--space-5);
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.committee-card:hover {
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
		margin-bottom: var(--space-3);
	}

	.status-badge {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-xs);
		font-weight: 400;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		padding: 0.125rem 0.5rem;
		border: 1px solid;
	}

	.status-active {
		background: rgba(90, 115, 90, 0.15);
		color: #3a5a3a;
		border-color: rgba(90, 115, 90, 0.3);
	}

	.status-inactive {
		background: rgba(45, 90, 79, 0.1);
		color: #374340;
		border-color: rgba(45, 90, 79, 0.2);
	}
</style>
