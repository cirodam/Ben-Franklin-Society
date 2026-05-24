<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Input, Textarea, Select, Card } from '@bfs/ui';

	type QuestionType = 'yes_no' | 'multiple_choice' | 'ranking';

	interface Question {
		id: number;
		text: string;
		type: QuestionType;
		description: string;
		options: Array<{ id: number; text: string }>;
	}

	let questions = $state<Question[]>([]);
	let nextQuestionId = $state(0);
	let nextOptionIds = $state<Record<number, number>>({});

	function addQuestion() {
		const id = nextQuestionId++;
		questions.push({
			id,
			text: '',
			type: 'yes_no',
			description: '',
			options: [],
		});
		questions = questions;
		nextOptionIds[id] = 0;
	}

	function removeQuestion(id: number) {
		questions = questions.filter((q) => q.id !== id);
		delete nextOptionIds[id];
	}

	function addOption(questionId: number) {
		const question = questions.find((q) => q.id === questionId);
		if (!question) return;

		const optionId = nextOptionIds[questionId] || 0;
		question.options.push({ id: optionId, text: '' });
		nextOptionIds[questionId] = optionId + 1;
		questions = questions;
	}

	function removeOption(questionId: number, optionId: number) {
		const question = questions.find((q) => q.id === questionId);
		if (!question) return;

		question.options = question.options.filter((o) => o.id !== optionId);
		questions = questions;
	}

	function handleQuestionTypeChange(questionId: number, newType: QuestionType) {
		const question = questions.find((q) => q.id === questionId);
		if (!question) return;

		question.type = newType;
		
		// If changing to yes/no, clear options
		if (newType === 'yes_no') {
			question.options = [];
		}
		// If changing to multiple_choice or ranking, ensure at least 2 options
		else if (question.options.length === 0) {
			nextOptionIds[questionId] = 2;
			question.options = [
				{ id: 0, text: '' },
				{ id: 1, text: '' },
			];
		}

		questions = questions;
	}
</script>

<div class="page">
	<div class="page-header">
		<a href="/governance/referenda" class="back-link">← Back to Referenda</a>
	</div>

	<header class="header">
		<h1 class="page-title">Create Referendum</h1>
		<p class="page-description">
			Create a new referendum to submit questions to the entire community for a vote.
		</p>
	</header>

	<form method="POST" action="?/create" use:enhance>
		<Card>
			<div class="form-section">
				<h2 class="section-title">Basic Information</h2>
				
				<Input
					name="title"
					label="Referendum Title"
					placeholder="e.g., November 2026 General Referendum"
					required
				/>

				<Textarea
					name="description"
					label="Description (optional)"
					hint="Provide context about this referendum"
					rows={4}
				/>

				<div class="date-fields">
					<Input
						name="opens_at"
						label="Opens At"
						type="datetime-local"
						hint="When voting begins"
						required
					/>

					<Input
						name="closes_at"
						label="Closes At"
						type="datetime-local"
						hint="When voting ends"
						required
					/>
				</div>
			</div>
		</Card>

		<Card>
			<div class="form-section">
				<div class="section-header-row">
					<h2 class="section-title">Questions</h2>
					<Button variant="secondary" size="small" onclick={addQuestion}>Add Question</Button>
				</div>

				{#if questions.length === 0}
					<div class="empty-state">
						<p>No questions yet. Add at least one question for voters to answer.</p>
					</div>
				{/if}

				{#each questions as question, idx (question.id)}
					<div class="question-block">
						<div class="question-header">
							<span class="question-number">Question {idx + 1}</span>
							<button
								type="button"
								class="remove-button"
								onclick={() => removeQuestion(question.id)}
							>
								Remove
							</button>
						</div>

						<Input
							name="question_text_{question.id}"
							label="Question"
							bind:value={question.text}
							placeholder="e.g., Should the society adopt a four-day work week?"
							required
						/>

						<Select
							name="question_type_{question.id}"
							label="Question Type"
							value={question.type}
							onchange={(e) => handleQuestionTypeChange(question.id, e.currentTarget.value as QuestionType)}
						>
							<option value="yes_no">Yes/No</option>
							<option value="multiple_choice">Multiple Choice</option>
							<option value="ranking">Ranked Choice</option>
						</Select>

						<Textarea
							name="question_description_{question.id}"
							label="Additional Context (optional)"
							bind:value={question.description}
							rows={2}
						/>

						{#if question.type === 'multiple_choice' || question.type === 'ranking'}
							<div class="options-section">
								<div class="options-header">
									<span class="options-label">Options</span>
									<button
										type="button"
										class="add-option-button"
										onclick={() => addOption(question.id)}
									>
										+ Add Option
									</button>
								</div>

								{#each question.options as option (option.id)}
									<div class="option-row">
										<Input
											name="question_{question.id}_option_{option.id}"
											placeholder="Option text"
											bind:value={option.text}
											required
										/>
										<button
											type="button"
											class="remove-option-button"
											onclick={() => removeOption(question.id, option.id)}
										>
											×
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</Card>

		<div class="form-actions">
			<Button variant="secondary" onclick={() => window.history.back()}>Cancel</Button>
			<Button type="submit">Create Referendum</Button>
		</div>
	</form>
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

	.page-title {
		font-family: var(--font-prose);
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 600;
		color: var(--ink);
		margin: 0 0 var(--space-3);
		line-height: 1.3;
	}

	.page-description {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--ink-mid);
		margin: 0;
		line-height: 1.6;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.section-title {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: 400;
		color: var(--ink);
		margin: 0;
	}

	.section-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.date-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	.empty-state {
		padding: var(--space-8) var(--space-4);
		text-align: center;
		background: var(--tint-green);
		border: 1px dashed rgba(45, 90, 79, 0.3);
		border-radius: var(--radius);
	}

	.empty-state p {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
		margin: 0;
		font-style: italic;
	}

	.question-block {
		padding: var(--space-5);
		background: var(--tint-green);
		border: 1px solid rgba(45, 90, 79, 0.15);
		border-radius: var(--radius);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.question-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: var(--space-3);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.question-number {
		font-family: var(--font-label);
		font-size: var(--text-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--gold);
		font-weight: 600;
	}

	.remove-button {
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-label);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink-mid);
		background: transparent;
		border: 1px solid rgba(45, 90, 79, 0.2);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 0.2s;
	}

	.remove-button:hover {
		color: #c53030;
		border-color: #c53030;
		background: rgba(197, 48, 48, 0.05);
	}

	.options-section {
		padding: var(--space-4);
		background: white;
		border: 1px solid rgba(45, 90, 79, 0.15);
		border-radius: var(--radius);
	}

	.options-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-3);
	}

	.options-label {
		font-family: var(--font-label);
		font-size: var(--text-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink);
		font-weight: 600;
	}

	.add-option-button {
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-label);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--gold);
		background: transparent;
		border: 1px solid var(--gold);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 0.2s;
	}

	.add-option-button:hover {
		background: var(--tint-gold);
	}

	.option-row {
		display: flex;
		gap: var(--space-2);
		align-items: flex-start;
		margin-bottom: var(--space-2);
	}

	.option-row:last-child {
		margin-bottom: 0;
	}

	.remove-option-button {
		flex-shrink: 0;
		width: 2.5rem;
		height: 2.5rem;
		margin-top: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--text-xl);
		color: var(--ink-mid);
		background: transparent;
		border: 1px solid rgba(45, 90, 79, 0.2);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 0.2s;
	}

	.remove-option-button:hover {
		color: #c53030;
		border-color: #c53030;
		background: rgba(197, 48, 48, 0.05);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-4);
	}
</style>
