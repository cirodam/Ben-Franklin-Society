<script lang="ts">
	import type { ProseDocument } from '@bfs/types';
	import Document from './Document.svelte';

	let { 
		doc, 
		mode = 'view', 
		onChange,
		readonly = false 
	}: {
		doc: ProseDocument;
		mode?: 'view' | 'edit';
		onChange?: (updates: Partial<ProseDocument>) => void;
		readonly?: boolean;
	} = $props();

	// Local editable state
	let title = $state(doc.title);
	let summary = $state(doc.content.summary || '');
	let paragraphs = $state<string[]>(structuredClone($state.snapshot(doc.content.paragraphs)));
	let tags = $state<string[]>(doc.content.tags ? structuredClone($state.snapshot(doc.content.tags)) : []);

	const isEditMode = $derived(mode === 'edit' && !readonly);

	// Edit functions
	function handleTitleChange(e: Event) {
		const input = e.target as HTMLInputElement;
		title = input.value;
		emitChange();
	}

	function handleSummaryChange(e: Event) {
		const textarea = e.target as HTMLTextAreaElement;
		summary = textarea.value;
		emitChange();
	}

	function addParagraph() {
		paragraphs = [...paragraphs, ''];
		emitChange();
	}

	function removeParagraph(index: number) {
		paragraphs = paragraphs.filter((_, i) => i !== index);
		emitChange();
	}

	function updateParagraph(index: number, value: string) {
		paragraphs[index] = value;
		emitChange();
	}

	function handleTagsChange(e: Event) {
		const input = e.target as HTMLInputElement;
		tags = input.value.split(',').map(t => t.trim()).filter(Boolean);
		emitChange();
	}

	function emitChange() {
		if (onChange) {
			onChange({
				title,
				content: {
					...doc.content,
					summary: summary || undefined,
					paragraphs,
					tags: tags.length > 0 ? tags : undefined
				}
			});
		}
	}
</script>

<Document 
	documentId={doc.document_id || `#${doc.uuid.slice(0, 8)}`}
	title={isEditMode ? '' : title}
