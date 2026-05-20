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
		<h1 class="page-title">General Assembly</h1>
	</header>

	<!-- Tab Navigation -->
	<div class="tab-nav">
		<button 
			class="tab-button" 
			class:active={activeTab === 'docket'}
			onclick={() => activeTab = 'docket'}>
			Motions
		</button>
		<button 
			class="tab-button" 
			class:active={activeTab === 'votes'}
			onclick={() => activeTab = 'votes'}>
			Seats
		</button>
		<button 
			class="tab-button" 
			class:active={activeTab === 'organization'}
			onclick={() => activeTab = 'organization'}>
			Organizations
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
		padding: var(--space-8) var(--space-6);
	}

	.header {
		margin-bottom: var(--space-10);
	}

	.page-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: clamp(2.25rem, 4.5vw, 3.5rem);
		font-weight: 400;
		text-align: center;
		line-height: 1.3;
		margin: 0;
		color: #151c1a;
		letter-spacing: -0.02em;
	}

	/* Tab Navigation */
	.tab-nav {
		display: flex;
		justify-content: center;
		gap: var(--space-1);
		margin-bottom: var(--space-8);
		border-bottom: 1px solid rgba(45, 90, 79, 0.2);
	}

	.tab-button {
		background: none;
		border: none;
		padding: var(--space-3) var(--space-6);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
		margin-bottom: -1px;
	}

	.tab-button:hover {
		color: #151c1a;
		background: rgba(212, 162, 74, 0.05);
	}

	.tab-button.active {
		color: #151c1a;
		border-bottom-color: #d4a24a;
	}

	.tab-content {
		min-height: 400px;
	}

	@media (max-width: 768px) {
		.page {
			padding: var(--space-4);
		}

		.page-title {
			font-size: 2rem;
		}
	}
</style>
