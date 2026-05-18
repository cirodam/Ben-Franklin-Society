<script lang="ts">
	import { goto } from '$app/navigation';
	import MotionCreationModal from '$lib/components/MotionCreationModal.svelte';
	import InteractiveOrgChart from '$lib/components/InteractiveOrgChart.svelte';
	import MotionList from '$lib/components/MotionList.svelte';
	import VoteSessionList from '$lib/components/VoteSessionList.svelte';
	import type { PageData } from './$types.js';

	let { data, form }: { data: PageData; form: any } = $props();

	const { 
		association, 
		config, 
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
		assemblyRules
	} = $derived(data);

	let showModal = $state(false);
	let activeTab = $state<'docket' | 'votes' | 'organization'>('docket');

	$effect(() => {
		if (form?.created) {
			goto(`/governance/motions/${form.created}`);
		}
	});

	function openCreateModal() {
		showModal = true;
	}
</script>

<div class="page">
	<header class="header">
		<div class="header__top">
			<h1>General Assembly</h1>
			<p class="header__subtitle">The sovereign governing body of the society</p>
		</div>
		<div class="header__meta">
			<span>{config?.seat_count ?? '—'} seats</span>
			<span>·</span>
			<span>{termHolders.length} currently seated</span>
			<span>·</span>
			<span>{config?.term_days ?? '—'} day terms</span>
			{#if assemblyRules}
				<span>·</span>
				<a href="/library/assembly-rules" class="rules-link">📜 Rules of the Assembly</a>
			{/if}
		</div>
	</header>

	<!-- Tab Navigation -->
	<div class="tab-nav">
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'docket'}
			onclick={() => activeTab = 'docket'}>
			📋 Docket ({allMotions.length})
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'votes'}
			onclick={() => activeTab = 'votes'}>
			🗳️ Votes ({voteSessions.length})
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'organization'}
			onclick={() => activeTab = 'organization'}>
			🏢 Organization
		</button>
	</div>

	<!-- Tab Content -->
	<div class="tab-content">
		{#if activeTab === 'docket'}
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
		bodyName="the General Assembly" 
		deliberationRules={deliberationRules} 
	/>
{/if}
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-6);
	}

	.header__top {
		margin-bottom: var(--space-2);
	}

	.header__top h1 {
		font-size: var(--text-3xl);
		font-weight: var(--weight-bold);
		margin: 0;
	}

	.header__subtitle {
		font-size: var(--text-base);
		color: var(--color-text-muted);
		margin: var(--space-2) 0 0 0;
	}

	.header__meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--space-6);
	}

	.rules-link {
		color: var(--color-accent);
		text-decoration: none;
	}

	.rules-link:hover {
		text-decoration: underline;
	}

	/* Tab Navigation */
	.tab-nav {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-6);
		border-bottom: 2px solid var(--color-border);
		overflow-x: auto;
	}

	.tab-nav__button {
		background: none;
		border: none;
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
		cursor: pointer;
		border-bottom: 3px solid transparent;
		transition: all 0.2s;
		white-space: nowrap;
		margin-bottom: -2px;
	}

	.tab-nav__button:hover {
		color: var(--color-text);
		background: var(--color-accent-subtle);
	}

	.tab-nav__button.active {
		color: var(--color-accent);
		border-bottom-color: var(--color-accent);
		font-weight: var(--weight-semibold);
	}

	.tab-content {
		min-height: 400px;
	}

	@media (max-width: 768px) {
		.page {
			padding: var(--space-4);
		}

		.header__top h1 {
			font-size: var(--text-2xl);
		}

		.header__meta {
			flex-wrap: wrap;
		}
	}
</style>
