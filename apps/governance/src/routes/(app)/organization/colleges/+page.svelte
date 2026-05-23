<script lang="ts">
	import { Button, EmptyState } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { colleges } = $derived(data);
</script>

<div class="page">
	<header class="header">
		<h1 class="page-title">Colleges</h1>
		<p class="page-description">
			Colleges are voluntary associations of people who share a professional interest or skill. 
			Members join colleges to collaborate, learn from peers, and maintain professional standards. 
			When specialized committees need members with domain expertise, they draw randomly from the 
			relevant college through sortition—ensuring that governance decisions are made by people with 
			actual knowledge of the subject matter.
		</p>
		<div class="header-actions">
			<Button href="/organization/colleges/new">Create College</Button>
		</div>
	</header>

	{#if colleges.length > 0}
		<div class="list">
			{#each colleges as college}
				<a href="/organization/colleges/{college.uuid}" class="college-card">
					<h3 class="card__title">{college.name}</h3>
					<span class="card__handle">@{college.handle}</span>
				</a>
			{/each}
		</div>
	{:else}
		<EmptyState 
			title="No colleges yet"
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
		font-family: var(--font-prose);
		font-size: clamp(2.25rem, 4.5vw, 3.5rem);
		font-weight: 400;
		color: #151c1a;
		margin: 0 0 var(--space-4) 0;
		line-height: 1.3;
	}

	.page-description {
		font-family: var(--font-prose);
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

	.college-card {
		display: block;
		padding: var(--space-5);
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.college-card:hover {
		border-color: #d4a24a;
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 4px 8px rgba(0, 0, 0, 0.08);
		text-decoration: none;
	}

	.card__title {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0 0 var(--space-2) 0;
	}

	.card__handle {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: #7a5c1a;
		font-style: italic;
		display: block;
	}
</style>
