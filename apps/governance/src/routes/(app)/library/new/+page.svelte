<script lang="ts">
	import { enhance } from '$app/forms';
	import { Input, Textarea, Button } from '@bfs/ui';
	import { PLATFORM_NAME } from '@bfs/types';
	import type { Article, Section } from '@bfs/types';

	let title = $state('');
	let seniority = $state<'charter' | 'constitution' | 'bylaw' | 'ordinance' | 'regulation' | 'policy'>('bylaw');
	let preamble = $state('');
	let articles = $state<Article[]>([
		{
			number: 'I',
			title: '',
			sections: []
		}
	]);

	let isSubmitting = $state(false);

	function addArticle() {
		const nextNumber = toRomanNumeral(articles.length + 1);
		articles = [...articles, {
			number: nextNumber,
			title: '',
			sections: []
		}];
	}

	function removeArticle(index: number) {
		articles = articles.filter((_, i) => i !== index);
		// Renumber articles
		articles = articles.map((article, i) => ({
			...article,
			number: toRomanNumeral(i + 1)
		}));
	}

	function addSection(articleIndex: number) {
		articles[articleIndex].sections = [...articles[articleIndex].sections, {
			title: '',
			body: ''
		}];
	}

	function removeSection(articleIndex: number, sectionIndex: number) {
		articles[articleIndex].sections = articles[articleIndex].sections.filter((_, i) => i !== sectionIndex);
	}

	function toRomanNumeral(num: number): string {
		const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
			'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
		return romanNumerals[num - 1] || String(num);
	}
</script>

<div class="page">
	<header class="header">
		<h1 class="page-title">Create Governing Document</h1>
		<p class="subtitle">Draft a new governing document for the society</p>
	</header>

	<form 
		method="POST" 
		class="editor"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
			};
		}}
	>
		<!-- Hidden field for articles JSON -->
		<input type="hidden" name="articles" value={JSON.stringify(articles)} />

		<div class="form-section">
			<h2 class="section-title">Document Information</h2>
			
			<Input
				name="title"
				label="Title"
				bind:value={title}
				placeholder="e.g., Constitution of {PLATFORM_NAME}"
				required
			/>

			<div class="field-group">
				<label class="field-label" for="seniority">Seniority Level</label>
				<select 
					id="seniority"
					name="seniority" 
					bind:value={seniority}
					class="select-input"
				>
					<option value="charter">Charter</option>
					<option value="constitution">Constitution</option>
					<option value="bylaw">Bylaw</option>
					<option value="ordinance">Ordinance</option>
					<option value="regulation">Regulation</option>
					<option value="policy">Policy</option>
				</select>
				<p class="field-hint">Higher seniority documents take precedence over lower ones</p>
			</div>

			<Textarea
				name="preamble"
				label="Preamble (optional)"
				bind:value={preamble}
				placeholder="We the members..."
				rows={4}
			/>
		</div>

		<div class="form-section">
			<div class="section-header">
				<h2 class="section-title">Articles</h2>
				<button type="button" class="btn-secondary" onclick={addArticle}>
					Add Article
				</button>
			</div>

			{#each articles as article, articleIndex}
				<div class="article-card">
					<div class="article-header">
						<h3 class="article-number">Article {article.number}</h3>
						{#if articles.length > 1}
							<button 
								type="button" 
								class="btn-icon" 
								onclick={() => removeArticle(articleIndex)}
								title="Remove article"
							>
								×
							</button>
						{/if}
					</div>

					<Input
						label="Article Title"
						bind:value={article.title}
						placeholder="e.g., Membership"
						required
					/>

					<div class="sections">
						<div class="sections-header">
							<h4 class="sections-title">Sections</h4>
							<button 
								type="button" 
								class="btn-text" 
								onclick={() => addSection(articleIndex)}
							>
								+ Add Section
							</button>
						</div>

						{#if article.sections.length === 0}
							<p class="empty-hint">No sections yet. Add your first section.</p>
						{:else}
							{#each article.sections as section, sectionIndex}
								<div class="section-card">
									<div class="section-header">
										<span class="section-label">Section {sectionIndex + 1}</span>
										<button 
											type="button" 
											class="btn-icon-small" 
											onclick={() => removeSection(articleIndex, sectionIndex)}
											title="Remove section"
										>
											×
										</button>
									</div>

									<Input
										label="Section Title"
										bind:value={section.title}
										placeholder="e.g., Eligibility"
										required
									/>

									<Textarea
										label="Section Text"
										bind:value={section.body}
										placeholder="The text of this section..."
										rows={4}
										required
									/>

									<Textarea
										label="Rationale (optional)"
										bind:value={section.rationale}
										placeholder="Why this section is necessary..."
										rows={2}
									/>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<div class="form-actions">
			<a href="/library" class="btn-secondary">Cancel</a>
			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Creating...' : 'Create Document'}
			</Button>
		</div>
	</form>
</div>

<style>
	.page {
		max-width: 900px;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
	}

	.header {
		text-align: center;
		margin-bottom: var(--space-8);
	}

	.page-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 400;
		color: var(--ink);
		margin: 0 0 var(--space-2) 0;
	}

	.subtitle {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: var(--ink-mid);
		margin: 0;
		font-style: italic;
	}

	.editor {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-6);
		background: var(--paper);
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-title {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xl);
		letter-spacing: 0.08em;
		color: var(--ink);
		margin: 0;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.field-label {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.08em;
		color: var(--ink);
		text-transform: uppercase;
	}

	.select-input {
		padding: var(--space-2) var(--space-3);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: var(--ink);
		background: white;
		border: 2px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
	}

	.select-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.field-hint {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-faint);
		margin: 0;
		font-style: italic;
	}

	.article-card {
		padding: var(--space-5);
		background: var(--tint-green-light);
		border: 2px solid var(--border);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.article-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.article-number {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-lg);
		letter-spacing: 0.08em;
		color: var(--ink);
		margin: 0;
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.sections-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.sections-title {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		letter-spacing: 0.08em;
		color: var(--ink-mid);
		margin: 0;
	}

	.section-card {
		padding: var(--space-4);
		background: white;
		border: 1px solid var(--border);
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-label {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.08em;
		color: var(--accent);
		text-transform: uppercase;
	}

	.empty-hint {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-faint);
		font-style: italic;
		text-align: center;
		padding: var(--space-4);
	}

	.btn-secondary,
	.btn-text,
	.btn-icon,
	.btn-icon-small {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.08em;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		background: none;
	}

	.btn-secondary {
		padding: var(--space-2) var(--space-4);
		border: 2px solid var(--border);
		border-radius: 4px;
		color: var(--ink-mid);
		background: white;
		text-decoration: none;
		display: inline-block;
	}

	.btn-secondary:hover {
		background: var(--tint-green-light);
		border-color: var(--ink-mid);
	}

	.btn-text {
		color: var(--accent);
		padding: 0;
	}

	.btn-text:hover {
		color: var(--accent-hover);
		text-decoration: underline;
	}

	.btn-icon {
		font-size: 2rem;
		line-height: 1;
		color: var(--ink-faint);
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-icon:hover {
		color: var(--rust);
	}

	.btn-icon-small {
		font-size: 1.5rem;
		line-height: 1;
		color: var(--ink-faint);
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-icon-small:hover {
		color: var(--rust);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-4);
	}
</style>
