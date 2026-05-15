<script lang="ts">
	import { goto } from '$app/navigation';
	import MotionCard from '$lib/components/MotionCard.svelte';
	import MotionCreationModal from '$lib/components/MotionCreationModal.svelte';
	import RoleManagement from '$lib/components/RoleManagement.svelte';
	import OrgChart from '$lib/components/OrgChart.svelte';
	import Sections from '$lib/components/Sections.svelte';
	import OrgStructureBuilder from '$lib/components/OrgStructureBuilder.svelte';
	import type { PageData } from './$types.js';

	let { data, form }: { data: PageData; form: any } = $props();

	const { 
		association, 
		config, 
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
		assemblyRules
	} = $derived(data);

	let showModal = $state(false);
	let activeTab = $state<'deliberations' | 'pending' | 'decisions' | 'members' | 'organization'>('deliberations');

	$effect(() => {
		if (form?.created) {
			goto(`/motions/${form.created}`);
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
				<a href="/documents/assembly-rules" class="rules-link">📜 Rules of the Assembly</a>
			{/if}
		</div>
	</header>

	<!-- Tab Navigation -->
	<div class="tab-nav">
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'deliberations'}
			onclick={() => activeTab = 'deliberations'}>
			�️ Deliberations & Voting {#if activeDeliberations.length > 0}<span class="badge badge--urgent">{activeDeliberations.length}</span>{/if}
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
	</div>

	<!-- Tab Content -->
	<div class="tab-content">
		{#if activeTab === 'deliberations'}
			{#if activeDeliberations.length > 0}
				<section class="deliberation-section">
					<h2 class="section__title">�️ Deliberation & Voting</h2>
					<p class="section__desc">Active discussions and open votes — your participation is needed</p>
					<div class="cards">
						{#each activeDeliberations as motion}
							<MotionCard {motion} bodyAbbreviation={association.abbreviation} comments={motion.comments} tally={motion.tally} variant="deliberation" />
						{/each}
					</div>
				</section>
			{:else}
				<div class="empty-state">
					<p class="empty-state__message">No motions currently in deliberation or voting</p>
				</div>
			{/if}
		{:else if activeTab === 'pending'}
			{#if pending.length > 0}
				<section class="section">
					<h2 class="section__title">📋 Pending Motions</h2>
					<div class="list">
						{#each pending as motion}
							<a href="/motions/{motion.uuid}" class="list-item">
								<div class="list-item__main">
									<div class="list-item__title-row">
										<span class="list-item__motion-id">
											{#if association.abbreviation}
												{association.abbreviation} {motion.motion_number}
											{:else}
												#{motion.motion_number}
											{/if}
										</span>
										<span class="list-item__title">{motion.title}</span>
									</div>
									<span class="badge badge-{motion.status}">{motion.status}</span>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{:else}
				<div class="empty-state">
					<p class="empty-state__message">No pending motions</p>
				</div>
			{/if}
		{:else if activeTab === 'decisions'}
			{#if recentDecisions.length > 0}
				<section class="section">
					<h2 class="section__title">✅ Recent Decisions</h2>
					<div class="list">
						{#each recentDecisions as motion}
							<a href="/motions/{motion.uuid}" class="list-item">
								<div class="list-item__main">
									<div class="list-item__title-row">
										<span class="list-item__motion-id">
											{#if association.abbreviation}
												{association.abbreviation} {motion.motion_number}
											{:else}
												#{motion.motion_number}
											{/if}
										</span>
										<span class="list-item__title">{motion.title}</span>
									</div>
									<span class="badge badge-{motion.status}">{motion.status}</span>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{:else}
				<div class="empty-state">
					<p class="empty-state__message">No recent decisions</p>
				</div>
			{/if}
		{:else if activeTab === 'members'}
			<section class="section">
				<h2 class="section__title">👥 Current Members</h2>
				{#if termHolders.length === 0}
					<p class="empty-state__message">No seats currently filled. A sortition draw is needed.</p>
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
											{t.person.given_name} {t.person.family_name}
											<span class="handle">@{t.person.handle}</span>
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

				<div class="subsection">
					<h3>🎲 Draw History</h3>
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
				</div>
			</section>
		{:else if activeTab === 'organization'}
			<section class="section">
				<h2 class="section__title">🏢 Organization</h2>
				
				<div class="subsection">
					<h3>🏗️ Structure Builder</h3>
					<p class="subsection-description">
						Define your organization's structure by creating sections (departments) and roles. 
						Build hierarchies using parent relationships.
					</p>
					<OrgStructureBuilder {sections} {roles} />
				</div>

				<div class="subsection">
					<h3>📂 Sections Overview</h3>
					<Sections {sections} />
				</div>

				<div class="subsection">
					<h3>👔 Roles & Assignments</h3>
					<RoleManagement {roles} {members} {canAssign} {enactedMotions} />
				</div>

				<div class="subsection">
					<h3>🏢 Organization Chart</h3>
					<OrgChart {roleHierarchy} />
				</div>

				<div class="subsection">
					<h3>📝 The Record</h3>
					{#if record.length === 0}
						<p class="empty">No entries in the record yet.</p>
					{:else}
						<div class="record">
							{#each record as entry}
								<div class="record-entry">
									<div class="record-entry__time">{entry.recorded_at}</div>
									<div class="record-entry__body">
										<strong>{entry.recorder_handle ?? 'System'}</strong> — {entry.summary}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</section>
		{/if}
	</div>

	{#if canCreateMotion}
		<div class="create-section">
			<button type="button" class="btn btn--primary" onclick={openCreateModal}>
				+ New Motion Before the Assembly
			</button>
		</div>
	{/if}

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

	/* Tab Navigation */
	.tab-nav {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-6);
		border-bottom: 2px solid var(--color-border);
		overflow-x: auto;
		padding-bottom: var(--space-2);
	}

	.tab-nav__button {
		background: none;
		border: none;
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
		cursor: pointer;
		border-bottom: 3px solid transparent;
		transition: all 0.2s;
		white-space: nowrap;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		position: relative;
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

	.tab-nav__button .badge {
		background: var(--color-muted);
		color: var(--color-text);
		padding: 2px 6px;
		border-radius: var(--radius);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
	}

	.tab-nav__button .badge--urgent {
		background: var(--color-danger);
		color: white;
	}

	.tab-nav__button.active .badge {
		background: var(--color-accent);
		color: white;
	}

	.tab-nav__button.active .badge--urgent {
		background: var(--color-danger);
		color: white;
	}

	.tab-content {
		min-height: 400px;
	}

	.empty-state {
		padding: var(--space-12) var(--space-6);
		text-align: center;
	}

	.empty-state__message {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
		margin: 0;
	}

	.subsection {
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-border);
	}

	.subsection:first-child {
		margin-top: 0;
		padding-top: 0;
		border-top: none;
	}

	.subsection h3 {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-4) 0;
	}

	.subsection-description {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-4) 0;
		line-height: 1.5;
	}

	.record {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.record-entry {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-3);
	}

	.record-entry__time {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		margin-bottom: var(--space-1);
	}

	.record-entry__body {
		font-size: var(--text-sm);
		line-height: 1.5;
	}

	.header {
		margin-bottom: var(--space-8);
	}

	.header__top h1 {
		font-size: var(--text-3xl);
		font-weight: var(--weight-bold);
		margin: 0 0 var(--space-2) 0;
	}

	.header__subtitle {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
	}

	.header__meta {
		margin-top: var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		display: flex;
		gap: var(--space-2);
	}

	.rules-link {
		color: var(--color-accent);
		text-decoration: none;
		font-weight: var(--weight-medium);
	}

	.rules-link:hover {
		text-decoration: underline;
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

	.create-section {
		margin: var(--space-6) 0;
		padding: var(--space-6);
		background: var(--color-surface);
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-lg);
		text-align: center;
	}

	.btn {
		padding: var(--space-3) var(--space-5);
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
		border-radius: var(--radius);
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn--primary {
		background: var(--color-accent);
		color: white;
	}

	.btn--primary:hover {
		background: var(--color-accent-hover);
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

	.list-item__title-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		flex: 1;
	}

	.list-item__motion-id {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
		flex-shrink: 0;
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

	.handle {
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

	/* Paper stack for deliberations */
	.deliberation-section {
		background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-accent-subtle) 100%);
		padding: var(--space-8);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-8);
	}

	.deliberation-section .section__title {
		font-size: var(--text-2xl);
		margin-bottom: var(--space-2);
	}

	.deliberation-section .section__desc {
		margin-bottom: var(--space-6);
		font-size: var(--text-base);
	}

	.paper-stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		perspective: 1000px;
	}

	.paper {
		display: block;
		background: white;
		border: 1px solid #e0d5c7;
		border-radius: 2px;
		padding: var(--space-6);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.05),
			0 4px 12px rgba(0, 0, 0, 0.08),
			0 8px 24px rgba(0, 0, 0, 0.06);
		text-decoration: none;
		color: inherit;
		position: relative;
		transition: all 0.3s ease;
		transform: translateY(calc(var(--paper-index, 0) * -2px)) 
		           rotate(calc(var(--paper-index, 0) * 0.5deg));
		animation: paperFloat 6s ease-in-out infinite;
		animation-delay: calc(var(--paper-index, 0) * 0.3s);
	}

	@keyframes paperFloat {
		0%, 100% { transform: translateY(calc(var(--paper-index, 0) * -2px)) rotate(calc(var(--paper-index, 0) * 0.5deg)); }
		50% { transform: translateY(calc(var(--paper-index, 0) * -2px - 4px)) rotate(calc(var(--paper-index, 0) * 0.5deg + 0.5deg)); }
	}

	.paper:hover {
		transform: translateY(-8px) rotate(0deg) scale(1.02);
		box-shadow: 
			0 2px 6px rgba(0, 0, 0, 0.08),
			0 8px 20px rgba(0, 0, 0, 0.12),
			0 16px 40px rgba(0, 0, 0, 0.1);
		z-index: 10;
		animation: none;
	}

	.paper::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: repeating-linear-gradient(
			90deg,
			transparent,
			transparent 10px,
			rgba(0, 0, 0, 0.03) 10px,
			rgba(0, 0, 0, 0.03) 11px
		);
	}

	.paper__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.paper__title-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		flex: 1;
	}

	.paper__motion-id {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: #8b6f47;
		flex-shrink: 0;
	}

	.paper__title {
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		margin: 0;
		flex: 1;
		color: #2c1810;
		line-height: 1.3;
	}

	.paper__badge {
		background: var(--color-warning);
		color: white;
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.paper__body {
		font-size: var(--text-base);
		line-height: 1.6;
		color: #3d2817;
		margin: 0 0 var(--space-4) 0;
		font-family: Georgia, 'Times New Roman', serif;
	}

	.paper__meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--space-3);
		border-top: 1px solid #e0d5c7;
		font-size: var(--text-sm);
		color: #6b5444;
	}

	.paper__comments {
		font-weight: var(--weight-medium);
	}

	.paper__date {
		font-style: italic;
	}
</style>
