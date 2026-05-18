<script lang="ts">
	import type { PageData } from './$types.js';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { Button, EmptyState, Modal, Input, Textarea, Select } from '@bfs/ui';

	let { data, form }: { data: PageData; form: any } = $props();

	const { 
		association, 
		members, 
		activeDeliberations, 
		pending, 
		recentDecisions, 
		canCreateMotion, 
		deliberationRules,
		openPetitions,
		respondedPetitions,
		openReferendums,
		closedReferendums,
	} = $derived(data);

	let showModal = $state(false);
	let showPetitionModal = $state(false);
	let activeTab = $state<'referendums' | 'petitions' | 'deliberations' | 'pending' | 'decisions'>('referendums');

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

	function openPetitionModal() {
		showPetitionModal = true;
	}

	function closePetitionModal() {
		showPetitionModal = false;
	}

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'draft': return 'badge-draft';
			case 'introduced': return 'badge-introduced';
			case 'deliberation': return 'badge-deliberation';
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
			case 'deliberation': return 'Deliberation & Voting';
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

	<!-- Tab Navigation -->
	<div class="tab-nav">
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'referendums'}
			onclick={() => activeTab = 'referendums'}>
			🗳️ Referendums {#if openReferendums.length > 0}<span class="badge">{openReferendums.length}</span>{/if}
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'petitions'}
			onclick={() => activeTab = 'petitions'}>
			✍️ Petitions {#if openPetitions.length > 0}<span class="badge">{openPetitions.length}</span>{/if}
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'deliberations'}
			onclick={() => activeTab = 'deliberations'}>
			📊 Deliberations {#if activeDeliberations.length > 0}<span class="badge">{activeDeliberations.length}</span>{/if}
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
	</div>

	<!-- Tab Content -->
	<div class="tab-content">
		{#if activeTab === 'referendums'}
			{#if openReferendums.length > 0}
				{#each openReferendums as referendum}
					<section class="section referendum-section">
						<div class="referendum-header">
							<div>
								<h2 class="referendum-title">🗳️ {referendum.title}</h2>
								{#if referendum.description}
									<p class="referendum-description">{referendum.description}</p>
								{/if}
								<div class="referendum-dates">
									<span>Open: {formatDate(referendum.opens_at)}</span>
									<span>Closes: {formatDate(referendum.closes_at)}</span>
								</div>
							</div>
						</div>

						<div class="referendum-questions">
							{#each referendum.questions as question}
								<div class="question-card">
									<h3 class="question-text">{question.question_text}</h3>
									{#if question.description}
										<p class="question-description">{question.description}</p>
									{/if}

									{#if question.question_type === 'yes_no'}
										<form method="POST" action="?/voteOnQuestion" use:enhance class="vote-form">
											<input type="hidden" name="question_uuid" value={question.uuid} />
											<div class="vote-options yes-no">
												<button 
													type="submit" 
													name="vote_value" 
													value={JSON.stringify('yes')}
													class="vote-button"
													class:voted={question.userVote && JSON.parse(question.userVote.vote_value) === 'yes'}
												>
													👍 Yes
												</button>
												<button 
													type="submit" 
													name="vote_value" 
													value={JSON.stringify('no')}
													class="vote-button"
													class:voted={question.userVote && JSON.parse(question.userVote.vote_value) === 'no'}
												>
													👎 No
												</button>
												<button 
													type="submit" 
													name="vote_value" 
													value={JSON.stringify('abstain')}
													class="vote-button vote-button--abstain"
													class:voted={question.userVote && JSON.parse(question.userVote.vote_value) === 'abstain'}
												>
													Abstain
												</button>
											</div>
										</form>
									{:else if question.question_type === 'multiple_choice'}
										<form method="POST" action="?/voteOnQuestion" use:enhance class="vote-form">
											<input type="hidden" name="question_uuid" value={question.uuid} />
											<div class="vote-options multiple-choice">
												{#each question.options as option}
													<button 
														type="submit" 
														name="vote_value" 
														value={JSON.stringify(option.uuid)}
														class="vote-button vote-button--choice"
														class:voted={question.userVote && JSON.parse(question.userVote.vote_value) === option.uuid}
													>
														{option.option_text}
													</button>
												{/each}
											</div>
										</form>
									{:else if question.question_type === 'ranking'}
										<div class="ranking-notice">
											<p>Ranking questions coming soon</p>
										</div>
									{/if}

									{#if question.userVote}
										<div class="vote-status">
											✓ You voted on {formatDate(question.userVote.voted_at)}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</section>
				{/each}
			{:else}
				<EmptyState
					icon="🗳️"
					title="No open referendums"
					description="Check back during the November referendum period"
				/>
			{/if}
		{:else if activeTab === 'petitions'}
			<section class="section">
				<div class="section__header">
					<h2 class="section__title">✍️ Community Petitions</h2>
					<Button onclick={openPetitionModal}>+ Create Petition</Button>
				</div>
				<p class="section__desc">Signal priorities and concerns to the assembly</p>
				
				{#if openPetitions.length > 0}
					<div class="petitions">
						{#each openPetitions as petition}
							<div class="petition-card">
								<div class="petition-card__header">
									<h3 class="petition-card__title">{petition.title}</h3>
									<span class="petition-card__signatures">{petition.signature_count} signature{petition.signature_count !== 1 ? 's' : ''}</span>
								</div>
								<p class="petition-card__body">{petition.body}</p>
								<div class="petition-card__footer">
									<span class="petition-card__date">Created {formatDate(petition.created_at)}</span>
									<form method="POST" action={petition.is_signed_by ? '?/unsignPetition' : '?/signPetition'} use:enhance>
										<input type="hidden" name="petition_uuid" value={petition.uuid} />
										<Button type="submit" variant={petition.is_signed_by ? 'secondary' : 'primary'} size="small">
											{petition.is_signed_by ? 'Unsign' : 'Sign Petition'}
										</Button>
									</form>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<EmptyState
						icon="✍️"
						title="No open petitions"
						description="Be the first to create a petition and signal what matters to the community"
					>
						<Button onclick={openPetitionModal}>+ Create Petition</Button>
					</EmptyState>
				{/if}

				{#if respondedPetitions.length > 0}
					<div class="responded-section">
						<h3 class="subsection-title">Responded Petitions</h3>
						<div class="list">
							{#each respondedPetitions as petition}
								<div class="list-item petition-responded">
									<div class="list-item__main">
										<span class="list-item__title">{petition.title}</span>
										<span class="badge badge-responded">Responded</span>
									</div>
									<span class="list-item__meta">
										{petition.signature_count} signatures · Responded {formatDate(petition.responded_at || petition.created_at)}
									</span>
									{#if petition.response_body}
										<div class="petition-response">
											<strong>Assembly Response:</strong>
											<p>{petition.response_body}</p>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</section>
		{:else if activeTab === 'deliberations'}
			{#if activeDeliberations.length > 0}
				<section class="section">
					<h2 class="section__title">�️ Deliberation & Voting</h2>
					<p class="section__desc">Active discussions and open votes — your participation is needed</p>
					<div class="cards">
						{#each activeDeliberations as motion}
							<a href="/motions/{motion.uuid}" class="card card--deliberation">
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
									<span>Introduced {formatDate(motion.created_at)}</span>
									<span>{motion.comments.length} comments</span>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{:else}
				<EmptyState
					icon="📊"
					title="No questions currently in deliberation or voting"
				>
					{#if canCreateMotion}
						<Button onclick={openCreateModal}>
							+ Put a Question to the Community
						</Button>
					{/if}
				</EmptyState>
			{/if}
		{:else if activeTab === 'pending'}
			{#if pending.length > 0}
				<section class="section">
					<h2 class="section__title">📋 Pending Questions</h2>
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
				</section>
			{:else}
				<EmptyState
					icon="📋"
					title="No pending questions"
				>
					{#if canCreateMotion}
						<Button onclick={openCreateModal}>
							+ Put a Question to the Community
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
									<span class="badge {getStatusBadgeClass(motion.status)}">{getStatusLabel(motion.status)}</span>
								</div>
								<span class="list-item__meta">
									{formatDate(motion.enacted_at || motion.rejected_at || motion.created_at)}
								</span>
							</a>
						{/each}
					</div>
					<p class="archive-link"><a href="/motions?body={association.uuid}">View full archive →</a></p>
				</section>
			{:else}
				<EmptyState
					icon="✅"
					title="No decisions yet"
				/>
			{/if}
		{/if}
	</div>
</div>

<Modal bind:open={showModal} onclose={closeModal} title="Put a Question to the Community">
	<form method="POST" action="?/create" use:enhance>
		<Input
			id="title"
			name="title"
			label="Question Title"
			required
		/>
		<Textarea
			id="body"
			name="body"
			label="Motion Text"
			rows={8}
			hint="What should the community decide?"
			required
		/>
		<Textarea
			id="reasoning"
			name="reasoning"
			label="Reasoning (optional)"
			rows={4}
			hint="Why should this be considered?"
		/>
		{#if deliberationRules.length > 0}
			<Select
				id="deliberation_rule_uuid"
				name="deliberation_rule_uuid"
				label="Deliberation Period (optional)"
				hint="Minimum time for discussion before voting can begin"
			>
				<option value="">— no deliberation period —</option>
				{#each deliberationRules as rule}
					<option value={rule.uuid}>{rule.name}</option>
				{/each}
			</Select>
		{/if}
		<div style="display: flex; gap: var(--space-2); justify-content: flex-end; margin-top: var(--space-4);">
			<Button variant="secondary" onclick={closeModal}>Cancel</Button>
			<Button type="submit">Submit Question</Button>
		</div>
	</form>
</Modal>

<Modal bind:open={showPetitionModal} onclose={closePetitionModal} title="Create a Petition">
	<form method="POST" action="?/createPetition" use:enhance={() => {
		return async ({ update }) => {
			await update();
			closePetitionModal();
		};
	}}>
		<Input
			id="petition-title"
			name="title"
			label="Petition Title"
			placeholder="What do you want the assembly to consider?"
			required
		/>
		<Textarea
			id="petition-body"
			name="body"
			label="Description"
			rows={6}
			placeholder="Explain what you're asking for and why it matters..."
			required
		/>
		<div style="display: flex; gap: var(--space-2); justify-content: flex-end; margin-top: var(--space-4);">
			<Button variant="secondary" onclick={closePetitionModal}>Cancel</Button>
			<Button type="submit">Create Petition</Button>
		</div>
	</form>
</Modal>

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

	.archive-link {
		margin-top: var(--space-4);
		text-align: center;
	}

	.archive-link a {
		color: var(--color-accent);
		text-decoration: none;
		font-weight: var(--weight-medium);
	}

	.archive-link a:hover {
		text-decoration: underline;
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

	/* Petitions */
	.section__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
	}

	.petitions {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}

	.petition-card {
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		border-left: 4px solid #10b981;
	}

	.petition-card__header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.petition-card__title {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 0;
		flex: 1;
	}

	.petition-card__signatures {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-accent);
		white-space: nowrap;
	}

	.petition-card__body {
		margin: 0 0 var(--space-4) 0;
		color: var(--color-text-muted);
		line-height: 1.6;
	}

	.petition-card__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
	}

	.petition-card__date {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.responded-section {
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-border);
	}

	.subsection-title {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-4) 0;
	}

	.petition-responded {
		flex-direction: column;
		align-items: flex-start;
		padding: var(--space-4);
	}

	.petition-response {
		margin-top: var(--space-3);
		padding: var(--space-3);
		background: var(--color-accent-subtle);
		border-left: 3px solid var(--color-accent);
		border-radius: var(--radius);
		font-size: var(--text-sm);
	}

	.petition-response strong {
		display: block;
		margin-bottom: var(--space-2);
		color: var(--color-accent);
	}

	.petition-response p {
		margin: 0;
		line-height: 1.6;
	}

	.badge-responded {
		background: #d1fae5;
		color: #065f46;
	}

	/* Referendums */
	.referendum-section {
		margin-bottom: var(--space-8);
	}

	.referendum-header {
		margin-bottom: var(--space-6);
		padding: var(--space-5);
		background: linear-gradient(to right, #ede9fe, var(--color-surface));
		border-left: 4px solid #8b5cf6;
		border-radius: var(--radius-lg);
	}

	.referendum-title {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		margin: 0 0 var(--space-2) 0;
	}

	.referendum-description {
		font-size: var(--text-base);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-3) 0;
		line-height: 1.6;
	}

	.referendum-dates {
		display: flex;
		gap: var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-weight: var(--weight-medium);
	}

	.referendum-questions {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.question-card {
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.question-text {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-2) 0;
	}

	.question-description {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-4) 0;
		line-height: 1.6;
	}

	.vote-form {
		margin-top: var(--space-4);
	}

	.vote-options {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.vote-options.yes-no {
		gap: var(--space-2);
	}

	.vote-options.multiple-choice {
		flex-direction: column;
	}

	.vote-button {
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
		background: var(--color-background);
		border: 2px solid var(--color-border);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 0.2s;
		color: var(--color-text);
	}

	.vote-button:hover {
		border-color: var(--color-accent);
		background: var(--color-accent-subtle);
	}

	.vote-button.voted {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: white;
		font-weight: var(--weight-semibold);
	}

	.vote-button--abstain {
		color: var(--color-text-muted);
	}

	.vote-button--choice {
		text-align: left;
		justify-content: flex-start;
	}

	.vote-status {
		margin-top: var(--space-3);
		padding: var(--space-2) var(--space-3);
		background: #d1fae5;
		color: #065f46;
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	.ranking-notice {
		margin-top: var(--space-4);
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius);
		text-align: center;
		color: var(--color-text-muted);
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
