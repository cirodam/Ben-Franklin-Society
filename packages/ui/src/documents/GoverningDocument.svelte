<script lang="ts">
	import type { GoverningDocument, Article, Section } from '@bfs/types';
	import Document from './Document.svelte';

	let {
		doc,
		mode = 'view',
		onChange,
		readonly = false
	}: {
		doc: GoverningDocument;
		mode?: 'view' | 'edit';
		onChange?: (updates: Partial<GoverningDocument>) => void;
		readonly?: boolean;
	} = $props();

	// Local editable state
	let title = $state(doc.title);
	let preamble = $state(doc.content.preamble || '');
	let articles = $state<Article[]>(structuredClone($state.snapshot(doc.content.articles)));

	// Copy link state (view mode only)
	let copiedId = $state<string | null>(null);

	function copyLink(articleNumber: string, sectionIdx: number) {
		if (typeof window !== 'undefined') {
			const sectionId = `article-${articleNumber}-section-${sectionIdx}`;
			const url = `${window.location.origin}${window.location.pathname}#${sectionId}`;
			navigator.clipboard.writeText(url).then(() => {
				copiedId = sectionId;
				setTimeout(() => copiedId = null, 2000);
			});
		}
	}

	// Edit mode functions
	function handleTitleChange(e: Event) {
		title = (e.target as HTMLInputElement).value;
		emitChange();
	}

	function handlePreambleChange(e: Event) {
		preamble = (e.target as HTMLTextAreaElement).value;
		emitChange();
	}

	function addArticle() {
		const nextNumber = toRomanNumeral(articles.length + 1);
		articles = [...articles, { number: nextNumber, title: '', sections: [] }];
		emitChange();
	}

	function removeArticle(index: number) {
		articles = articles.filter((_, i) => i !== index);
		// Renumber remaining articles
		articles = articles.map((article, i) => ({
			...article,
			number: toRomanNumeral(i + 1)
		}));
		emitChange();
	}

	function updateArticle(index: number, field: 'number' | 'title', value: string) {
		articles = articles.map((a, i) => 
			i === index ? { ...a, [field]: value } : a
		);
		emitChange();
	}

	function addSection(articleIndex: number) {
		articles = articles.map((article, i) => 
			i === articleIndex 
				? { ...article, sections: [...article.sections, { title: '', body: '', rationale: '' }] }
				: article
		);
		emitChange();
	}

	function removeSection(articleIndex: number, sectionIndex: number) {
		articles = articles.map((article, i) => 
			i === articleIndex 
				? { ...article, sections: article.sections.filter((_, si) => si !== sectionIndex) }
				: article
		);
		emitChange();
	}

	function updateSection(articleIndex: number, sectionIndex: number, field: keyof Section, value: string) {
		articles = articles.map((article, i) => 
			i === articleIndex 
				? {
					...article,
					sections: article.sections.map((section, si) => 
						si === sectionIndex ? { ...section, [field]: value } : section
					)
				}
				: article
		);
		emitChange();
	}

	function emitChange() {
		if (onChange) {
			onChange({
				title,
				content: {
					...doc.content,
					preamble: preamble || undefined,
					articles
				}
			});
		}
	}

	function toRomanNumeral(num: number): string {
		const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
			'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
		return romanNumerals[num - 1] || String(num);
	}

	const isEditMode = $derived(mode === 'edit' && !readonly);
</script>

<Document 
	documentId={doc.document_id || `#${doc.uuid.slice(0, 8)}`}
	title={isEditMode ? '' : title}
