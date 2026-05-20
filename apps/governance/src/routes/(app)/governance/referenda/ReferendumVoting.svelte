<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@bfs/ui';

	interface Question {
		uuid: string;
		question_text: string;
		description?: string | null;
		question_type: 'yes_no' | 'multiple_choice' | 'ranking';
		options?: Array<{ option_text: string }>;
		userVote?: { vote_value: string } | null;
	}

	interface Props {
		referendum: {
			title: string;
			description?: string | null;
			opens_at: string;
			closes_at: string;
			questions?: Question[];
		} | null;
	}

	let { referendum }: Props = $props();

	function parseVoteValue(vote: { vote_value: string } | null | undefined): string {
		if (!vote) return '';
		try {
			return JSON.parse(vote.vote_value);
		} catch {
			return vote.vote_value;
		}
	}
</script>

{#if referendum}
	<section class="referendum">
	<div class="referendum__header">
		<h2 class="referendum__title">{referendum.title}</h2>
		{#if referendum.description}
			<p class="referendum__description">{referendum.description}</p>
		{/if}
		<div class="referendum__meta">
			<span>Opens: {new Date(referendum.opens_at).toLocaleDateString()}</span>
			<span>Closes: {new Date(referendum.closes_at).toLocaleDateString()}</span>
		</div>
	</div>

	{#if referendum.questions && referendum.questions.length > 0}
		<div class="questions">
			{#each referendum.questions as question, idx}
				<div class="question">
					<h3 class="question__title">
						Question {idx + 1}: {question.question_text}
					</h3>
					{#if question.description}
						<p class="question__description">{question.description}</p>
					{/if}

					<form method="POST" action="?/vote" use:enhance>
						<input type="hidden" name="question_uuid" value={question.uuid} />
						
						<div class="vote-options">
							{#if question.question_type === 'yes_no'}
								<label class="vote-option">
									<input 
										type="radio" 
										name="vote_value" 
										value="yes" 
										checked={parseVoteValue(question.userVote) === 'yes'}
									/>
									<span>Yes</span>
								</label>
								<label class="vote-option">
									<input 
										type="radio" 
										name="vote_value" 
										value="no" 
										checked={parseVoteValue(question.userVote) === 'no'}
									/>
									<span>No</span>
								</label>
							{:else if question.question_type === 'multiple_choice' && question.options}
								{#each question.options as option}
									<label class="vote-option">
										<input 
											type="radio" 
											name="vote_value" 
											value={option.option_text}
											checked={parseVoteValue(question.userVote) === option.option_text}
										/>
										<span>{option.option_text}</span>
									</label>
								{/each}
							{/if}
						</div>

						<Button type="submit" size="small">
							{question.userVote ? 'Update Vote' : 'Cast Vote'}
						</Button>
					</form>

					{#if question.userVote}
						<div class="vote-confirmation">
							✓ You voted: {parseVoteValue(question.userVote)}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</section>
{/if}

<style>
	.referendum {
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		padding: var(--space-6);
		margin-bottom: var(--space-6);
	}

	.referendum__header {
		margin-bottom: var(--space-6);
	}

	.referendum__title {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: var(--text-2xl);
		font-weight: 400;
		color: #151c1a;
		margin-bottom: var(--space-3);
	}

	.referendum__description {
		font-family: 'Libre Baskerville', Georgia, serif;
		color: #5a5a50;
		line-height: 1.7;
		margin-bottom: var(--space-3);
	}

	.referendum__meta {
		display: flex;
		gap: var(--space-4);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #5a5a50;
		font-variant-numeric: oldstyle-nums;
	}

	.questions {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.question {
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		padding: var(--space-5);
	}

	.question__title {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: var(--text-lg);
		font-weight: 400;
		color: #151c1a;
		margin-bottom: var(--space-3);
	}

	.question__description {
		font-family: 'Libre Baskerville', Georgia, serif;
		color: #5a5a50;
		line-height: 1.7;
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
		gap: var(--space-3);
		padding: var(--space-3);
		border: 1px solid rgba(45, 90, 79, 0.2);
		background: var(--paper);
		cursor: pointer;
		transition: all 0.2s;
		font-family: 'Libre Baskerville', Georgia, serif;
	}

	.vote-option:hover {
		border-color: #d4a24a;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}

	.vote-confirmation {
		margin-top: var(--space-3);
		padding: var(--space-3);
		background: rgba(90, 115, 90, 0.1);
		color: #3a5a3a;
		border: 1px solid rgba(90, 115, 90, 0.3);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
	}
</style>
