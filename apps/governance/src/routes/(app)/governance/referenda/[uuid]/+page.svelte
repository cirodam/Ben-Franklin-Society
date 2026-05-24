<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge, Button, Card } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { referendum, actingAs, userVotes, results, commentCounts } = $derived(data);

	// Track local ranking selections
	let rankingSelections: Record<string, string[]> = $state({});

	function formatDate(isoString: string) {
		return new Date(isoString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}

	function formatDateTime(isoString: string) {
		return new Date(isoString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	}

	function calculatePercentage(count: number, total: number): string {
		if (total === 0) return '0';
		return ((count / total) * 100).toFixed(1);
	}
</script>

<div class="page">
	<div class="page-header">
		<a href="/governance/referenda" class="back-link">← Back to Referenda</a>
	</div>

	<header class="header">
		<div class="header-top">
			<h1 class="page-title">{referendum.title}</h1>
			{#if referendum.status === 'scheduled'}
				<Badge label="Scheduled" variant="accent" />
			{:else if referendum.status === 'open'}
				<Badge label="Open" variant="success" />
			{:else if referendum.status === 'closed'}
				<Badge label="Closed" variant="neutral" />
			{/if}
		</div>
		
		{#if referendum.description}
			<p class="page-description">{referendum.description}</p>
		{/if}

		<div class="metadata">
			{#if referendum.status === 'scheduled'}
				<span>Opens {formatDateTime(referendum.opens_at)}</span>
			{:else if referendum.status === 'open'}
				<span>Closes {formatDateTime(referendum.closes_at)}</span>
			{:else if referendum.status === 'closed'}
				<span>Closed {formatDate(referendum.closed_at || referendum.closes_at)}</span>
			{/if}
		</div>
	</header>

	{#if referendum.status === 'scheduled'}
		<!-- Preview mode - just show the questions -->
		<div class="preview-notice">
			<Card>
				<p>This referendum is scheduled to open on {formatDateTime(referendum.opens_at)}. Below is a preview of the questions that will be asked.</p>
			</Card>
		</div>

		{#each referendum.questions as question, idx}
			<Card>
				<div class="question-preview">
					<div class="question-header">
						<h3 class="question-title">Question {idx + 1}</h3>
						{#if question.thread_uuid}
							<a href="/governance/discussions/{question.thread_uuid}" class="discussion-link">
								💬 {commentCounts[question.uuid] || 0} {commentCounts[question.uuid] === 1 ? 'comment' : 'comments'}
							</a>
						{/if}
					</div>
					<p class="question-text">{question.question_text}</p>
					{#if question.description}
						<p class="question-description">{question.description}</p>
					{/if}

					{#if question.question_type === 'yes_no'}
						<div class="question-type-hint">
							<Badge label="Yes/No Question" variant="neutral" />
						</div>
					{:else if question.question_type === 'multiple_choice'}
						<div class="question-type-hint">
							<Badge label="Multiple Choice" variant="neutral" />
						</div>
						<ul class="options-preview">
							{#each question.options as option}
								<li>{option.option_text}</li>
							{/each}
						</ul>
					{:else if question.question_type === 'ranking'}
						<div class="question-type-hint">
							<Badge label="Ranked Choice" variant="neutral" />
						</div>
						<ul class="options-preview">
							{#each question.options as option}
								<li>{option.option_text}</li>
							{/each}
						</ul>
					{/if}
				</div>
			</Card>
		{/each}
	{:else if referendum.status === 'open'}
		<!-- Voting mode -->
		{#if !actingAs}
			<Card>
				<p class="info-message">You must be logged in to vote.</p>
			</Card>
		{:else}
			{#each referendum.questions as question, idx}
				<Card>
					<div class="question-voting">
						<div class="question-header">
							<h3 class="question-title">Question {idx + 1}</h3>
							{#if question.thread_uuid}
								<a href="/governance/discussions/{question.thread_uuid}" class="discussion-link">
									💬 {commentCounts[question.uuid] || 0} {commentCounts[question.uuid] === 1 ? 'comment' : 'comments'}
								</a>
							{/if}
						</div>
						<p class="question-text">{question.question_text}</p>
						{#if question.description}
							<p class="question-description">{question.description}</p>
						{/if}

						{#if userVotes[question.uuid]}
							<div class="vote-confirmation">
								<Badge label="Vote Recorded" variant="success" />
								<p>You have already voted on this question. You can change your vote below.</p>
							</div>
						{/if}

						{#if question.question_type === 'yes_no'}
							<form method="POST" action="?/vote" use:enhance class="vote-form">
								<input type="hidden" name="question_uuid" value={question.uuid} />
								<div class="vote-buttons">
									<Button
										type="submit"
										name="vote_value"
										value="yes"
										variant={userVotes[question.uuid] === 'yes' ? 'primary' : 'outline'}
									>
										Yes
									</Button>
									<Button
										type="submit"
										name="vote_value"
										value="no"
										variant={userVotes[question.uuid] === 'no' ? 'primary' : 'outline'}
									>
										No
									</Button>
									<Button
										type="submit"
										name="vote_value"
										value="abstain"
										variant={userVotes[question.uuid] === 'abstain' ? 'primary' : 'outline'}
									>
										Abstain
									</Button>
								</div>
							</form>
						{:else if question.question_type === 'multiple_choice'}
							<form method="POST" action="?/vote" use:enhance class="vote-form">
								<input type="hidden" name="question_uuid" value={question.uuid} />
								<div class="vote-options">
									{#each question.options as option}
										<label class="vote-option">
											<input
												type="radio"
												name="vote_value"
												value={option.uuid}
												checked={userVotes[question.uuid] === option.uuid}
											/>
											<span>{option.option_text}</span>
										</label>
									{/each}
								</div>
								<Button type="submit">Submit Vote</Button>
							</form>
						{:else if question.question_type === 'ranking'}
							<form method="POST" action="?/vote" use:enhance class="vote-form">
								<input type="hidden" name="question_uuid" value={question.uuid} />
								<div class="ranking-info">
									<p class="info-message">Select your preferences in order (1st choice, 2nd choice, etc.)</p>
								</div>
								<div class="vote-options">
									{#each question.options as option, optionIdx}
										<label class="vote-option ranking-option">
											<select name="rank_{option.uuid}" class="rank-select">
												<option value="">Not ranked</option>
												{#each question.options as _, rankIdx}
													<option value={rankIdx + 1}>{rankIdx + 1}</option>
												{/each}
											</select>
											<span>{option.option_text}</span>
										</label>
									{/each}
								</div>
								<Button type="submit">Submit Vote</Button>
							</form>
						{/if}
					</div>
				</Card>
			{/each}
		{/if}
	{:else if referendum.status === 'closed'}
		<!-- Results mode -->
		{#if results}
			{#each results as result, idx}
				{@const question = referendum.questions.find(q => q.uuid === result.question_uuid)}
				{#if question}
					<Card>
						<div class="question-results">
							<div class="question-header">
								<h3 class="question-title">Question {idx + 1}</h3>
								{#if question.thread_uuid}
									<a href="/governance/discussions/{question.thread_uuid}" class="discussion-link">
										💬 {commentCounts[question.uuid] || 0} {commentCounts[question.uuid] === 1 ? 'comment' : 'comments'}
									</a>
								{/if}
							</div>
							<p class="question-text">{result.question_text}</p>
							{#if question.description}
								<p class="question-description">{question.description}</p>
							{/if}

							<div class="results-summary">
								<span class="total-votes">{result.total_votes} total votes</span>
							</div>

							{#if result.question_type === 'yes_no'}
								<div class="results-breakdown">
									<div class="result-item">
										<div class="result-bar-container">
											<div
												class="result-bar result-bar-yes"
												style="width: {calculatePercentage(result.results.yes, result.total_votes)}%"
											></div>
										</div>
										<div class="result-label">
											<span class="result-option">Yes</span>
											<span class="result-count">{result.results.yes} ({calculatePercentage(result.results.yes, result.total_votes)}%)</span>
										</div>
									</div>
									<div class="result-item">
										<div class="result-bar-container">
											<div
												class="result-bar result-bar-no"
												style="width: {calculatePercentage(result.results.no, result.total_votes)}%"
											></div>
										</div>
										<div class="result-label">
											<span class="result-option">No</span>
											<span class="result-count">{result.results.no} ({calculatePercentage(result.results.no, result.total_votes)}%)</span>
										</div>
									</div>
									<div class="result-item">
										<div class="result-bar-container">
											<div
												class="result-bar result-bar-abstain"
												style="width: {calculatePercentage(result.results.abstain, result.total_votes)}%"
											></div>
										</div>
										<div class="result-label">
											<span class="result-option">Abstain</span>
											<span class="result-count">{result.results.abstain} ({calculatePercentage(result.results.abstain, result.total_votes)}%)</span>
										</div>
									</div>
								</div>
							{:else if result.question_type === 'multiple_choice'}
								<div class="results-breakdown">
									{#each question.options as option}
										{@const count = result.results[option.uuid] || 0}
										<div class="result-item">
											<div class="result-bar-container">
												<div
													class="result-bar result-bar-option"
													style="width: {calculatePercentage(count, result.total_votes)}%"
												></div>
											</div>
											<div class="result-label">
												<span class="result-option">{option.option_text}</span>
												<span class="result-count">{count} ({calculatePercentage(count, result.total_votes)}%)</span>
											</div>
										</div>
									{/each}
								</div>
							{:else if result.question_type === 'ranking'}
								<div class="results-breakdown">
									<p class="ranking-note">Individual rankings:</p>
									{#if Array.isArray(result.results) && result.results.length > 0}
										<ul class="ranking-list">
											{#each result.results as vote}
												<li>{vote}</li>
											{/each}
										</ul>
									{:else}
										<p class="no-votes">No votes recorded</p>
									{/if}
								</div>
							{/if}
						</div>
					</Card>
				{/if}
			{/each}
		{:else}
			<Card>
				<p class="info-message">No results available.</p>
			</Card>
		{/if}
	{/if}
</div>

<style>
	.page {
		max-width: 60rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
	}

	.page-header {
		margin-bottom: var(--space-4);
	}

	.back-link {
		font-family: var(--font-label);
		font-size: var(--text-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink-mid);
		text-decoration: none;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: var(--gold);
	}

	.header {
		margin-bottom: var(--space-8);
	}

	.header-top {
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
		margin-bottom: var(--space-3);
	}

	.page-title {
		flex: 1;
		font-family: var(--font-prose);
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 600;
		color: var(--ink);
		margin: 0;
		line-height: 1.3;
	}

	.page-description {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--ink-mid);
		margin: 0 0 var(--space-3);
		line-height: 1.6;
	}

	.metadata {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
		font-variant-numeric: oldstyle-nums;
	}

	.preview-notice {
		margin-bottom: var(--space-6);
	}

	.preview-notice p {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--ink-mid);
		line-height: 1.6;
		margin: 0;
		font-style: italic;
	}

	.question-preview {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.question-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.question-title {
		font-family: var(--font-label);
		font-size: var(--text-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--gold);
		font-weight: 600;
		margin: 0;
	}

	.discussion-link {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
		text-decoration: none;
		transition: color 0.2s;
		white-space: nowrap;
	}

	.discussion-link:hover {
		color: var(--gold);
	}

	.question-text {
		font-family: var(--font-prose);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--ink);
		margin: 0;
		line-height: 1.4;
	}

	.question-description {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--ink-mid);
		margin: 0;
		line-height: 1.6;
		font-style: italic;
	}

	.question-type-hint {
		margin-top: var(--space-2);
	}

	.options-preview {
		list-style: none;
		padding: 0;
		margin: var(--space-3) 0 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.options-preview li {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--ink);
		padding: var(--space-3);
		background: var(--tint-green);
		border: 1px solid rgba(45, 90, 79, 0.15);
		border-radius: var(--radius);
	}

	/* Voting styles */
	.question-voting,
	.question-results {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.info-message {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--ink-mid);
		margin: 0;
		line-height: 1.6;
	}

	.vote-confirmation {
		padding: var(--space-3);
		background: var(--tint-green);
		border: 1px solid rgba(45, 90, 79, 0.2);
		border-radius: var(--radius);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.vote-confirmation p {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
		margin: 0;
	}

	.vote-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.vote-buttons {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.vote-options {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.vote-option {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--paper);
		border: 2px solid var(--stroke);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 0.2s;
	}

	.vote-option:hover {
		border-color: var(--gold);
		background: var(--tint-gold);
	}

	.vote-option input[type='radio'] {
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
	}

	.vote-option span {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--ink);
		flex: 1;
	}

	.ranking-option {
		align-items: flex-start;
	}

	.rank-select {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		padding: var(--space-2);
		border: 1px solid var(--stroke);
		border-radius: var(--radius);
		background: var(--paper);
		color: var(--ink);
		cursor: pointer;
		min-width: 7rem;
	}

	.ranking-info {
		padding: var(--space-3);
		background: var(--tint-blue);
		border: 1px solid rgba(45, 79, 90, 0.2);
		border-radius: var(--radius);
	}

	/* Results styles */
	.results-summary {
		padding: var(--space-3);
		background: var(--tint-gold);
		border: 1px solid rgba(178, 143, 86, 0.3);
		border-radius: var(--radius);
	}

	.total-votes {
		font-family: var(--font-label);
		font-size: var(--text-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink);
	}

	.results-breakdown {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.result-item {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.result-bar-container {
		width: 100%;
		height: 2rem;
		background: var(--paper);
		border: 1px solid var(--stroke);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.result-bar {
		height: 100%;
		transition: width 0.5s ease;
		min-width: 2px;
	}

	.result-bar-yes {
		background: linear-gradient(90deg, #2d5a4f 0%, #3a7361 100%);
	}

	.result-bar-no {
		background: linear-gradient(90deg, #8b4545 0%, #a85252 100%);
	}

	.result-bar-abstain {
		background: linear-gradient(90deg, #6b6b6b 0%, #858585 100%);
	}

	.result-bar-option {
		background: linear-gradient(90deg, var(--gold) 0%, #c5a875 100%);
	}

	.result-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 var(--space-2);
	}

	.result-option {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--ink);
	}

	.result-count {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--ink-mid);
		font-variant-numeric: tabular-nums;
	}

	.ranking-note {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--ink);
		margin: 0 0 var(--space-2);
	}

	.ranking-list {
		list-style: decimal;
		padding-left: var(--space-6);
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.ranking-list li {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--ink-mid);
		line-height: 1.6;
	}

	.no-votes {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--ink-mid);
		font-style: italic;
		margin: 0;
	}
</style>
