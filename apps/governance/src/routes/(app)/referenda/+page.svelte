<script lang="ts">
	import type { PageData } from './$types.js';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: any } = $props();

	const { association, members, openVotes, activeDeliberations, pending, recentDecisions, canCreateMotion, deliberationRules } = $derived(data);

	let showModal = $state(false);

	$effect(() => {
		if (form?.created) {
			goto(`/motions/${form.created}`);
		}
	});

	function openCreateModal() {
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'draft': return 'badge-draft';
			case 'introduced': return 'badge-introduced';
			case 'deliberation': return 'badge-deliberation';
			case 'vote': return 'badge-vote';
			case 'enacted': return 'badge-enacted';
			case 'rejected': return 'badge-rejected';
			case 'withdrawn': return 'badge-withdrawn';
			default: return '';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'draft': return 'Draft';
			case 'introduced': return 'Introduced';
			case 'deliberation': return 'Deliberation';
			case 'vote': return 'Voting';
			case 'enacted': return 'Enacted';
			case 'rejected': return 'Rejected';
			case 'withdrawn': return 'Withdrawn';
			default: return status;
		}
	}

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

	function getVotePercentage(tally: any): number {
		if (!tally || tally.eligible === 0) return 0;
		return Math.round((tally.voted / tally.eligible) * 100);
	}

	function getAyePercentage(tally: any): number {
		if (!tally || tally.voted === 0) return 0;
		return Math.round((tally.aye / tally.voted) * 100);
	}
</script>

