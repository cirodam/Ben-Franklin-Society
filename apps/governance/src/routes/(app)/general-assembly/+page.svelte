<script lang="ts">
	import { goto } from '$app/navigation';
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
		termHolders, 
		draws,
		openVotes, 
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
		deliberationRules
	} = $derived(data);

	let showModal = $state(false);

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
		</div>
	</header>

	{#if openVotes.length > 0}
		<section class="section">
			<h2 class="section__title">🗳️ Open Votes</h2>
			<p class="section__desc">Action required — cast your vote now</p>
			<div class="cards">
				{#each openVotes as motion}
					<MotionCard {motion} comments={motion.comments} tally={motion.tally} variant="vote" />
				{/each}
			</div>
		</section>
	{/if}

	{#if activeDeliberations.length > 0}
		<section class="section">
			<h2 class="section__title">📊 Active Deliberations</h2>
			<p class="section__desc">Ongoing discussion and debate</p>
			<div class="cards">
				{#each activeDeliberations as motion}
					<MotionCard {motion} comments={motion.comments} variant="deliberation" />
				{/each}
			</div>
		</section>
	{/if}

	{#if canCreateMotion}
		<div class="create-section">
			<button type="button" class="btn btn--primary" onclick={openCreateModal}>
				+ New Motion Before the Assembly
			</button>
		</div>
	{/if}

	<div class="tabs">
		<details class="tab">
			<summary class="tab__header">
				📋 Pending Motions ({pending.length})
			</summary>
			<div class="tab__content">
				{#if pending.length > 0}
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
				{:else}
					<p class="empty">No pending motions</p>
				{/if}
			</div>
		</details>

		<details class="tab">
			<summary class="tab__header">
				✅ Recent Decisions
			</summary>
			<div class="tab__content">
				{#if recentDecisions.length > 0}
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
				{:else}
					<p class="empty">No recent decisions</p>
				{/if}
			</div>
		</details>

		<details class="tab">
			<summary class="tab__header">
				👥 Current Members ({termHolders.length})
			</summary>
			<div class="tab__content">
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
			</div>
		</details>

		<details class="tab">
			<summary class="tab__header">
				🎲 Draw History
			</summary>
			<div class="tab__content">
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
		</details>

		<details class="tab">
			<summary class="tab__header">
				📂 Sections
			</summary>
			<div class="tab__content">
				<Sections {sections} />
			</div>
		</details>

		<details class="tab">
			<summary class="tab__header">
				👔 Roles & Assignments
			</summary>
			<div class="tab__content">
				<RoleManagement {roles} {members} {canAssign} {enactedMotions} />
			</div>
		</details>

		<details class="tab">
			<summary class="tab__header">
				🏢 Organization Chart
			</summary>
			<div class="tab__content">
				<OrgChart {roleHierarchy} />
			</div>
		</details>

		<details class="tab">
			<summary class="tab__header">
				📝 The Record
			</summary>
			<div class="tab__content">
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
			</div>
		</details>
	</div>
</div>

<MotionCreationModal bind:show={showModal} bodyUuid={association.uuid} bodyName="the General Assembly" deliberationRules={deliberationRules} />

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-6);
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

	.tabs {
		margin-top: var(--space-8);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.tab {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.tab__header {
		padding: var(--space-4);
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		cursor: pointer;
		user-select: none;
	}

	.tab__header:hover {
		background: var(--color-accent-subtle);
	}

	.tab__content {
		padding: 0 var(--space-4) var(--space-4);
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
