<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Card, EmptyState } from '@bfs/ui';
	import MotionCreationModal from '$lib/components/MotionCreationModal.svelte';
	import InteractiveOrgChart from '$lib/components/InteractiveOrgChart.svelte';
	import MotionList from '$lib/components/MotionList.svelte';
	import VoteSessionList from '$lib/components/VoteSessionList.svelte';
	import BulletinPostForm from '$lib/components/bulletin/BulletinPostForm.svelte';
	import BulletinPostCard from '$lib/components/bulletin/BulletinPostCard.svelte';
	import type { PageData } from './$types.js';

	let { data, form }: { data: PageData; form: any } = $props();

	const {
		association,
		config,
		sourceCollege,
		termHolders,
		allMotions,
		voteSessions,
		roles,
		sections,
		members,
		canAssign,
		canCreateMotion,
		enactedMotions,
		deliberationRules,
		governingDocument,
		bulletinPosts
	} = $derived(data);

	let showModal = $state(false);
	let activeTab = $state<'bulletin' | 'docket' | 'votes' | 'organization'>('bulletin');
	let showBulletinForm = $state(false);

	$effect(() => {
		if (form?.created) {
			goto(`/governance/motions/${form.created}`);
		}
		if (form?.success) {
			showBulletinForm = false;
		}
	});

	function openCreateModal() {
		showModal = true;
	}
</script>

<div class="page">
	<header class="header">
		<div class="title-row">
			<h1>{association.name}</h1>
			<div class="button-group">
				<Button variant="secondary" size="sm" href="/organization/committees/{association.uuid}/meetings">Meetings</Button>
				<Button variant="secondary" size="sm" href="/organization/committees/{association.uuid}/edit">Edit</Button>
			</div>
		</div>
		<p class="header__handle">@{association.handle}</p>
	{#if association.description}
		<p class="description">{association.description}</p>
	{/if}
	{#if governingDocument}
		<a href="/library/{governingDocument.slug}" class="rules-link">{governingDocument.title}</a>
	{/if}
	<!-- Tab Navigation -->
	<div class="tab-nav">
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'bulletin'}
			onclick={() => activeTab = 'bulletin'}>
			Bulletin
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'docket'}
			onclick={() => activeTab = 'docket'}>
			Docket
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'votes'}
			onclick={() => activeTab = 'votes'}>
			Votes
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'organization'}
			onclick={() => activeTab = 'organization'}>
			Organization
		</button>
	</div>

	<!-- Tab Content -->
	<div class="tab-content">
		{#if activeTab === 'bulletin'}
			<Card>
				<div class="bulletin-header">
					<h2>Bulletin Board</h2>
					<Button size="sm" onclick={() => showBulletinForm = !showBulletinForm}>
						{showBulletinForm ? 'Cancel' : '+ New Post'}
					</Button>
				</div>
				{#if showBulletinForm}
					<BulletinPostForm 
						action="?/createBulletinPost"
						oncancel={() => showBulletinForm = false}
					/>
				{/if}
				{#if bulletinPosts.length === 0}
					<EmptyState
						title="No posts yet"
						description="This bulletin board is for {association.name} members to share announcements and discussions."
					/>
				{:else}
					<div class="post-list">
						{#each bulletinPosts as post}
							<BulletinPostCard 
								{post} 
								href="/organization/associations/{association.uuid}/bulletin/{post.uuid}"
							/>
						{/each}
					</div>
				{/if}
			</Card>
		{:else if activeTab === 'docket'}
			<MotionList 
				motions={allMotions} 
				canCreate={canCreateMotion} 
				onCreateClick={openCreateModal} 
			/>
		{:else if activeTab === 'votes'}
			<VoteSessionList sessions={voteSessions} />
		{:else if activeTab === 'organization'}
			<InteractiveOrgChart
				{sections}
				{roles}
				{members}
				{enactedMotions}
				associationUuid={association.uuid}
				canManage={canAssign}
			/>
		{/if}
	</div>

{#if showModal}
	<MotionCreationModal 
		bind:show={showModal} 
		bodyUuid={association.uuid} 
		bodyName={association.name} 
		deliberationRules={deliberationRules} 
	/>
{/if}
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-3);
	}

	.title-row h1 {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: var(--text-3xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0;
		line-height: 1.2;
	}

	.button-group {
		display: flex;
		gap: var(--space-2);
	}

	.header__handle {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		color: #7a5c1a;
		margin: 0 0 var(--space-3) 0;
	}

	.rules-link {
		display: block;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #7a5c1a;
		text-decoration: none;
		transition: color 0.2s;
		margin-bottom: var(--space-6);
	}

	.rules-link:hover {
		color: #d4a24a;
	}

	/* Tab Navigation */
	.tab-nav {
		display: flex;
		gap: var(--space-6);
		justify-content: center;
		margin-bottom: var(--space-8);
		border-bottom: 1px solid rgba(45, 90, 79, 0.2);
		overflow-x: auto;
	}

	.tab-nav__button {
		background: none;
		border: none;
		padding: var(--space-3) 0;
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		font-weight: 400;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #374340;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
		white-space: nowrap;
		margin-bottom: -1px;
	}

	.tab-nav__button:hover {
		color: #151c1a;
	}

	.tab-nav__button.active {
		color: #d4a24a;
		border-bottom-color: #d4a24a;
	}

	.tab-content {
		min-height: 400px;
	}

	@media (max-width: 768px) {
		.page {
			padding: var(--space-4);
		}

		.title-row {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-2);
		}

		.header__meta {
			flex-wrap: wrap;
		}
	}

	.description {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: #374340;
		margin: var(--space-3) 0;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.bulletin-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-6);
	}

	.bulletin-header h2 {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: var(--text-2xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0;
	}

	.post-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
</style>
