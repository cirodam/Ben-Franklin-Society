<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, EmptyState } from '@bfs/ui';
	import Badge from '@bfs/ui/src/Badge.svelte';
	import MotionCard from '$lib/components/MotionCard.svelte';
	import MotionCreationModal from '$lib/components/MotionCreationModal.svelte';
	import RoleManagement from '$lib/components/RoleManagement.svelte';
	import OrgChart from '$lib/components/OrgChart.svelte';
	import Sections from '$lib/components/Sections.svelte';
	import type { PageData } from './$types.js';

	let { data, form }: { data: PageData; form: any } = $props();

	const {
		association,
		config,
		sourceCollege,
		termHolders,
		draws,
		activeDeliberations,
		pending,
		recentDecisions,
		roles,
		roleHierarchy,
		sections,
		members,
		canAssign,
		canCreateMotion,
		enactedMotions,
		canVacate,
		record,
		deliberationRules,
		governingDocument
	} = $derived(data);

	let showModal = $state(false);
	let activeTab = $state<'deliberations' | 'pending' | 'decisions' | 'members' | 'organization' | 'record'>('deliberations');

	$effect(() => {
		if (form?.created) {
			goto(`/motions/${form.created}`);
		}
	});

	function openCreateModal() {
		showModal = true;
	}



	const statusVariant = (s: string) => s === 'active' ? 'success' : 'neutral';
</script>

