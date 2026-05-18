<script lang="ts">
	import type { PageData } from './$types.js';
	import { enhance } from '$app/forms';
	import { Button, EmptyState, Modal, Input, Textarea } from '@bfs/ui';

	let { data }: { data: PageData } = $props();

	const { 
		association, 
		members, 
		openPetitions,
		respondedPetitions,
		draftReferendums,
		openReferendums,
		closedReferendums,
	} = $derived(data);

	let showPetitionModal = $state(false);
	let activeTab = $state<'petitions' | 'referendums'>('petitions');

	function openPetitionModal() {
		showPetitionModal = true;
	}

	function closePetitionModal() {
		showPetitionModal = false;
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
</script>

<div class="page">
	<header class="header">
		<div class="header__top">
			<h1>Community Referenda & Petitions</h1>
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
			class:active={activeTab === 'petitions'}
			onclick={() => activeTab = 'petitions'}>
			✍️ Petitions {#if openPetitions.length > 0}<span class="badge">{openPetitions.length}</span>{/if}
		</button>
		<button 
			class="tab-nav__button" 
			class:active={activeTab === 'referendums'}
			onclick={() => activeTab = 'referendums'}>
			🗳️ Referendums {#if openReferendums.length > 0}<span class="badge">{openReferendums.length}</span>{/if}
		</button>
	</div>

	<!-- Tab Content -->
	<div class="tab-content">
		{#if activeTab === 'petitions'}
			{#if openPetitions.length > 0}
				<section class="section">
					<div class="list">
						{#each openPetitions as petition}
							<div class="list-item petition-item">
								<div class="list-item__main">
									<span class="list-item__title">{petition.title}</span>
									<span class="badge badge-warning">Open</span>
								</div>
								<p class="petition-body">{petition.body}</p>
								<div class="petition-footer">
									<span class="petition-signatures">{petition.signature_count || 0} signatures</span>
									{#if petition.user_signed}
										<form method="POST" action="?/unsignPetition" use:enhance>
											<input type="hidden" name="petition_uuid" value={petition.uuid} />
											<Button variant="secondary" size="small" type="submit">Unsign</Button>
										</form>
									{:else}
										<form method="POST" action="?/signPetition" use:enhance>
											<input type="hidden" name="petition_uuid" value={petition.uuid} />
											<Button size="small" type="submit">Sign Petition</Button>
										</form>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>
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
									<span class="badge badge-success">Responded</span>
								</div>
								<span class="list-item__meta">
									{formatDate(petition.responded_at || petition.created_at)}
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
		{:else if activeTab === 'referendums'}			{#if draftReferendums.length > 0}
				<section class="section">
					<h3 class="subsection-title">Scheduled Referendums</h3>
					<div class="list">
						{#each draftReferendums as referendum}
							<div class="list-item">
								<div class="list-item__main">
									<span class="list-item__title">{referendum.title}</span>
									<span class="badge badge-info">Scheduled</span>
								</div>
								<span class="list-item__meta">
									Opens {new Date(referendum.opens_at).toLocaleDateString()}
								</span>
								{#if referendum.description}
									<p class="referendum-description-small">{referendum.description}</p>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/if}
			{#if openReferendums.length > 0}
				{#each openReferendums as referendum}
					<section class="section referendum-section">
						<div class="referendum-header">
							<div>
								<h2 class="referendum-title">🗳️ {referendum.title}</h2>
								{#if referendum.description}
									<p class="referendum-description">{referendum.description}</p>
								{/if}
								<div class="referendum-meta">
									<span>Opens: {new Date(referendum.opens_at).toLocaleDateString()}</span>
									<span>Closes: {new Date(referendum.closes_at).toLocaleDateString()}</span>
								</div>
							</div>
						</div>

						{#if referendum.questions && referendum.questions.length > 0}
							<div class="questions">
								{#each referendum.questions as question, idx}
									<div class="question-card">
										<h3 class="question-title">
											Question {idx + 1}: {question.question_text}
										</h3>
										{#if question.description}
											<p class="question-description">{question.description}</p>
										{/if}

										{#if question.question_type === 'yes_no'}
											<form method="POST" action="?/vote" use:enhance>
												<input type="hidden" name="question_uuid" value={question.uuid} />
												<div class="vote-options">
													<label class="vote-option">
														<input 
															type="radio" 
															name="vote_value" 
															value="yes" 
															checked={question.userVote?.vote_value === '"yes"'}
														/>
														<span>Yes</span>
													</label>
													<label class="vote-option">
														<input 
															type="radio" 
															name="vote_value" 
															value="no" 
															checked={question.userVote?.vote_value === '"no"'}
														/>
														<span>No</span>
													</label>
												</div>
												<Button type="submit" size="small">
													{question.userVote ? 'Update Vote' : 'Cast Vote'}
												</Button>
											</form>
										{:else if question.question_type === 'multiple_choice'}
											<form method="POST" action="?/vote" use:enhance>
												<input type="hidden" name="question_uuid" value={question.uuid} />
												<div class="vote-options">
													{#each question.options as option}
														<label class="vote-option">
															<input 
																type="radio" 
																name="vote_value" 
																value={option.option_text}
																checked={question.userVote?.vote_value === JSON.stringify(option.option_text)}
															/>
															<span>{option.option_text}</span>
														</label>
													{/each}
												</div>
												<Button type="submit" size="small">
													{question.userVote ? 'Update Vote' : 'Cast Vote'}
												</Button>
											</form>
										{/if}

										{#if question.userVote}
											<div class="vote-confirmation">
												✓ You voted: {JSON.parse(question.userVote.vote_value)}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</section>
				{/each}
			{:else}
				<EmptyState
					icon="🗳️"
					title="No open referendums"
					description="Referendums allow the entire community to vote on important questions"
				/>
			{/if}

			{#if closedReferendums.length > 0}
				<section class="section">
					<h3 class="subsection-title">Past Referendums</h3>
					<div class="list">
						{#each closedReferendums as referendum}
							<div class="list-item">
								<div class="list-item__main">
									<span class="list-item__title">{referendum.title}</span>
									<span class="badge badge-neutral">Closed</span>
								</div>
								<span class="list-item__meta">
									Closed {formatDate(referendum.closed_at || referendum.closes_at)}
								</span>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		{/if}
	</div>
</div>

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
		max-width: 60rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
	}

	.header {
		margin-bottom: var(--space-6);
	}

	.header__top {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		margin-bottom: var(--space-2);
	}

	.header__subtitle {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.header__meta {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.tab-nav {
		display: flex;
		gap: var(--space-2);
		border-bottom: 1px solid var(--color-border);
		margin-bottom: var(--space-6);
	}

	.tab-nav__button {
		padding: var(--space-3) var(--space-4);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		font-family: var(--font-sans);
		font-size: var(--text-base);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
	}

	.tab-nav__button:hover {
		color: var(--color-text);
		background: var(--color-bg-subtle);
	}

	.tab-nav__button.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
	}

	.badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		font-size: var(--text-xs);
		font-weight: 500;
		border-radius: var(--radius-full);
		margin-left: var(--space-2);
	}

	.badge-warning {
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.badge-success {
		background: var(--color-success-bg);
		color: var(--color-success-text);
	}

	.badge-neutral {
		background: var(--color-bg-muted);
		color: var(--color-text-muted);
	}

	.badge-info {
		background: var(--color-info-bg);
		color: var(--color-info-text);
	}

	.section {
		margin-bottom: var(--space-8);
	}

	.subsection-title {
		font-size: var(--text-lg);
		font-weight: 600;
		margin-bottom: var(--space-4);
	}

	.referendum-section {
		background: var(--color-bg-subtle);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		margin-bottom: var(--space-4);
	}

	.referendum-header {
		margin-bottom: var(--space-6);
	}

	.referendum-title {
		font-size: var(--text-2xl);
		font-weight: 600;
		margin-bottom: var(--space-2);
	}

	.referendum-description {
		color: var(--color-text-muted);
		margin-bottom: var(--space-3);
	}

	.referendum-description-small {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		margin-top: var(--space-2);
	}

	.referendum-meta {
		display: flex;
		gap: var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.questions {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.question-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-4);
	}

	.question-title {
		font-size: var(--text-lg);
		font-weight: 600;
		margin-bottom: var(--space-2);
	}

	.question-description {
		color: var(--color-text-muted);
		margin-bottom: var(--space-4);
	}

	.vote-options {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.vote-option {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s;
	}

	.vote-option:hover {
		background: var(--color-bg-subtle);
		border-color: var(--color-primary);
	}

	.vote-confirmation {
		margin-top: var(--space-3);
		padding: var(--space-3);
		background: var(--color-success-bg);
		color: var(--color-success-text);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.list-item {
		padding: var(--space-4);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		transition: all 0.2s;
	}

	.list-item:hover {
		border-color: var(--color-primary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.list-item__main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-2);
	}

	.list-item__title {
		font-weight: 600;
	}

	.list-item__meta {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.petition-body {
		color: var(--color-text-muted);
		margin-bottom: var(--space-3);
	}

	.petition-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border);
	}

	.petition-signatures {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.petition-response {
		margin-top: var(--space-3);
		padding: var(--space-3);
		background: var(--color-bg-subtle);
		border-left: 3px solid var(--color-primary);
		border-radius: var(--radius-sm);
	}

	.responded-section {
		margin-top: var(--space-8);
	}
</style>
