<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Input, Textarea, Select, Card } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { referendum } = $derived(data);

	// Convert ISO dates to datetime-local format
	function toDatetimeLocal(isoString: string) {
		return new Date(isoString).toISOString().slice(0, 16);
	}

	let showAddQuestion = $state(false);
	let newQuestionType = $state<'yes_no' | 'multiple_choice' | 'ranking'>('yes_no');
	let newQuestionOptions = $state<string[]>(['', '']);

	function addNewQuestionOption() {
		newQuestionOptions = [...newQuestionOptions, ''];
	}

	function removeNewQuestionOption(idx: number) {
		newQuestionOptions = newQuestionOptions.filter((_, i) => i !== idx);
	}
</script>

<div class="page">
	<div class="page-header">
		<a href="/governance/referenda" class="back-link">← Back to Referenda</a>
	</div>

	<header class="header">
		<h1 class="page-title">Edit Referendum</h1>
		<p class="page-description">
			Make changes to this draft referendum. Once you're ready, schedule it to make it visible to voters.
		</p>
	</header>

	<!-- Basic Info Form -->
	<form method="POST" action="?/update" use:enhance>
		<Card>
			<div class="form-section">
				<h2 class="section-title">Basic Information</h2>
				
				<Input
					name="title"
					label="Referendum Title"
					value={referendum.title}
					required
				/>

				<Textarea
					name="description"
					label="Description (optional)"
					value={referendum.description || ''}
					rows={4}
				/>

				<div class="date-fields">
					<Input
						name="opens_at"
						label="Opens At"
						type="datetime-local"
						value={toDatetimeLocal(referendum.opens_at)}
						required
					/>

					<Input
						name="closes_at"
						label="Closes At"
						type="datetime-local"
						value={toDatetimeLocal(referendum.closes_at)}
						required
					/>
				</div>

				<div class="form-actions">
					<Button type="submit" variant="secondary">Save Changes</Button>
				</div>
			</div>
		</Card>
	</form>

	<!-- Questions Section -->
	<Card>
		<div class="form-section">
			<div class="section-header-row">
				<h2 class="section-title">Questions</h2>
				<Button variant="secondary" size="small" onclick={() => showAddQuestion = !showAddQuestion}>
					{showAddQuestion ? 'Cancel' : 'Add Question'}
				</Button>
			</div>

			{#if showAddQuestion}
				<form method="POST" action="?/addQuestion" use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							showAddQuestion = false;
							newQuestionType = 'yes_no';
							newQuestionOptions = ['', ''];
						}
					};
				}}>
					<div class="question-block add-question-block">
						<h3 class="question-header-text">New Question</h3>

						<input type="hidden" name="display_order" value={referendum.questions.length} />

						<Input
							name="question_text"
							label="Question"
							placeholder="e.g., Should the society adopt a four-day work week?"
							required
						/>

						<Select
							name="question_type"
							label="Question Type"
							bind:value={newQuestionType}
						>
							<option value="yes_no">Yes/No</option>
							<option value="multiple_choice">Multiple Choice</option>
							<option value="ranking">Ranked Choice</option>
						</Select>

						<Textarea
							name="question_description"
							label="Additional Context (optional)"
							rows={2}
						/>

						{#if newQuestionType === 'multiple_choice' || newQuestionType === 'ranking'}
							<div class="options-section">
								<div class="options-header">
									<span class="options-label">Options</span>
									<button type="button" class="add-option-button" onclick={addNewQuestionOption}>
										+ Add Option
									</button>
								</div>

								{#each newQuestionOptions as option, idx}
									<div class="option-row">
										<Input
											name="option_{idx}"
											placeholder="Option text"
											bind:value={newQuestionOptions[idx]}
											required
										/>
										{#if newQuestionOptions.length > 2}
											<button
												type="button"
												class="remove-option-button"
												onclick={() => removeNewQuestionOption(idx)}
											>
												×
											</button>
										{/if}
									</div>
								{/each}
							</div>
						{/if}

						<div class="form-actions">
							<Button type="submit">Add Question</Button>
						</div>
					</div>
				</form>
			{/if}

			{#if referendum.questions.length === 0}
				<div class="empty-state">
					<p>No questions yet. Add at least one question for voters to answer.</p>
				</div>
			{/if}

			{#each referendum.questions as question, idx}
				<div class="question-block">
					<div class="question-header">
						<span class="question-number">Question {idx + 1}</span>
						<form method="POST" action="?/deleteQuestion" use:enhance>
							<input type="hidden" name="question_uuid" value={question.uuid} />
							<button type="submit" class="remove-button">
								Remove
							</button>
						</form>
					</div>

					<form method="POST" action="?/updateQuestion" use:enhance>
						<input type="hidden" name="question_uuid" value={question.uuid} />
						
						<Input
							name="question_text"
							label="Question"
							value={question.question_text}
							required
						/>

						<div class="question-type-display">
							Type: <strong>
								{#if question.question_type === 'yes_no'}
									Yes/No
								{:else if question.question_type === 'multiple_choice'}
									Multiple Choice
								{:else}
									Ranked Choice
								{/if}
							</strong>
						</div>

						<Textarea
							name="question_description"
							label="Additional Context (optional)"
							value={question.description || ''}
							rows={2}
						/>

						<div class="form-actions">
							<Button type="submit" variant="secondary" size="small">Save Question</Button>
						</div>
					</form>

					{#if question.question_type === 'multiple_choice' || question.question_type === 'ranking'}
						<div class="options-section">
							<div class="options-header">
								<span class="options-label">Options</span>
							</div>

							{#each question.options as option}
								<div class="option-row">
									<form method="POST" action="?/updateOption" use:enhance class="option-form">
										<input type="hidden" name="option_uuid" value={option.uuid} />
										<Input
											name="option_text"
											value={option.option_text}
											required
										/>
										<Button type="submit" variant="secondary" size="small">Save</Button>
									</form>
									<form method="POST" action="?/deleteOption" use:enhance>
										<input type="hidden" name="option_uuid" value={option.uuid} />
										<button type="submit" class="remove-option-button">×</button>
									</form>
								</div>
							{/each}

							<form method="POST" action="?/addOption" use:enhance>
								<input type="hidden" name="question_uuid" value={question.uuid} />
								<input type="hidden" name="display_order" value={question.options.length} />
								<div class="add-option-row">
									<Input
										name="option_text"
										placeholder="Add new option"
										required
									/>
									<Button type="submit" variant="secondary" size="small">Add</Button>
								</div>
							</form>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</Card>

	<!-- Schedule Action -->
	<Card>
		<div class="form-section">
			<h2 class="section-title">Schedule Referendum</h2>
			<p class="schedule-description">
				Once you schedule this referendum, it will be visible to all members and will automatically 
				open on the scheduled date. You will not be able to edit it after scheduling.
			</p>
			<form method="POST" action="?/schedule" use:enhance>
				<div class="form-actions">
					<Button type="submit" variant="primary">Schedule Referendum</Button>
				</div>
			</form>
		</div>
	</Card>

	<!-- Delete Action -->
	<Card>
		<div class="form-section">
			<h2 class="section-title" style="color: #c53030;">Delete Draft</h2>
			<p class="schedule-description">
				Permanently delete this draft referendum. This cannot be undone.
			</p>
			<form 
				method="POST" 
				action="?/delete" 
				use:enhance
				onsubmit={(e) => {
					if (!confirm('Are you sure you want to delete this draft referendum? This cannot be undone.')) {
						e.preventDefault();
					}
				}}
			>
				<div class="form-actions">
					<Button type="submit" variant="secondary" style="color: #c53030; border-color: #c53030;">Delete Referendum</Button>
				</div>
			</form>
		</div>
	</Card>
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

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
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

	.add-question-block {
		background: var(--tint-gold);
		border-color: var(--gold);
	}

	.question-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: var(--space-3);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.question-header-text {
		font-family: var(--font-label);
		font-size: var(--text-base);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--gold);
		font-weight: 600;
		margin: 0;
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

	.question-type-display {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
		padding: var(--space-2) var(--space-3);
		background: white;
		border: 1px solid rgba(45, 90, 79, 0.15);
		border-radius: var(--radius);
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

	.option-form {
		flex: 1;
		display: flex;
		gap: var(--space-2);
		align-items: flex-start;
	}

	.add-option-row {
		display: flex;
		gap: var(--space-2);
		align-items: flex-start;
		padding-top: var(--space-3);
		border-top: 1px solid rgba(45, 90, 79, 0.15);
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

	.schedule-description {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--ink-mid);
		line-height: 1.6;
		margin: 0;
	}
</style>
