<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { colleges } = $derived(data);
</script>

<div class="page">
	<header class="header">
		<h1>Colleges</h1>
		<p class="header__subtitle">Professional communities and sortition pools</p>
	</header>

	<div class="description">
		<p>
			Colleges are voluntary associations of people who share a professional interest or skill. 
			Members join colleges to collaborate, learn from peers, and maintain professional standards. 
			When specialized committees need members with domain expertise, they draw randomly from the 
			relevant college through sortition—ensuring that governance decisions are made by people with 
			actual knowledge of the subject matter.
		</p>
	</div>

	{#if colleges.length > 0}
		<div class="list">
			{#each colleges as college}
				<a href="/colleges/{college.uuid}" class="card">
					<h3 class="card__title">{college.name}</h3>
					<span class="card__handle">@{college.handle}</span>
					<span class="badge badge-{college.status}">{college.status}</span>
				</a>
			{/each}
		</div>
	{:else}
		<p class="empty">No colleges yet.</p>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
	}

	.header {
		margin-bottom: var(--space-6);
	}

	.header h1 {
		font-size: var(--text-3xl);
		font-weight: var(--weight-bold);
		margin: 0 0 var(--space-2) 0;
	}

	.header__subtitle {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
		margin: 0;
	}

	.description {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
		margin-bottom: var(--space-6);
	}

	.description p {
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

	.card {
		display: block;
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.card:hover {
		border-color: var(--color-accent);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

	.badge {
		display: inline-block;
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		border-radius: var(--radius);
	}

	.badge-active {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-dissolved {
		background: #f3f4f6;
		color: #6b7280;
	}

	.empty {
		color: var(--color-text-muted);
		font-style: italic;
		text-align: center;
		padding: var(--space-8);
	}
</style>
