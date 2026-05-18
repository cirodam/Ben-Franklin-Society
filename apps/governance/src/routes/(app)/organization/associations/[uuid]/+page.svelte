<script lang="ts">
	import { Badge, Card, PageHeader } from '@bfs/ui';
	import InteractiveOrgChart from '$lib/components/InteractiveOrgChart.svelte';
	import RoleTemplates from '$lib/components/RoleTemplates.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { association, members, roles, roleHierarchy, sections, motions, canAssign, canManage, enactedMotions, templates, vacantRoles, budgetTotal } = $derived(data);

	const typeLabel: Record<string, string> = {
		association: 'Association',
		service:     'Service',
		college:     'College',
		committee:   'Committee',
	};

	const statusVariant = (s: string) => s === 'active' ? 'success' : 'neutral';

	const motionVariant = (s: string) =>
		s === 'enacted' ? 'success'
		: s === 'rejected' ? 'danger'
		: s === 'vote' ? 'warn'
		: 'neutral';
</script>

<div class="page">
	<PageHeader title={association.name}>
		<div class="header-meta">
			<div class="badges">
				<Badge label={typeLabel[association.type] ?? association.type} variant="neutral" />
				<Badge label={association.status} variant={statusVariant(association.status)} />
			</div>
			<p class="handle">@{association.handle}</p>
		</div>
	</PageHeader>

	<div class="sections">
		<!-- Members -->
		<Card>
			<h2>Members <span class="count">{members.length}</span></h2>
			{#if members.length === 0}
				<p class="empty">No current members.</p>
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

		<!-- Organization Chart -->
		<InteractiveOrgChart 
			{sections} 
			{roles} 
			{members}
			{enactedMotions}
			associationUuid={association.uuid}
			canManage={canManage}
		/>

		{#if canAssign}
			<RoleTemplates {templates} associationUuid={association.uuid} />
		{/if}

		<!-- Recent motions -->
		<Card>
			<h2>Recent Motions</h2>
			{#if motions.length === 0}
				<p class="empty">No motions yet.</p>
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
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.header-meta {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}

	.badges {
		display: flex;
		gap: var(--space-2);
	}

	.handle {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: 0;
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.sections h2 {
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-4) 0;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.count {
		font-size: var(--text-xs);
		font-weight: var(--weight-normal);
		color: var(--color-text-muted);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		padding: 1px 8px;
	}

	.empty {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.member-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.member {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		font-size: var(--text-sm);
	}

	.member__name {
		font-weight: var(--weight-medium);
		color: var(--color-text);
		text-decoration: none;
	}

	.member__name:hover { text-decoration: underline; }

	.member__name.muted { color: var(--color-text-muted); font-weight: normal; }

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
		font-size: var(--text-xs);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		padding: var(--space-1) var(--space-3);
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
	}

	.motion__title {
		font-size: var(--text-sm);
		color: var(--color-text);
		text-decoration: none;
	}

	.motion__title:hover { text-decoration: underline; }

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
