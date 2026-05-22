<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, EmptyState } from '@bfs/ui';
	import Tabs from '$lib/components/Tabs.svelte';
	import BulletinPostCard from '$lib/components/bulletin/BulletinPostCard.svelte';
	import BulletinPostForm from '$lib/components/bulletin/BulletinPostForm.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let showForm = $state(false);

	const tabs = $derived([
		{ href: `/organization/associations/${data.association.uuid}`, label: 'Overview' },
		{ href: `/organization/associations/${data.association.uuid}/bulletin`, label: 'Bulletin' }
	]);
</script>

<div class="page">
	<header class="header">
		<div class="breadcrumb">
			<a href="/organization/associations">Associations</a>
			<span class="separator">›</span>
			<a href="/organization/associations/{data.association.uuid}">{data.association.name}</a>
			<span class="separator">›</span>
			<span>Bulletin</span>
		</div>
		<h1 class="page-title">{data.association.name} Bulletin</h1>
		<div class="header-actions">
			<Button onclick={() => showForm = !showForm}>
				{showForm ? 'Cancel' : '+ New Post'}
			</Button>
		</div>
	</header>

	<Tabs {tabs} />

	{#if showForm}
		<BulletinPostForm 
			oncancel={() => showForm = false}
		/>
	{/if}

	{#if data.posts.length === 0}
		<EmptyState
			title="No posts yet"
			description="This bulletin board is for {data.association.name} members to share announcements and discussions."
		/>
	{:else}
		<div class="post-list">
			{#each data.posts as post}
				<BulletinPostCard 
					{post} 
					href="/organization/associations/{data.association.uuid}/bulletin/{post.uuid}"
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
		gap: var(--space-6);
	}

	.header {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.breadcrumb a {
		color: var(--text-muted);
		text-decoration: none;
	}

	.breadcrumb a:hover {
		color: var(--text);
		text-decoration: underline;
	}

	.separator {
		color: var(--text-muted);
	}

	.page-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: clamp(1.75rem, 3.5vw, 2.5rem);
		font-weight: 400;
		color: var(--ink);
		margin: 0;
		line-height: 1.3;
	}

	.header-actions {
		display: flex;
		justify-content: flex-start;
	}

	.post-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
</style>