<div class="page">
	<header class="header">
		<div class="header__top">
			<h1>Community Referenda</h1>
			<span class="header__subtitle">Direct democracy for society-wide deliberation</span>
		</div>
		<div class="header__meta">
			<span>{members.length} members</span>
		</div>
	</header>

	{#if openVotes.length > 0}
		<section class="section">
			<h2 class="section__title">🗳️ Open Votes</h2>
			<p class="section__desc">Action required — cast your vote now</p>
			<div class="cards">
				{#each openVotes as motion}
					<a href="/motions/{motion.uuid}" class="card card--vote">
						<div class="card__header">
							<h3 class="card__title">{motion.title}</h3>
							<span class="badge {getStatusBadgeClass(motion.status)}">{getStatusLabel(motion.status)}</span>
						</div>
						{#if motion.tally}
							<div class="vote-progress">
								<div class="vote-progress__bar">
									<div class="vote-progress__fill" style="width: {getVotePercentage(motion.tally)}%"></div>
								</div>
								<div class="vote-stats">
									<span>{motion.tally.voted} of {motion.tally.eligible} voted ({getVotePercentage(motion.tally)}%)</span>
									<span class="vote-stats__breakdown">
										{motion.tally.aye} aye · {motion.tally.nay} nay · {motion.tally.abstain} abstain
									</span>
								</div>
							</div>
						{/if}
						<div class="card__meta">
							<span>Opened {formatDate(motion.vote_opened_at || motion.created_at)}</span>
							<span>{motion.comments.length} comments</span>
						</div>
					</a>
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
					<a href="/motions/{motion.uuid}" class="card card--deliberation">
						<div class="card__header">
							<h3 class="card__title">{motion.title}</h3>
							<span class="badge {getStatusBadgeClass(motion.status)}">{getStatusLabel(motion.status)}</span>
						</div>
						<div class="card__meta">
							<span>Introduced {formatDate(motion.created_at)}</span>
							<span>{motion.comments.length} comments</span>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	{#if canCreateMotion}
		<div class="create-section">
			<button type="button" class="btn btn--primary" onclick={openCreateModal}>
				+ Put a Question to the Community
			</button>
		</div>
	{/if}

	<div class="tabs">
		<details class="tab">
			<summary class="tab__header">
				📋 Pending Questions ({pending.length})
			</summary>
			<div class="tab__content">
				{#if pending.length > 0}
					<div class="list">
						{#each pending as motion}
							<a href="/motions/{motion.uuid}" class="list-item">
								<div class="list-item__main">
									<span class="list-item__title">{motion.title}</span>
									<span class="badge {getStatusBadgeClass(motion.status)}">{getStatusLabel(motion.status)}</span>
								</div>
								<span class="list-item__meta">{formatDate(motion.created_at)}</span>
							</a>
						{/each}
					</div>
				{:else}
					<p class="empty">No pending questions</p>
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
									<span class="badge {getStatusBadgeClass(motion.status)}">{getStatusLabel(motion.status)}</span>
								</div>
								<span class="list-item__meta">
									{formatDate(motion.enacted_at || motion.rejected_at || motion.created_at)}
								</span>
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
				📚 Full Archive
			</summary>
			<div class="tab__content">
				<p><a href="/motions?body={association.uuid}">View all community referenda →</a></p>
			</div>
		</details>
	</div>
</div>

{#if showModal}
	<div class="modal-overlay" onclick={closeModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal__header">
				<h2>Put a Question to the Community</h2>
				<button type="button" class="modal__close" onclick={closeModal}>×</button>
			</div>
			<form method="POST" action="?/create" use:enhance>
				<div class="form-group">
					<label for="title">Question Title</label>
					<input type="text" id="title" name="title" required />
				</div>
				<div class="form-group">
					<label for="body">Motion Text</label>
					<textarea id="body" name="body" rows="8" required></textarea>
					<small>What should the community decide?</small>
				</div>
				<div class="form-group">
					<label for="reasoning">Reasoning (optional)</label>
					<textarea id="reasoning" name="reasoning" rows="4"></textarea>
					<small>Why should this be considered?</small>
				</div>
				{#if deliberationRules.length > 0}
					<div class="form-group">
						<label for="deliberation_rule_uuid">Deliberation Period (optional)</label>
						<select id="deliberation_rule_uuid" name="deliberation_rule_uuid">
							<option value="">— no deliberation period —</option>
							{#each deliberationRules as rule}
								<option value={rule.uuid}>{rule.name}</option>
							{/each}
						</select>
						<small>Minimum time for discussion before voting can begin</small>
					</div>
				{/if}
				<div class="modal__actions">
					<button type="button" class="btn btn--secondary" onclick={closeModal}>Cancel</button>
					<button type="submit" class="btn btn--primary">Submit Question</button>
				</div>
			</form>
		</div>
	</div>
{/if}

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

	.card {
		display: block;
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.card:hover {
		border-color: var(--color-accent);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		text-decoration: none;
	}

	.card--vote {
		border-left: 4px solid #f59e0b;
		background: linear-gradient(to right, #fef3c7 0%, var(--color-surface) 10%);
	}

	.card--deliberation {
		border-left: 4px solid #8b5cf6;
		background: linear-gradient(to right, #ede9fe 0%, var(--color-surface) 10%);
	}

	.card__header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.card__title {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 0;
		flex: 1;
	}

	.card__meta {
		display: flex;
		gap: var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.vote-progress {
		margin: var(--space-4) 0;
	}

	.vote-progress__bar {
		height: 8px;
		background: var(--color-border-faint);
		border-radius: var(--radius);
		overflow: hidden;
		margin-bottom: var(--space-2);
	}

	.vote-progress__fill {
		height: 100%;
		background: var(--color-accent);
		transition: width 0.3s;
	}

	.vote-stats {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.vote-stats__breakdown {
		font-weight: var(--weight-medium);
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

	.create-section {
		margin: var(--space-6) 0;
		padding: var(--space-6);
		background: var(--color-surface);
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-lg);
		text-align: center;
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

	.list-item__meta {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.empty {
		color: var(--color-text-muted);
		font-style: italic;
		text-align: center;
		padding: var(--space-4);
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

	.btn--secondary {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn--secondary:hover {
		background: var(--color-accent-subtle);
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: var(--space-4);
	}

	.modal {
		background: var(--color-background);
		border-radius: var(--radius-lg);
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-5);
		border-bottom: 1px solid var(--color-border);
	}

	.modal__header h2 {
		margin: 0;
		font-size: var(--text-xl);
	}

	.modal__close {
		background: none;
		border: none;
		font-size: var(--text-2xl);
		cursor: pointer;
		color: var(--color-text-muted);
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal__close:hover {
		color: var(--color-text);
	}

	form {
		padding: var(--space-5);
	}

	.form-group {
		margin-bottom: var(--space-4);
	}

	.form-group label {
		display: block;
		font-weight: var(--weight-medium);
		margin-bottom: var(--space-2);
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-family: inherit;
		font-size: var(--text-base);
	}

	.form-group small {
		display: block;
		margin-top: var(--space-1);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.modal__actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		margin-top: var(--space-5);
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

		.header__top h1 {
			font-size: var(--text-2xl);
		}
	}
</style>