>
	{#snippet header()}
		{#if isEditMode}
			<input
				type="text"
				value={title}
				oninput={handleTitleChange}
				class="title-input"
				placeholder="Document title"
			/>
		{/if}

		{#if doc.content.published_at}
			<div class="meta-row">
				<span class="meta-label">Published:</span>
				<span class="meta-value">
					{new Date(doc.content.published_at).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</span>
			</div>
		{/if}
	{/snippet}

	<div class="prose-body">
		{#if isEditMode}
			<div class="field-group">
				<label class="field-label" for="summary">Summary (optional)</label>
				<textarea
					id="summary"
					value={summary}
					oninput={handleSummaryChange}
					class="summary-input"
					placeholder="Brief summary of this document..."
					rows="3"
				></textarea>
			</div>

			<div class="field-group">
				<label class="field-label" for="tags">Tags (optional, comma-separated)</label>
				<input
					id="tags"
					type="text"
					value={tags.join(', ')}
					oninput={handleTagsChange}
					class="tags-input"
					placeholder="philosophy, history, economics"
				/>
			</div>
		{:else if summary}
			<div class="summary">{summary}</div>
		{/if}

		<div class="paragraphs-section">
			{#each paragraphs as paragraph, index}
				<div class="paragraph" class:paragraph--edit={isEditMode}>
					{#if isEditMode}
						<div class="paragraph-edit">
							<textarea
								value={paragraph}
								oninput={(e) => updateParagraph(index, (e.target as HTMLTextAreaElement).value)}
								class="paragraph-input"
								placeholder="Paragraph text..."
								rows="4"
							></textarea>
							<button
								type="button"
								class="btn-delete-paragraph"
								onclick={() => removeParagraph(index)}
								title="Delete paragraph"
							>
								×
							</button>
						</div>
					{:else}
						<p class="paragraph-text">{paragraph}</p>
					{/if}
				</div>
			{/each}

			{#if isEditMode}
				<button
					type="button"
					class="btn-add-paragraph"
					onclick={addParagraph}
				>
					+ Add Paragraph
				</button>
			{/if}
		</div>

		{#if !isEditMode && tags.length > 0}
			<div class="tags-section">
				<span class="tags-label">Tags:</span>
				<div class="tags-list">
					{#each tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</div>
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

	/* Metadata */
	.meta-row {
		display: flex;
		gap: var(--space-2, 0.5rem);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm, 0.875rem);
		margin-top: var(--space-4, 1rem);
		justify-content: center;
	}

	.meta-label {
		font-weight: 600;
		font-style: italic;
		color: #5a5a50;
	}

	.meta-value {
		color: #2d2d28;
	}

	/* Field groups */
	.field-group {
		margin-bottom: var(--space-6, 1.5rem);
	}

	.field-label {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm, 0.875rem);
		letter-spacing: 0.08em;
		color: #2d5a4f;
		font-weight: 600;
		display: block;
		margin-bottom: var(--space-2, 0.5rem);
	}

	.summary-input,
	.tags-input {
		width: 100%;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1rem;
		line-height: 1.7;
		padding: var(--space-3, 0.75rem);
		border: 1px solid rgba(45, 90, 79, 0.25);
		background: white;
		border-radius: 4px;
		resize: vertical;
	}

	.summary-input:focus,
	.tags-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.5);
	}

	.summary {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.125rem;
		line-height: 1.8;
		color: #5a5a50;
		font-style: italic;
		margin-bottom: var(--space-8, 2rem);
		padding: var(--space-4, 1rem);
		border-left: 3px solid rgba(45, 90, 79, 0.3);
		background: rgba(45, 90, 79, 0.02);
	}

	/* Paragraphs */
	.paragraphs-section {
		margin-bottom: var(--space-8, 2rem);
	}

	.paragraph {
		margin-bottom: var(--space-6, 1.5rem);
	}

	.paragraph--edit {
		background: rgba(255, 255, 255, 0.3);
		padding: var(--space-4, 1rem);
		border: 2px dashed rgba(45, 90, 79, 0.15);
		border-radius: 4px;
	}

	.paragraph-edit {
		display: flex;
		flex-direction: column;
		gap: var(--space-2, 0.5rem);
		position: relative;
	}

	.paragraph-input {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1rem;
		line-height: 1.7;
		padding: var(--space-3, 0.75rem);
		border: 1px solid rgba(45, 90, 79, 0.25);
		background: white;
		border-radius: 4px;
		resize: vertical;
		width: 100%;
	}

	.paragraph-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.5);
	}

	.btn-delete-paragraph {
		position: absolute;
		top: var(--space-2, 0.5rem);
		right: var(--space-2, 0.5rem);
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

	.btn-delete-paragraph:hover {
		background: rgba(211, 47, 47, 0.1);
		border-color: #c62828;
	}

	.paragraph-text {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1rem;
		line-height: 1.8;
		color: #2d2d28;
		margin: 0;
		text-indent: 2em;
	}

	.btn-add-paragraph {
		display: block;
		margin: var(--space-6, 1.5rem) auto;
		padding: var(--space-3, 0.75rem) var(--space-5, 1.25rem);
		border: 2px dashed rgba(45, 90, 79, 0.3);
		background: rgba(255, 255, 255, 0.5);
		color: #2d5a4f;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.15s;
	}

	.btn-add-paragraph:hover {
		background: rgba(45, 90, 79, 0.05);
		border-color: #2d5a4f;
	}

	/* Tags */
	.tags-section {
		margin-top: var(--space-8, 2rem);
		padding-top: var(--space-6, 1.5rem);
		border-top: 1px solid rgba(45, 90, 79, 0.15);
	}

	.tags-label {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm, 0.875rem);
		letter-spacing: 0.08em;
		color: #5a5a50;
		font-weight: 600;
		margin-right: var(--space-3, 0.75rem);
	}

	.tags-list {
		display: inline-flex;
		flex-wrap: wrap;
		gap: var(--space-2, 0.5rem);
	}

	.tag {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm, 0.875rem);
		padding: var(--space-1, 0.25rem) var(--space-3, 0.75rem);
		background: rgba(45, 90, 79, 0.1);
		color: #2d5a4f;
		border-radius: 12px;
		border: 1px solid rgba(45, 90, 79, 0.2);
	}
</style>
