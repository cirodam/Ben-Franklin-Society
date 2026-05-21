<script lang="ts">
	import { Button, Card, EmptyState } from '@bfs/ui';
	import InteractiveOrgChart from '$lib/components/InteractiveOrgChart.svelte';
	import RoleTemplates from '$lib/components/RoleTemplates.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { association, members, roles, roleHierarchy, sections, motions, canAssign, canManage, enactedMotions, governingDocument, templates, vacantRoles, budgetTotal } = $derived(data);

	let activeTab: 'members' | 'roles' | 'activity' = $state('members');
</script>

<div class="page">
	<div class="page-header">
		<div class="title-row">
			<h1>{association.name}</h1>
			<Button variant="secondary" size="sm" href="/organization/services/{association.uuid}/edit">Edit</Button>
		</div>
		<div class="page-header__meta">
			<span class="handle">@{association.handle}</span>
			{#if governingDocument}
				<span>•</span>
				<a href="/library/{governingDocument.slug}" class="founding-doc-link">
					Founding Document
				</a>
			{/if}
		</div>
		{#if association.description}
			<p class="description">{association.description}</p>
		{/if}
	</div>

	<nav class="tabs">
		<button
			class="tab"
			class:active={activeTab === 'members'}
			onclick={() => (activeTab = 'members')}
		>
			Members
		</button>
		<button
			class="tab"
			class:active={activeTab === 'roles'}
			onclick={() => (activeTab = 'roles')}
		>
			Roles & Organization
		</button>
		<button
			class="tab"
			class:active={activeTab === 'activity'}
			onclick={() => (activeTab = 'activity')}
		>
			Activity
		</button>
	</nav>

	<div class="tab-content">
		{#if activeTab === 'members'}
			<Card>
				<h2>Members</h2>
				{#if members.length === 0}
					<EmptyState
						title="No current members"
					/>
				{:else}
					<ul class="member-list">
						{#each members as m}
							<li class="member">
								{#if m.person}
									<a href="/organization/people/{m.person.uuid}" class="member__name">
										{m.person.given_name} {m.person.family_name}
									</a>
									<span class="member__handle">@{m.person.handle}</span>
								{:else}
									<span class="member__name muted">(unknown)</span>
								{/if}
								<span class="member__since">since {m.joined_at.slice(0, 10)}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</Card>
		{:else if activeTab === 'roles'}
			<div class="roles-org-container">
				{#if canAssign}
					<RoleTemplates {templates} associationUuid={association.uuid} />
				{/if}

				<InteractiveOrgChart 
					{sections} 
					{roles} 
					{members}
					{enactedMotions}
					associationUuid={association.uuid}
					canManage={canManage}
				/>
			</div>
		{:else if activeTab === 'activity'}
			<Card>
				<h2>Recent Activity</h2>
				{#if motions.length === 0}
					<EmptyState
						title="No motions yet"
					/>
				{:else}
					<ul class="motion-list">
						{#each motions as m}
							<li class="motion">
								<a href="/governance/motions/{m.uuid}" class="motion__title">{m.title}</a>
								<span class="motion__date">{m.created_at.slice(0, 10)}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</Card>
		{/if}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		text-align: center;
		padding: var(--space-6) 0;
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		margin-bottom: var(--space-3);
	}

	.title-row h1 {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 400;
		color: #151c1a;
		margin: 0;
		line-height: 1.2;
	}

	.page-header__meta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
	}

	.handle {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		color: #7a5c1a;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.page-header__meta > span {
		color: #7a5c1a;
	}

	.founding-doc-link {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		color: #7a5c1a;
		text-decoration: none;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		transition: color 0.2s;
	}

	.founding-doc-link:hover {
		color: #d4a24a;
	}

	.description {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: #374340;
		max-width: 680px;
		margin: var(--space-4) auto 0;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.tabs {
		display: flex;
		justify-content: center;
		gap: var(--space-6);
		border-bottom: 1px solid rgba(45, 90, 79, 0.2);
	}

	.tab {
		background: none;
		border: none;
		padding: var(--space-3) 0;
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #374340;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		transition: all 0.2s;
	}

	.tab:hover {
		color: #151c1a;
	}

	.tab.active {
		color: #d4a24a;
		border-bottom-color: #d4a24a;
	}

	.tab-content {
		margin-top: var(--space-6);
	}

	.roles-org-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	h2 {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: var(--text-2xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0 0 var(--space-5) 0;
	}

	.member-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.member {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		font-size: var(--text-sm);
		padding: var(--space-3);
		border-bottom: 1px solid rgba(45, 90, 79, 0.1);
	}

	.member:last-child {
		border-bottom: none;
	}

	.member__name {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-weight: 400;
		color: #151c1a;
		text-decoration: none;
	}

	.member__name:hover {
		color: #7a5c1a;
	}

	.member__name.muted {
		color: #374340;
		font-style: italic;
	}

	.member__handle {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-xs);
		font-style: italic;
		color: #7a5c1a;
	}

	.member__since {
		margin-left: auto;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-xs);
		color: #374340;
	}

	.motion-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.motion {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-3);
		border-bottom: 1px solid rgba(45, 90, 79, 0.1);
	}

	.motion:last-child {
		border-bottom: none;
	}

	.motion__title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #151c1a;
		text-decoration: none;
	}

	.motion__title:hover {
		color: #7a5c1a;
	}

	.motion__date {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-xs);
		color: #374340;
		font-style: italic;
	}
</style>