>
	{#snippet header()}
		<div class="document-title-block" class:document-title-block--charter={doc.content.seniority === 'charter'}>
			{#if isEditMode}
				<input
					type="text"
					value={title}
					oninput={handleTitleChange}
					class="title-input"
					class:title-input--charter={doc.content.seniority === 'charter'}
					placeholder="Document title"
				/>
			{/if}

			{#if doc.content.preamble || isEditMode}
				<div class="preamble-section">
					{#if isEditMode}
						<textarea
							value={preamble}
							oninput={handlePreambleChange}
							class="preamble-input"
							placeholder="Preamble (optional)"
							rows="4"
						></textarea>
					{:else if doc.content.preamble && doc.content.seniority === 'charter'}
						<div class="preamble">{doc.content.preamble}</div>
					{/if}
				</div>
			{/if}
		</div>
	{/snippet}

	<div class="articles-container">
		{#each articles as article, articleIdx}
			<div class="article">
				<div class="article-heading-container">
					{#if isEditMode}
						<div class="article-edit-header">
							<input
								type="text"
								value={article.number}
								oninput={(e) => updateArticle(articleIdx, 'number', (e.target as HTMLInputElement).value)}
								class="article-number-input"
								placeholder="I"
							/>
							<input
								type="text"
								value={article.title}
								oninput={(e) => updateArticle(articleIdx, 'title', (e.target as HTMLInputElement).value)}
								class="article-title-input"
								placeholder="Article title"
							/>
							<button
								type="button"
								class="btn-delete-article"
								onclick={() => removeArticle(articleIdx)}
								title="Delete article"
							>
								×
							</button>
						</div>
					{:else}
						<h2 class="article-heading">
							<span class="article-number">Article {article.number}</span>
							<span class="article-title">{article.title}</span>
						</h2>
					{/if}
				</div>

				{#each article.sections as section, sectionIdx}
					<div
						class="section"
						class:section--edit={isEditMode}
						id="article-{article.number}-section-{sectionIdx}"
					>
						{#if isEditMode}
							<div class="section-edit">
								<div class="section-edit-header">
									<input
										type="text"
										value={section.title}
										oninput={(e) => updateSection(articleIdx, sectionIdx, 'title', (e.target as HTMLInputElement).value)}
										class="section-title-input"
										placeholder="Section title"
									/>
									<button
										type="button"
										class="btn-delete-section"
										onclick={() => removeSection(articleIdx, sectionIdx)}
										title="Delete section"
									>
										×
									</button>
								</div>
								<textarea
									value={section.body}
									oninput={(e) => updateSection(articleIdx, sectionIdx, 'body', (e.target as HTMLTextAreaElement).value)}
									class="section-body-input"
									placeholder="Section body"
									rows="4"
								></textarea>
								<textarea
									value={section.rationale || ''}
									oninput={(e) => updateSection(articleIdx, sectionIdx, 'rationale', (e.target as HTMLTextAreaElement).value)}
									class="section-rationale-input"
									placeholder="Rationale (optional)"
									rows="2"
								></textarea>
							</div>
						{:else}
							<div class="section-header">
								<span class="section-number">§ {sectionIdx + 1}.</span>
								<span class="section-title">{section.title}</span>
								<div class="section-actions">
									<button
										class="copy-link-btn"
										onclick={() => copyLink(article.number, sectionIdx)}
										title="Copy link to this section"
									>
										{#if copiedId === `article-${article.number}-section-${sectionIdx}`}
											copied
										{:else}
											link
										{/if}
									</button>
								</div>
							</div>
							<div class="section-body">{section.body}</div>
							{#if section.rationale}
								<details class="section-rationale">
									<summary>Rationale</summary>
									<p>{section.rationale}</p>
								</details>
							{/if}
						{/if}
					</div>
				{/each}

				{#if isEditMode}
					<button
						type="button"
						class="btn-add-section"
						onclick={() => addSection(articleIdx)}
					>
						+ Add Section
					</button>
				{/if}
			</div>
		{/each}

		{#if isEditMode}
			<button
				type="button"
				class="btn-add-article"
				onclick={addArticle}
			>
				+ Add Article
			</button>
		{/if}
	</div>
</Document>

<style>
	/* Title editing */
	.title-input {
		font-family: 'IM Fell English', serif;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 400;
		line-height: 1.15;
		color: #151c1a;
		margin: var(--space-8, 2rem) 0 var(--space-5, 1.25rem);
		text-align: center;
		letter-spacing: -0.01em;
		width: 100%;
		border: 2px dashed rgba(45, 90, 79, 0.2);
		background: rgba(255, 255, 255, 0.3);
		padding: var(--space-2, 0.5rem);
		border-radius: 4px;
	}

	.title-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.4);
		background: rgba(255, 255, 255, 0.6);
	}

	.title-input--charter {
		font-size: clamp(3rem, 6vw, 4.5rem) !important;
		letter-spacing: 0.02em;
		margin-top: 0 !important;
		margin-bottom: var(--space-8, 2rem) !important;
	}

	/* Preamble styling */
	.preamble-section {
		margin-top: var(--space-8, 2rem);
	}

	.preamble {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.25rem;
		line-height: 2;
		color: #2d2d28;
		padding: 0 var(--space-8, 2rem);
		text-align: center;
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
	}

	.preamble::first-letter {
		font-size: 3.5em;
		line-height: 0.85;
		float: left;
		font-family: 'IM Fell English', serif;
		margin-right: 0.1em;
		margin-top: 0.1em;
		color: #2d2d28;
	}

	.preamble-input {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.125rem;
		line-height: 1.75;
		color: #2d2d28;
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		display: block;
		border: 2px dashed rgba(45, 90, 79, 0.2);
		background: rgba(255, 255, 255, 0.3);
		padding: var(--space-4, 1rem);
		border-radius: 4px;
		resize: vertical;
	}

	.preamble-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.4);
		background: rgba(255, 255, 255, 0.6);
	}

	.document-title-block--charter {
		padding-top: var(--space-16, 4rem) !important;
	}

	/* Articles container */
	.articles-container {
		position: relative;
	}

	.article {
		margin-bottom: var(--space-16, 4rem);
		padding-top: var(--space-8, 2rem);
	}

	.article:first-child {
		padding-top: var(--space-12, 3rem);
	}

	.article-heading-container {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: var(--space-4, 1rem);
		margin-bottom: var(--space-10, 2.5rem);
		position: relative;
	}

	/* View mode article heading */
	.article-heading {
		text-align: center;
		margin: 0;
		padding: 0;
		border: none;
		flex: 0 1 auto;
	}

	.article-number {
		display: block;
		font-size: var(--text-base, 1rem);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #5a5a50;
		margin-bottom: var(--space-3, 0.75rem);
		font-family: 'IM Fell English SC', serif;
	}

	.article-title {
		display: block;
		font-size: 2rem;
		font-weight: 400;
		line-height: 1.3;
		color: #2d2d28;
		font-family: 'IM Fell English', serif;
		letter-spacing: 0.01em;
	}

	/* Edit mode article inputs */
	.article-edit-header {
		display: flex;
		align-items: center;
		gap: var(--space-3, 0.75rem);
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
	}

	.article-number-input {
		font-family: 'IM Fell English SC', serif;
		font-size: 1rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		width: 4rem;
		padding: var(--space-2, 0.5rem);
		border: 2px dashed rgba(45, 90, 79, 0.2);
		background: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
		text-align: center;
	}

	.article-number-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.4);
		background: rgba(255, 255, 255, 0.6);
	}

	.article-title-input {
		font-family: 'IM Fell English', serif;
		font-size: 1.5rem;
		font-weight: 400;
		flex: 1;
		padding: var(--space-2, 0.5rem);
		border: 2px dashed rgba(45, 90, 79, 0.2);
		background: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
	}

	.article-title-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.4);
		background: rgba(255, 255, 255, 0.6);
	}

	.btn-delete-article {
		width: 2rem;
		height: 2rem;
		border: 1px solid rgba(211, 47, 47, 0.3);
		background: white;
		color: #c62828;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1.5rem;
		line-height: 1;
		padding: 0;
		transition: all 0.15s;
	}

	.btn-delete-article:hover {
		background: rgba(211, 47, 47, 0.1);
		border-color: #c62828;
	}

	/* Sections */
	.section {
		margin-bottom: var(--space-8, 2rem);
		scroll-margin-top: var(--space-8, 2rem);
		transition: all 0.3s ease;
		position: relative;
	}

	.section:target {
		background: rgba(212, 162, 74, 0.08);
		margin-left: calc(-1 * var(--space-4, 1rem));
		margin-right: calc(-1 * var(--space-4, 1rem));
		padding: var(--space-4, 1rem);
		border-left: 3px solid #d4a24a;
		border-radius: 2px;
	}

	.section--edit {
		background: rgba(255, 255, 255, 0.3);
		padding: var(--space-4, 1rem);
		border: 2px dashed rgba(45, 90, 79, 0.15);
		border-radius: 4px;
	}

	/* View mode section */
	.section-header {
		display: flex;
		align-items: baseline;
		gap: var(--space-3, 0.75rem);
		margin-bottom: var(--space-3, 0.75rem);
		flex-wrap: wrap;
	}

	.section-number {
		font-size: var(--text-base, 1rem);
		font-weight: 700;
		color: #d4a24a;
		font-variant-numeric: oldstyle-nums;
		min-width: 2.5rem;
	}

	.section-title {
		font-weight: 700;
		font-size: var(--text-base, 1rem);
		color: #2d2d28;
		flex: 1;
		font-style: italic;
	}

	.section-actions {
		display: flex;
		gap: var(--space-1, 0.25rem);
		align-items: center;
	}

	.copy-link-btn {
		padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
		border: 1px solid rgba(45, 90, 79, 0.2);
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		font-size: var(--text-sm, 0.875rem);
		transition: all 0.15s;
		opacity: 0.6;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.section:hover .copy-link-btn {
		opacity: 1;
	}

	.copy-link-btn:hover {
		opacity: 1;
		background: rgba(212, 162, 74, 0.15);
		border-color: #d4a24a;
		color: #d4a24a;
	}

	.section-body {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.0625rem;
		line-height: 1.75;
		color: #2d2d28;
		text-align: justify;
		hyphens: auto;
		margin-left: 2.5rem;
		white-space: pre-wrap;
	}

	.section-rationale {
		margin-top: var(--space-5, 1.25rem);
		margin-left: 2.5rem;
		padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
		background: rgba(212, 162, 74, 0.08);
		border-left: 3px solid #d4a24a;
		border-radius: 2px;
	}

	.section-rationale summary {
		font-size: var(--text-sm, 0.875rem);
		font-weight: 700;
		color: #d4a24a;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		cursor: pointer;
		margin-bottom: var(--space-2, 0.5rem);
	}

	.section-rationale p {
		margin: var(--space-3, 0.75rem) 0 0;
		font-size: 1.0625rem;
		line-height: 1.75;
		color: #2d2d28;
		text-align: justify;
		hyphens: auto;
	}

	/* Edit mode section inputs */
	.section-edit {
		display: flex;
		flex-direction: column;
		gap: var(--space-3, 0.75rem);
	}

	.section-edit-header {
		display: flex;
		align-items: center;
		gap: var(--space-2, 0.5rem);
	}

	.section-title-input {
		font-weight: 700;
		font-style: italic;
		flex: 1;
		padding: var(--space-2, 0.5rem);
		border: 1px solid rgba(45, 90, 79, 0.25);
		background: white;
		border-radius: 4px;
		font-size: 1rem;
	}

	.section-title-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.5);
	}

	.btn-delete-section {
		width: 1.75rem;
		height: 1.75rem;
		border: 1px solid rgba(211, 47, 47, 0.3);
		background: white;
		color: #c62828;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1.25rem;
		line-height: 1;
		padding: 0;
		transition: all 0.15s;
	}

	.btn-delete-section:hover {
		background: rgba(211, 47, 47, 0.1);
		border-color: #c62828;
	}

	.section-body-input,
	.section-rationale-input {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1rem;
		line-height: 1.75;
		padding: var(--space-3, 0.75rem);
		border: 1px solid rgba(45, 90, 79, 0.25);
		background: white;
		border-radius: 4px;
		resize: vertical;
		width: 100%;
	}

	.section-body-input:focus,
	.section-rationale-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.5);
	}

	.section-rationale-input {
		font-size: 0.9375rem;
		background: rgba(212, 162, 74, 0.05);
	}

	/* Add buttons */
	.btn-add-section,
	.btn-add-article {
		display: block;
		margin: var(--space-6, 1.5rem) auto;
		padding: var(--space-3, 0.75rem) var(--space-5, 1.25rem);
		border: 2px dashed rgba(45, 90, 79, 0.3);
		background: rgba(255, 255, 255, 0.5);
		color: #2d5a4f;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9375rem;
		font-weight: 600;
		transition: all 0.15s;
	}

	.btn-add-section:hover,
	.btn-add-article:hover {
		background: rgba(45, 90, 79, 0.05);
		border-color: #2d5a4f;
	}

	.btn-add-article {
		margin-top: var(--space-10, 2.5rem);
		font-size: 1rem;
	}

	@media (max-width: 768px) {
		.section-body,
		.section-rationale {
			margin-left: 0;
		}

		.article-edit-header {
			flex-direction: column;
			align-items: stretch;
		}

		.article-number-input {
			width: 100%;
		}
	}
</style>