<div class="page">
	<header class="header">
		<div class="header__top">
			<div class="title-row">
				<h1>{association.name}</h1>
				<Button variant="secondary" size="sm" href="/committees/{association.uuid}/edit">✏️ Edit</Button>
			</div>
			<div class="header__badges">
				<Badge label={config?.is_permanent ? 'Permanent' : 'Ad Hoc'} variant="neutral" />
				<Badge label={association.status} variant={statusVariant(association.status)} />
			</div>
		</div>
		<p class="header__handle">@{association.handle}</p>
		<div class="header__meta">
			<span>{config?.seat_count ?? '—'} seats</span>
			<span>·</span>
			<span>{termHolders.length} currently seated</span>
			<span>·</span>
			<span>{config?.term_days ?? '—'} day terms</span>
			<span>·</span>
			<span>Pool: {sourceCollege ? sourceCollege.name : 'Community'}</span>
			{#if governingDocument}
				<span>·</span>
				<a href="/documents/{governingDocument.slug}" class="rules-link">📜 {governingDocument.title}</a>
			{/if}
		</div>
	</header>

	<!-- Tab Navigation -->
	<div class="tab-nav">
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'deliberations'}
			onclick={() => activeTab = 'deliberations'}>
			�️ Deliberation & Voting {#if activeDeliberations.length > 0}<span class="badge badge--urgent">{activeDeliberations.length}</span>{/if}
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'pending'}
			onclick={() => activeTab = 'pending'}>
			📋 Pending {#if pending.length > 0}<span class="badge">{pending.length}</span>{/if}
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'decisions'}
			onclick={() => activeTab = 'decisions'}>
			✅ Decisions
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'members'}
			onclick={() => activeTab = 'members'}>
			👥 Members ({termHolders.length})
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'organization'}
			onclick={() => activeTab = 'organization'}>
			🏢 Organization
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'record'}
			onclick={() => activeTab = 'record'}>
			📝 Record
		</button>
	</div>

	<!-- Tab Content -->
	<div class="tab-content">
		{#if activeTab === 'deliberations'}
			{#if activeDeliberations.length > 0}
				<section class="section">
					<h2 class="section__title">�️ Deliberation & Voting</h2>
					<p class="section__desc">Active discussions and open votes — your participation is needed</p>
					<div class="cards">
						{#each activeDeliberations as motion}
							<MotionCard {motion} comments={motion.comments} tally={motion.tally} variant="deliberation" />
						{/each}
					</div>
				</section>
			{:else}
				<EmptyState
					icon="🗣️"
					title="No motions currently in deliberation or voting"
				>
					{#if canCreateMotion}
						<Button onclick={openCreateModal}>
							+ New Motion Before This Committee
						</Button>
					{/if}
				</EmptyState>
			{/if}
		{:else if activeTab === 'pending'}
			{#if pending.length > 0}
				<section class="section">
					<h2 class="section__title">📋 Pending Motions</h2>
					<div class="list">
						{#each pending as motion}
							<a href="/motions/{motion.uuid}" class="list-item">
								<div class="list-item__main">
									<span class="list-item__title">{motion.title}</span>
									<span class="badge badge-{motion.status}">{motion.status}</span>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{:else}
				<EmptyState
					icon="📋"
					title="No pending motions"
				>
					{#if canCreateMotion}
						<Button onclick={openCreateModal}>
							+ New Motion Before This Committee
						</Button>
					{/if}
				</EmptyState>
			{/if}
		{:else if activeTab === 'decisions'}
			{#if recentDecisions.length > 0}
				<section class="section">
					<h2 class="section__title">✅ Recent Decisions</h2>
					<div class="list">
						{#each recentDecisions as motion}
							<a href="/motions/{motion.uuid}" class="list-item">
								<div class="list-item__main">
									<span class="list-item__title">{motion.title}</span>
									<span class="badge badge-{motion.status}">{motion.status}</span>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{:else}
				<EmptyState
					icon="✅"
					title="No decisions yet"
				/>
			{/if}
		{:else if activeTab === 'members'}
			<section class="section">
				<h2 class="section__title">👥 Current Members</h2>
				{#if termHolders.length === 0}
					<p class="empty">No seats currently filled. A sortition draw is needed.</p>
				{:else}
					<table class="roster">
						<thead>
							<tr>
								<th>Member</th>
								<th>Term Start</th>
								<th>Term End</th>
								{#if canVacate}<th></th>{/if}
							</tr>
						</thead>
						<tbody>
							{#each termHolders as t}
								<tr>
									<td>
										{#if t.person}
											<a href="/people/{t.person.uuid}">{t.person.given_name} {t.person.family_name}</a>
											<span class="handle-inline">@{t.person.handle}</span>
										{:else}
											<span class="empty">Unknown</span>
										{/if}
									</td>
									<td>{t.started_at}</td>
									<td>{t.ends_at}</td>
									{#if canVacate}
										<td>
											<form method="POST" action="?/vacateTerm">
												<input type="hidden" name="term_uuid" value="{t.uuid}" />
												<button class="btn-vacate">Vacate</button>
											</form>
										</td>
									{/if}
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}

				<h3 class="subsection__title">🎲 Draw History</h3>
				{#if draws.length === 0}
					<p class="empty">No draws conducted yet.</p>
				{:else}
					<table class="roster">
						<thead>
							<tr>
								<th>Conducted</th>
								<th>Pool Size</th>
								<th>Notes</th>
							</tr>
						</thead>
						<tbody>
							{#each draws as d}
								<tr>
									<td>{d.conducted_at}</td>
									<td>{d.pool_size}</td>
									<td>{d.notes ?? '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</section>
		{:else if activeTab === 'organization'}
			<section class="section">
				<h2 class="section__title">🏢 Organization</h2>
				
				<h3 class="subsection__title">📂 Sections</h3>
				<Sections {sections} />

				<h3 class="subsection__title">👔 Roles & Assignments</h3>
				<RoleManagement {roles} {members} {canAssign} {enactedMotions} />

				<h3 class="subsection__title">🏢 Organization Chart</h3>
				<OrgChart {roleHierarchy} />
			</section>
		{:else if activeTab === 'record'}
			<section class="section">
				<h2 class="section__title">📝 The Record</h2>
				{#if record.length === 0}
					<p class="empty">No entries yet.</p>
				{:else}
					<div class="record-feed">
						{#each record as e}
							<div class="record-entry">
								<div class="record-entry__body">{e.body}</div>
								<div class="record-entry__meta">
									{#if e.recorder_handle}<span>@{e.recorder_handle}</span><span class="meta-sep">·</span>{/if}
									<time>{e.created_at.slice(0, 10)}</time>
								</div>
							</div>
						{/each}
					</div>
					<p class="record-link"><a href="/record">View full record →</a></p>
				{/if}
			</section>
		{/if}
	</div>
</div>

<MotionCreationModal bind:show={showModal} bodyUuid={association.uuid} bodyName={association.name} deliberationRules={deliberationRules} />

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-6);
	}

	.header {
		margin-bottom: var(--space-8);
	}

	.header__top {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex: 1;
	}

	.header__top h1 {
		font-size: var(--text-3xl);
		font-weight: var(--weight-bold);
		margin: 0;
	}

	.header__badges {
		display: flex;
		gap: var(--space-2);
	}

	.header__handle {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-3) 0;
	}

	.header__meta {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		display: flex;
		gap: var(--space-2);
	}

	.section {
		margin-bottom: var(--space-8);
	}

	.section__title {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-2) 0;
	}

	.section__desc {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-4) 0;
	}

	.cards {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	/* Tab Navigation */
	.tab-nav {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-6);
		border-bottom: 2px solid var(--color-border);
		flex-wrap: wrap;
	}

	.tab-nav__button {
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
		background: transparent;
		border: none;
		border-bottom: 3px solid transparent;
		cursor: pointer;
		color: var(--color-text-muted);
		transition: all 0.2s;
		position: relative;
		bottom: -2px;
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

	.tab-nav__button .badge {
		margin-left: var(--space-2);
		background: var(--color-border);
		color: var(--color-text);
	}

	.tab-nav__button .badge--urgent {
		background: var(--color-danger-subtle);
		color: var(--color-danger);
	}

	.tab-nav__button.active .badge {
		background: var(--color-accent-subtle);
		color: var(--color-accent);
	}

	.tab-nav__button.active .badge--urgent {
		background: var(--color-danger);
		color: white;
	}

	.tab-content {
		min-height: 400px;
	}

	.subsection__title {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: var(--space-8) 0 var(--space-4) 0;
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-border);
	}

	.subsection__title:first-child {
		margin-top: 0;
		padding-top: 0;
		border-top: none;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.list-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-3);
		background: var(--color-background);
		border: 1px solid var(--color-border-faint);
		border-radius: var(--radius);
		text-decoration: none;
		color: inherit;
	}

	.list-item:hover {
		border-color: var(--color-accent);
		text-decoration: none;
	}

	.list-item__main {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex: 1;
	}

	.list-item__title {
		font-weight: var(--weight-medium);
	}

	.empty {
		color: var(--color-text-muted);
		font-style: italic;
		text-align: center;
		padding: var(--space-4);
	}

	.badge {
		display: inline-block;
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		border-radius: var(--radius);
		white-space: nowrap;
	}

	.badge-draft { background: #f3f4f6; color: #6b7280; }
	.badge-introduced { background: #dbeafe; color: #1e40af; }
	.badge-deliberation { background: #ede9fe; color: #6b21a8; }
	.badge-vote { background: #fef3c7; color: #92400e; }
	.badge-enacted { background: #d1fae5; color: #065f46; }
	.badge-rejected { background: #fee2e2; color: #991b1b; }
	.badge-withdrawn { background: #f3f4f6; color: #6b7280; }

	.roster {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}

	.roster th {
		text-align: left;
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		font-size: var(--text-xs);
		letter-spacing: 0.05em;
	}

	.roster td {
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid var(--color-border);
	}

	.roster tr:last-child td {
		border-bottom: none;
	}

	.handle-inline {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		margin-left: var(--space-2);
	}

	.btn-vacate {
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-xs);
		background: #fee2e2;
		color: #991b1b;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.record-feed {
		display: flex;
		flex-direction: column;
	}

	.record-entry {
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.record-entry:first-child {
		padding-top: 0;
	}

	.record-entry:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.record-entry__body {
		font-size: var(--text-sm);
		line-height: 1.5;
		margin-bottom: var(--space-1);
	}

	.record-entry__meta {
		display: flex;
		gap: var(--space-2);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.meta-sep {
		color: var(--color-border);
	}

	.record-link {
		margin-top: var(--space-3);
		text-align: center;
	}

	.record-link a {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.record-link a:hover {
		text-decoration: underline;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.page {
			padding: var(--space-4);
		}

		.header__top {
			flex-direction: column;
			align-items: flex-start;
		}

		.header__meta {
			flex-wrap: wrap;
		}

		.header__top h1 {
			font-size: var(--text-2xl);
		}

		.roster {
			font-size: var(--text-xs);
		}

		.roster th,
		.roster td {
			padding: var(--space-1) var(--space-2);
		}
	}
</style>
