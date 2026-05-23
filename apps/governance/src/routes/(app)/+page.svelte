<script lang="ts">
	import { Button, EmptyState } from '@bfs/ui';
	import BulletinPostCard from '$lib/components/bulletin/BulletinPostCard.svelte';
	import BulletinPostForm from '$lib/components/bulletin/BulletinPostForm.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let showForm = $state(false);
</script>

<div class="page">
	<header class="header">
		<h1 class="page-title">Community Bulletin Board</h1>
		<div class="header-actions">
			<Button onclick={() => showForm = !showForm}>
				{showForm ? 'Cancel' : '+ Start a thread'}
			</Button>
		</div>
	</header>

	<nav class="services-nav">
		<a href="http://localhost:5174" class="service-link">Community Bank</a>
		<span class="separator">•</span>
		<a href="http://localhost:5175" class="service-link">Mail</a>
		<span class="separator">•</span>
		<a href="http://localhost:5176" class="service-link">Marketplace</a>
		<span class="separator">•</span>
		<a href="http://localhost:5177" class="service-link">Library</a>
	</nav>

	{#if showForm}
		<BulletinPostForm 
			showVisibility={false}
			submitLabel="Post to Board"
			oncancel={() => showForm = false}
		/>
	{/if}

	{#if data.posts.length === 0}
		<EmptyState
			title="No posts yet"
			description="This space is for community announcements and discussions."
		/>
	{:else}
		<div class="thread-list">
			{#each data.posts as post}
				<BulletinPostCard 
					{post} 
					href="/bulletin/{post.uuid}"
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1000px;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.header {
		text-align: center;
		margin-bottom: var(--space-6);
	}

	.page-title {
		font-family: var(--font-prose);
		font-size: clamp(2.25rem, 4.5vw, 3.5rem);
		font-weight: 400;
		color: var(--ink);
		margin: 0 0 var(--space-6) 0;
		line-height: 1.3;
	}

	.header-actions {
		display: flex;
		justify-content: center;
	}

	.thread-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.services-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		padding: var(--space-4) 0;
		border-bottom: 1px solid var(--border);
		margin-bottom: var(--space-6);
	}

	.service-link {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--gold);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.service-link:hover {
		color: var(--gold-hover);
		text-decoration: underline;
	}

	.separator {
		color: var(--ink-faint);
		font-size: var(--text-sm);
	}
</style>
