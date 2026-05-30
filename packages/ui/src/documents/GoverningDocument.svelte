<script lang="ts">
	import type { GoverningDocument, Article, Section } from '@bfs/types';
	import Button from '../Button.svelte';
	import Modal from '../Modal.svelte';

	let {
		document: doc,
		editable = false,
		onSave
	}: {
		document: GoverningDocument;
		editable?: boolean;
		onSave?: (updates: Partial<GoverningDocument>) => void | Promise<void>;
	} = $props();

	// Edit state
	let isEditMode = $state(false);
	let editedTitle = $state(doc.title);
	let editedArticles = $state<Article[]>([...doc.content.articles]);
	let editedPreamble = $state(doc.content.preamble || '');
	let isSaving = $state(false);

	// Modal state for editing articles/sections
	let showArticleModal = $state(false);
	let editingArticleIndex = $state<number | null>(null);
	let modalArticle = $state<Article>({ number: '', title: '', sections: [] });

	let showSectionModal = $state(false);
	let editingSectionArticleIdx = $state<number | null>(null);
	let editingSectionIndex = $state<number | null>(null);
	let modalSection = $state<Section>({ title: '', body: '', rationale: '' });

	// Copy link state
	let copiedId = $state<string | null>(null);

	function toggleEditMode() {
		isEditMode = !isEditMode;
		if (isEditMode) {
			editedTitle = doc.title;
			editedArticles = JSON.parse(JSON.stringify(doc.content.articles));
			editedPreamble = doc.content.preamble || '';
		}
	}

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

	// Article management
	function openArticleModal(index: number) {
		editingArticleIndex = index;
		modalArticle = JSON.parse(JSON.stringify(editedArticles[index]));
		showArticleModal = true;
	}

	function openNewArticleModal() {
		editingArticleIndex = null;
		const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
		const nextNumber = romanNumerals[editedArticles.length] || (editedArticles.length + 1).toString();
		modalArticle = { number: nextNumber, title: '', sections: [] };
		showArticleModal = true;
	}

	function saveArticle() {
		if (editingArticleIndex !== null) {
			editedArticles[editingArticleIndex] = { ...modalArticle };
		} else {
			editedArticles = [...editedArticles, { ...modalArticle }];
		}
		showArticleModal = false;
	}

	function deleteArticle(index: number) {
		if (confirm('Delete this article and all its sections?')) {
			editedArticles = editedArticles.filter((_, i) => i !== index);
		}
	}

	// Section management
	function openSectionModal(articleIdx: number, sectionIdx: number) {
		editingSectionArticleIdx = articleIdx;
		editingSectionIndex = sectionIdx;
		modalSection = JSON.parse(JSON.stringify(editedArticles[articleIdx].sections[sectionIdx]));
		showSectionModal = true;
	}

	function openNewSectionModal(articleIdx: number) {
		editingSectionArticleIdx = articleIdx;
		editingSectionIndex = null;
		modalSection = { title: '', body: '', rationale: '' };
		showSectionModal = true;
	}

	function saveSection() {
		if (editingSectionArticleIdx !== null) {
			if (editingSectionIndex !== null) {
				editedArticles[editingSectionArticleIdx].sections[editingSectionIndex] = { ...modalSection };
			} else {
				editedArticles[editingSectionArticleIdx].sections = [
					...editedArticles[editingSectionArticleIdx].sections,
					{ ...modalSection }
				];
			}
			editedArticles = [...editedArticles]; // Trigger reactivity
		}
		showSectionModal = false;
	}

	function deleteSection(articleIdx: number, sectionIdx: number) {
		if (confirm('Delete this section?')) {
			editedArticles[articleIdx].sections = editedArticles[articleIdx].sections.filter(
				(_, i) => i !== sectionIdx
			);
			editedArticles = [...editedArticles]; // Trigger reactivity
		}
	}

	function cancelEdit() {
		isEditMode = false;
	}

	async function handleSave() {
		if (onSave) {
			isSaving = true;
			try {
				await onSave({
					title: editedTitle,
					content: {
						...doc.content,
						articles: editedArticles,
						preamble: editedPreamble || undefined
					}
				});
				isEditMode = false;
			} finally {
				isSaving = false;
			}
		}
	}
</script>

