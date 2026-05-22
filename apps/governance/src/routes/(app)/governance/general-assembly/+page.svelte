<script lang="ts">
	import { goto } from '$app/navigation';
	import MotionCreationModal from '$lib/components/MotionCreationModal.svelte';
	import InteractiveOrgChart from '$lib/components/InteractiveOrgChart.svelte';
	import MotionList from '$lib/components/MotionList.svelte';
	import type { PageData } from './$types.js';

	let { data, form }: { data: PageData; form: any } = $props();

	const { 
		association, 
		config, 
		termHolders,
		allMotions,
		activeMotions,
		concludedMotions,
		archivedMotions,
		roles,
		sections,
		members,
		canAssign,
		canCreateMotion,
		enactedMotions,
		deliberationRules,
		assemblyRules,
		draftMotions
	} = $derived(data);

	let showModal = $state(false);
	let activeTab = $state<'docket' | 'organization'>('docket');
	let motionView = $state<'active' | 'concluded' | 'archived'>('active');

	$effect(() => {
		if (form?.introduced) {
			goto(`/governance/motions/${form.introduced}`);
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
			class:active={activeTab === 'organization'}
			onclick={() => activeTab = 'organization'}>
			Organizations
		</button>
	</div>

	<!-- Tab Content -->
	<div class="tab-content">
		{#if activeTab === 'docket'}
			<div class="motion-status-tabs">
				<button 
					class="status-tab" 
					class:active={motionView === 'active'}
					onclick={() => motionView = 'active'}>
					Active <span class="count">({activeMotions.length})</span>
				</button>
				<button 
					class="status-tab" 
					class:active={motionView === 'concluded'}
					onclick={() => motionView = 'concluded'}>
					Concluded <span class="count">({concludedMotions.length})</span>
				</button>
				<button 
					class="status-tab" 
					class:active={motionView === 'archived'}
					onclick={() => motionView = 'archived'}>
					Archived <span class="count">({archivedMotions.length})</span>
				</button>
			</div>
			
			{#if motionView === 'active'}
				<MotionList 
					motions={activeMotions} 
					canCreate={canCreateMotion} 
					onCreateClick={openCreateModal} 
				/>
			{:else if motionView === 'concluded'}
				<MotionList motions={concludedMotions} />
			{:else}
				<MotionList motions={archivedMotions} />
			{/if}
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
		bodyName="the General Assembly" 
		draftMotions={draftMotions}
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

	.motion-status-tabs {
		display: flex;
		gap: var(--space-2);
		justify-content: center;
		margin-bottom: var(--space-6);
		border-bottom: 1px solid rgba(45, 90, 79, 0.2);
	}

	.status-tab {
		padding: var(--space-3) var(--space-5);
		border: none;
		background: transparent;
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		letter-spacing: 0.08em;
		color: #7a5c1a;
		cursor: pointer;
		position: relative;
		transition: all 0.2s;
	}

	.status-tab:hover {
		color: #151c1a;
		background: rgba(212, 162, 74, 0.05);
	}

	.status-tab.active {
		color: #d4a24a;
	}

	.status-tab.active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 2px;
		background: #d4a24a;
	}

	.count {
		font-size: var(--text-sm);
		opacity: 0.7;
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
