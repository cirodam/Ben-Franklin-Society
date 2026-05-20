<script lang="ts">
	import type { PageData } from './$types.js';
	import { enhance } from '$app/forms';
	import { Button, EmptyState, Modal, Input, Textarea } from '@bfs/ui';
	import PetitionCard from './PetitionCard.svelte';
	import RespondedPetition from './RespondedPetition.svelte';
	import ReferendumListItem from './ReferendumListItem.svelte';
	import ReferendumVoting from './ReferendumVoting.svelte';

	let { data }: { data: PageData } = $props();

	const { 
		openPetitions,
		respondedPetitions,
		draftReferendums,
		openReferendums,
		closedReferendums,
	} = $derived(data);

	let showPetitionModal = $state(false);
	let activeTab = $state<'petitions' | 'referendums'>('petitions');

	function formatDate(isoString: string): string {
		const date = new Date(isoString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) return 'today';
		if (diffDays === 1) return 'yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		return date.toLocaleDateString();
	}
</script>

<div class="page">
	<header class="header">
		<h1 class="page-title">Petitions and Referenda</h1>
	</header>

	<!-- Tab Navigation -->
	<div class="tab-nav">
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'petitions'}
			onclick={() => activeTab = 'petitions'}>
			Petitions
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'referendums'}
			onclick={() => activeTab = 'referendums'}>
		Referenda
	</button>
</div>

<!-- Tab Content -->
	<div class="tab-content">
		{#if activeTab === 'petitions'}
			<div class="section-header">
				<Button onclick={() => showPetitionModal = true}>Create Petition</Button>
			</div>
			
			{#if openPetitions.length > 0}
				<section class="section">
					<div class="list">
						{#each openPetitions as petition}
							<PetitionCard {petition} />
						{/each}
					</div>
				</section>
			{:else}
				<EmptyState
					title="No open petitions"
					description="Be the first to create a petition and signal what matters to the community"
				/>
			{/if}

			{#if respondedPetitions.length > 0}
				<div class="responded-section">
					<h3 class="subsection-title">Responded Petitions</h3>
					<div class="list">
						{#each respondedPetitions as petition}
							<RespondedPetition {petition} {formatDate} />
						{/each}
					</div>
				</div>
			{/if}

		{:else if activeTab === 'referendums'}
			{#if draftReferendums.length > 0}
				<section class="section">
					<h3 class="subsection-title">Scheduled Referenda</h3>
					<div class="list">
						{#each draftReferendums as referendum}
							<ReferendumListItem {referendum} status="scheduled" />
						{/each}
					</div>
				</section>
			{/if}

			{#if openReferendums.length > 0}
				{#each openReferendums as referendum}
					<ReferendumVoting {referendum} />
				{/each}
			{:else}
				<EmptyState
					title="No open referendums"
					description="Referendums allow the entire community to vote on important questions"
				/>
			{/if}

			{#if closedReferendums.length > 0}
				<section class="section">
					<h3 class="subsection-title">Past Referenda</h3>
					<div class="list">
						{#each closedReferendums as referendum}
							<ReferendumListItem {referendum} status="closed" {formatDate} />
						{/each}
					</div>
				</section>
			{/if}
		{/if}
	</div>
</div>

<Modal bind:open={showPetitionModal} title="Create a Petition">
	<form method="POST" action="?/createPetition" use:enhance={() => {
		return async ({ update }) => {
			await update();
			showPetitionModal = false;
		};
	}}>
		<Input
			id="petition-title"
			name="title"
			label="Petition Title"
			placeholder="What do you want the assembly to consider?"
			required
		/>
		<Textarea
			id="petition-body"
			name="body"
			label="Description"
			rows={6}
			placeholder="Explain what you're asking for and why it matters..."
			required
		/>
		<div style="display: flex; gap: var(--space-2); justify-content: flex-end; margin-top: var(--space-4);">
			<Button variant="secondary" onclick={() => showPetitionModal = false}>Cancel</Button>
			<Button type="submit">Create Petition</Button>
		</div>
	</form>
</Modal>

<style>
	.page {
		max-width: 60rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
	}

	.header {
		margin-bottom: var(--space-8);
		text-align: center;
	}

	.page-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: clamp(2.25rem, 4.5vw, 3.5rem);
		font-weight: 400;
		color: #151c1a;
		margin: 0;
		line-height: 1.3;
	}

	.tab-nav {
		display: flex;
		gap: var(--space-6);
		justify-content: center;
		border-bottom: 1px solid rgba(45, 90, 79, 0.3);
		margin-bottom: var(--space-8);
	}

	.tab-nav__button {
		padding: var(--space-3) 0;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #374340;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab-nav__button:hover {
		color: #151c1a;
	}

	.tab-nav__button.active {
		color: #d4a24a;
		border-bottom-color: #d4a24a;
	}

	.section {
		margin-bottom: var(--space-8);
	}

	.section-header {
		display: flex;
		justify-content: flex-end;
		margin-bottom: var(--space-6);
	}

	.subsection-title {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: #151c1a;
		margin-bottom: var(--space-4);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.responded-section {
		margin-top: var(--space-8);
	}
</style>
