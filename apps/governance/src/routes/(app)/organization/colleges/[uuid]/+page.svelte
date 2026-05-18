<script lang="ts">
	import { Button, Card, EmptyState } from '@bfs/ui';
	import Badge from '@bfs/ui/src/Badge.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { association, members, roles, motions, governingDocument } = $derived(data);

	const statusVariant = (s: string) => s === 'active' ? 'success' : 'neutral';

	const motionVariant = (s: string) =>
		s === 'enacted' ? 'success'
		: s === 'rejected' ? 'danger'
		: s === 'vote' ? 'warn'
		: 'neutral';

	let activeTab: 'members' | 'roles' | 'motions' = $state('members');


</script>

<div class="page">
	<div class="page-header">
		<div class="page-header__top">
			<div class="title-row">
				<h1>{association.name}</h1>
				<Button variant="secondary" size="sm" href="/organization/colleges/{association.uuid}/edit">✏️ Edit</Button>
			</div>
			<div class="page-header__badges">
				<Badge label="College" variant="accent" />
				<Badge label={association.status} variant={statusVariant(association.status)} />
			</div>
		</div>
		<div class="page-header__meta">
			<span class="handle">@{association.handle}</span>
			{#if governingDocument}
				<span>·</span>
				<a href="/library/{governingDocument.slug}" class="founding-doc-link">
					📜 Founding Document
				</a>
			{/if}
		</div>
	</div>

	<nav class="tabs">
		<button
			class="tab"
			class:active={activeTab === 'members'}
			onclick={() => (activeTab = 'members')}
		>
			Members
			{#if members.length > 0}
				<span class="badge">{members.length}</span>
			{/if}
		</button>
		<button
			class="tab"
			class:active={activeTab === 'roles'}
			onclick={() => (activeTab = 'roles')}
		>
			Roles
			{#if roles.length > 0}
				<span class="badge">{roles.length}</span>
			{/if}
		</button>
		<button
			class="tab"
			class:active={activeTab === 'motions'}
			onclick={() => (activeTab = 'motions')}
		>
			Activity
			{#if motions.length > 0}
				<span class="badge">{motions.length}</span>
			{/if}
		</button>
	</nav>

	<div class="tab-content">
		{#if activeTab === 'members'}
			<Card>
				<h2>Members</h2>
				{#if members.length === 0}
					<EmptyState
						icon="👥"
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
			<Card>
				<h2>Roles</h2>
				{#if roles.length === 0}
					<EmptyState
						icon="🎭"
						title="No roles defined"
					/>
				{:else}
					<ul class="tag-list">
						{#each roles as r}
							<li class="tag">{r.name}</li>
						{/each}
					</ul>
				{/if}
			</Card>
		{:else if activeTab === 'motions'}
			<Card>
				<h2>Recent Activity</h2>
				{#if motions.length === 0}
					<EmptyState
						icon="📋"
						title="No motions yet"
					/>
				{:else}
					<ul class="motion-list">
						{#each motions as m}
							<li class="motion">
								<a href="/governance/motions/{m.uuid}" class="motion__title">{m.title}</a>
								<div class="motion__meta">
									<Badge label={m.status} variant={motionVariant(m.status)} />
									<span class="motion__date">{m.created_at.slice(0, 10)}</span>
								</div>
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
	}

	.page-header__top {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		width: 100%;
	}

	.title-row h1 {
		margin: 0;
	}

	.page-header__badges {
		display: flex;
		gap: var(--space-2);
	}

	.page-header__meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.handle {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.founding-doc-link {
		color: var(--color-accent);
		text-decoration: none;
		font-weight: var(--weight-medium);
	}

	.founding-doc-link:hover {
		text-decoration: underline;
	}

	.tabs {
		display: flex;
		gap: var(--space-2);
		border-bottom: 2px solid var(--color-border);
		margin-top: var(--space-4);
	}

	.tab {
		background: none;
		border: none;
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.tab:hover {
		color: var(--color-text);
	}

	.tab.active {
		color: var(--color-accent);
		border-bottom-color: var(--color-accent);
	}

	.tab .badge {
		font-size: var(--text-xs);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		padding: 1px 6px;
		font-weight: var(--weight-normal);
	}

	.tab.active .badge {
		background: var(--color-accent-bg);
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.tab-content {
		margin-top: var(--space-6);
	}

	h2 {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
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
		gap: var(--space-2);
		font-size: var(--text-sm);
		padding: var(--space-3);
		background: var(--color-bg);
		border-radius: var(--radius);
	}

	.member__name {
		font-weight: var(--weight-medium);
		color: var(--color-text);
		text-decoration: none;
	}

	.member__name:hover {
		text-decoration: underline;
	}

	.member__name.muted {
		color: var(--color-text-muted);
		font-weight: normal;
	}

	.member__handle {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.member__since {
		margin-left: auto;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.tag-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.tag {
		font-size: var(--text-sm);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-2) var(--space-4);
		font-weight: var(--weight-medium);
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
		background: var(--color-bg);
		border-radius: var(--radius);
	}

	.motion__title {
		font-size: var(--text-sm);
		color: var(--color-text);
		text-decoration: none;
		font-weight: var(--weight-medium);
	}

	.motion__title:hover {
		text-decoration: underline;
	}

	.motion__meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.motion__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
</style>