<article class="document">
	<div class="document-header">
		<div
			class="document-title-block"
			class:document-title-block--charter={doc.content.seniority === 'charter'}
		>
			<div class="document-letterhead">
				<div class="letterhead-body">The Ben Franklin Society</div>
				<div class="letterhead-doc-number">
					{doc.document_id || `#${doc.uuid.slice(0, 8)}`}
				</div>
			</div>
			{#if isEditMode}
				<input
					type="text"
					bind:value={editedTitle}
					class="document-title-input"
					placeholder="Document Title"
				/>
			{:else}
				<h1
					class="document-title"
					class:document-title--charter={doc.content.seniority === 'charter'}
				>
					{doc.title}
				</h1>
			{/if}
			{#if isEditMode && doc.content.seniority === 'charter'}
				<textarea
					bind:value={editedPreamble}
					class="preamble-input"
					placeholder="Preamble (optional)"
					rows="4"
				></textarea>
			{:else if doc.content.preamble && doc.content.seniority === 'charter'}
				<div class="preamble">
					{doc.content.preamble}
				</div>
			{/if}
		</div>

		{#if editable}
			<div class="edit-toolbar">
				{#if !isEditMode}
					<Button variant="secondary" size="sm" onclick={toggleEditMode}>
						Edit Document
					</Button>
				{:else}
					<Button variant="secondary" size="sm" onclick={cancelEdit}>Cancel</Button>
					<Button variant="primary" size="sm" onclick={handleSave} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save Changes'}
					</Button>
				{/if}
			</div>
		{/if}
	</div>

	<div class="document-body">
		{#each (isEditMode ? editedArticles : doc.content.articles) as article, articleIdx}
			<div class="article">
				<div class="article-heading-container">
					<h2 class="article-heading">
						<span class="article-number">Article {article.number}</span>
						<span class="article-title">{article.title}</span>
					</h2>
					{#if isEditMode}
						<div class="article-actions">
							<button
								class="edit-btn"
								onclick={() => openArticleModal(articleIdx)}
								title="Edit article"
							>
								edit
							</button>
							<button
								class="edit-btn"
								onclick={() => openNewSectionModal(articleIdx)}
								title="Add section"
							>
								add
							</button>
							<button
								class="delete-btn"
								onclick={() => deleteArticle(articleIdx)}
								title="Delete article"
							>
								delete
							</button>
						</div>
					{/if}
				</div>

				{#each article.sections as section, sectionIdx}
					<div
						class="section"
						id="article-{article.number}-section-{sectionIdx}"
					>
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
								{#if isEditMode}
									<button
										class="edit-btn"
										onclick={() => openSectionModal(articleIdx, sectionIdx)}
										title="Edit section"
									>
										edit
									</button>
									<button
										class="delete-btn"
										onclick={() => deleteSection(articleIdx, sectionIdx)}
										title="Delete section"
									>
										delete
									</button>
								{/if}
							</div>
						</div>
						<div class="section-body">
							{section.body}
						</div>
						{#if section.rationale}
							<details class="section-rationale">
								<summary>Rationale</summary>
								<p>{section.rationale}</p>
							</details>
						{/if}
					</div>
				{/each}
			</div>
		{/each}

		{#if isEditMode}
			<div class="add-article-container">
				<Button variant="secondary" onclick={openNewArticleModal}>
					Add Article
				</Button>
			</div>
		{/if}
	</div>
</article>

<!-- Article Edit Modal -->
<Modal
	bind:open={showArticleModal}
	title={editingArticleIndex !== null ? 'Edit Article' : 'Add Article'}
>
	<div class="modal-content">
		<div class="form-group">
			<label for="article-number">Number</label>
			<input
				id="article-number"
				type="text"
				bind:value={modalArticle.number}
				placeholder="I"
				class="modal-input"
			/>
		</div>

		<div class="form-group">
			<label for="article-title">Title</label>
			<input
				id="article-title"
				type="text"
				bind:value={modalArticle.title}
				placeholder="Article title"
				class="modal-input"
			/>
		</div>

		<div class="modal-actions">
			<Button variant="secondary" onclick={() => (showArticleModal = false)}>Cancel</Button>
			<Button variant="primary" onclick={saveArticle}>
				{editingArticleIndex !== null ? 'Save' : 'Add'}
			</Button>
		</div>
	</div>
</Modal>

<!-- Section Edit Modal -->
<Modal
	bind:open={showSectionModal}
	title={editingSectionIndex !== null ? 'Edit Section' : 'Add Section'}
>
	<div class="modal-content">
		<div class="form-group">
			<label for="section-title">Title</label>
			<input
				id="section-title"
				type="text"
				bind:value={modalSection.title}
				placeholder="Section title"
				class="modal-input"
			/>
		</div>

		<div class="form-group">
			<label for="section-body">Content</label>
			<textarea
				id="section-body"
				bind:value={modalSection.body}
				placeholder="Section content..."
				rows="8"
				class="modal-textarea"
			></textarea>
		</div>

		<div class="form-group">
			<label for="section-rationale">Rationale (optional)</label>
			<textarea
				id="section-rationale"
				bind:value={modalSection.rationale}
				placeholder="Explanation or reasoning for this section..."
				rows="4"
				class="modal-textarea"
			></textarea>
		</div>

		<div class="modal-actions">
			<Button variant="secondary" onclick={() => (showSectionModal = false)}>Cancel</Button>
			<Button variant="primary" onclick={saveSection}>
				{editingSectionIndex !== null ? 'Save' : 'Add'}
			</Button>
		</div>
	</div>
</Modal>

<style>
	/* Document paper styling */
	.document {
		max-width: 1400px;
		margin: var(--space-12) auto;
		padding: var(--space-16) 0;
		background: #fffef8;
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.04),
			0 4px 12px rgba(0, 0, 0, 0.08),
			0 16px 48px rgba(0, 0, 0, 0.12);
		position: relative;
		box-sizing: border-box;
		min-height: 11in;
		width: 100%;
		box-sizing: border-box;
	}

	.document::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: 
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 1.5rem,
				rgba(45, 90, 79, 0.02) 1.5rem,
				rgba(45, 90, 79, 0.02) calc(1.5rem + 1px)
			);
		pointer-events: none;
	}

	.document-header {
		padding: var(--space-10, 2.5rem);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
		position: relative;
		z-index: 1;
	}

	.document-body {
		padding: var(--space-10, 2.5rem);
		position: relative;
		z-index: 1;
	}

	.document-letterhead {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-4, 1rem);
		font-family: 'IM Fell English SC', serif;
	}

	.letterhead-body {
		font-size: var(--text-xs, 0.75rem);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	.letterhead-doc-number {
		font-size: var(--text-xs, 0.75rem);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	.document-title {
		font-family: 'IM Fell English', serif;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 400;
		line-height: 1.15;
		color: #151c1a;
		margin: var(--space-8, 2rem) 0 var(--space-5, 1.25rem);
		text-align: center;
		letter-spacing: -0.01em;
	}

	.document-title-input,
	.preamble-input {
		font-family: 'IM Fell English', serif;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 400;
		line-height: 1.15;
		color: #151c1a;
		margin: var(--space-8, 2rem) 0 var(--space-5, 1.25rem);
		text-align: center;
		letter-spacing: -0.01em;
		width: 100%;
		border: 2px dashed rgba(45, 90, 79, 0.3);
		background: rgba(255, 255, 255, 0.5);
		padding: 0.5rem;
		border-radius: 4px;
	}

	.preamble-input {
		font-size: 1.25rem;
		line-height: 1.7;
		resize: vertical;
	}

	.preamble {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.25rem;
		line-height: 2;
		color: #2d2d28;
		margin-top: var(--space-8, 2rem);
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

	.document-title-block--charter {
		padding-top: var(--space-16, 4rem) !important;
	}

	.document-title--charter {
		font-size: clamp(3rem, 6vw, 4.5rem) !important;
		letter-spacing: 0.02em;
		margin-top: 0 !important;
		margin-bottom: var(--space-8, 2rem) !important;
	}

	.edit-toolbar {
		display: flex;
		gap: var(--space-3, 0.75rem);
		justify-content: center;
		margin-top: var(--space-6, 1.5rem);
		padding-top: var(--space-6, 1.5rem);
		border-top: 1px solid rgba(45, 90, 79, 0.1);
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

	.article-actions,
	.section-actions {
		display: flex;
		gap: var(--space-1, 0.25rem);
		align-items: center;
	}

	.article-actions {
		position: absolute;
		right: 0;
		top: 0;
	}

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

	.copy-link-btn,
	.edit-btn,
	.delete-btn {
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

	.edit-btn:hover {
		opacity: 1;
		background: rgba(91, 140, 184, 0.15);
		border-color: #5b8cb8;
	}

	.delete-btn:hover {
		opacity: 1;
		background: rgba(184, 108, 108, 0.15);
		border-color: #b86c6c;
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

	.add-article-container {
		margin-top: var(--space-12, 3rem);
		display: flex;
		justify-content: center;
		padding-top: var(--space-8, 2rem);
		border-top: 1px solid rgba(45, 90, 79, 0.1);
	}

	/* Modal styling */
	.modal-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4, 1rem);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2, 0.5rem);
	}

	.form-group label {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 0.875rem;
		font-weight: 600;
		color: #2d2d28;
	}

	.modal-input,
	.modal-textarea {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1rem;
		padding: var(--space-3, 0.75rem);
		border: 1px solid rgba(45, 90, 79, 0.3);
		border-radius: 4px;
		background: white;
	}

	.modal-textarea {
		resize: vertical;
	}

	.modal-actions {
		display: flex;
		gap: var(--space-3, 0.75rem);
		justify-content: flex-end;
		margin-top: var(--space-4, 1rem);
		padding-top: var(--space-4, 1rem);
		border-top: 1px solid rgba(45, 90, 79, 0.1);
	}

	@media (max-width: 768px) {
		.document {
			padding: var(--space-4, 1rem);
		}

		.document-header,
		.document-body {
			padding: var(--space-6, 1.5rem);
		}

		.section-body,
		.section-rationale {
			margin-left: 0;
		}
	}
</style>
