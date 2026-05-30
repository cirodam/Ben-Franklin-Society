<script lang="ts">
	import type { ReportDocument, ReportSection } from '@bfs/types';
	import Document from './Document.svelte';

	let { 
		report, 
		mode = 'view', 
		onChange,
		readonly = false 
	}: {
		report: ReportDocument;
		mode?: 'view' | 'edit';
		onChange?: (updates: Partial<ReportDocument>) => void;
		readonly?: boolean;
	} = $props();

	// Local editable state
	let title = $state(report.title);
	let summary = $state(report.content.summary);
	let reportDate = $state(report.content.report_date);
	let sections = $state<ReportSection[]>(structuredClone($state.snapshot(report.content.sections)));

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

	function handleReportDateChange(e: Event) {
		const input = e.target as HTMLInputElement;
		reportDate = input.value;
		emitChange();
	}

	function addSection() {
		sections = [...sections, { title: '', body: '' }];
		emitChange();
	}

	function removeSection(index: number) {
		sections = sections.filter((_, i) => i !== index);
		emitChange();
	}

	function updateSection(index: number, field: 'title' | 'body', value: string) {
		sections[index] = { ...sections[index], [field]: value };
		emitChange();
	}

	function emitChange() {
		if (onChange) {
			onChange({
				title,
				content: {
					...report.content,
					summary,
					report_date: reportDate,
					sections
				}
			});
		}
	}
</script>

<Document 
	documentId={report.document_id || `#${report.uuid.slice(0, 8)}`}
	title={isEditMode ? '' : title}
>
	{#snippet header()}
		{#if isEditMode}
			<input
				type="text"
				value={title}
				oninput={handleTitleChange}
				class="title-input"
				placeholder="Report title"
			/>

			<div class="field-group">
				<label class="field-label" for="reportDate">Report Date</label>
				<input
					id="reportDate"
					type="date"
					value={reportDate}
					oninput={handleReportDateChange}
					class="date-input"
				/>
			</div>
		{:else}
			<div class="meta-row">
				<span class="meta-label">Report Date:</span>
				<span class="meta-value">
					{new Date(report.content.report_date).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</span>
			</div>
		{/if}

		{#if report.content.published_at}
			<div class="meta-row">
				<span class="meta-label">Published:</span>
				<span class="meta-value">
					{new Date(report.content.published_at).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</span>
			</div>
		{/if}
	{/snippet}

	<div class="report-body">
		{#if isEditMode}
			<div class="field-group">
				<label class="field-label" for="summary">Summary</label>
				<textarea
					id="summary"
					value={summary}
					oninput={handleSummaryChange}
					class="summary-input"
					placeholder="Executive summary of this report..."
					rows="4"
				></textarea>
			</div>
		{:else}
			<div class="summary">{summary}</div>
		{/if}

		<div class="sections-list">
			<h2 class="sections-heading">Report Sections</h2>

			{#each sections as section, index}
				<div class="section" class:section--edit={isEditMode}>
					{#if isEditMode}
						<div class="section-edit">
							<div class="section-edit-header">
								<input
									type="text"
									value={section.title}
									oninput={(e) => updateSection(index, 'title', (e.target as HTMLInputElement).value)}
									class="section-title-input"
									placeholder="Section title"
								/>
								<button
									type="button"
									class="btn-delete-section"
									onclick={() => removeSection(index)}
									title="Delete section"
								>
									×
								</button>
							</div>
							<textarea
								value={section.body}
								oninput={(e) => updateSection(index, 'body', (e.target as HTMLTextAreaElement).value)}
								class="section-body-input"
								placeholder="Section content..."
								rows="6"
							></textarea>
						</div>
					{:else}
						<h3 class="section-title">{section.title}</h3>
						<div class="section-body">{section.body}</div>
					{/if}
				</div>
			{/each}

			{#if isEditMode}
				<button
					type="button"
					class="btn-add-section"
					onclick={addSection}
				>
					+ Add Section
				</button>
			{/if}
		</div>
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
		text-align: center;
	}

	.date-input {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1rem;
		padding: var(--space-2, 0.5rem);
		border: 1px solid rgba(45, 90, 79, 0.25);
		background: white;
		border-radius: 4px;
		display: block;
		margin: 0 auto;
	}

	.date-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.5);
	}

	.summary-input {
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

	.summary-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.5);
	}

	.summary {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.125rem;
		line-height: 1.8;
		color: #2d2d28;
		margin-bottom: var(--space-8, 2rem);
		padding: var(--space-6, 1.5rem);
		background: rgba(45, 90, 79, 0.05);
		border-left: 4px solid rgba(45, 90, 79, 0.3);
		border-radius: 4px;
	}

	/* Sections */
	.sections-list {
		margin-top: var(--space-8, 2rem);
	}

	.sections-heading {
		font-family: 'IM Fell English', serif;
		font-size: 1.75rem;
		font-weight: 400;
		color: #2d2d28;
		margin: 0 0 var(--space-6, 1.5rem) 0;
		padding-bottom: var(--space-4, 1rem);
		border-bottom: 2px solid rgba(45, 90, 79, 0.2);
	}

	.section {
		margin-bottom: var(--space-8, 2rem);
	}

	.section--edit {
		background: rgba(255, 255, 255, 0.3);
		padding: var(--space-4, 1rem);
		border: 2px dashed rgba(45, 90, 79, 0.15);
		border-radius: 4px;
	}

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
		font-family: 'IM Fell English', serif;
		font-size: 1.25rem;
		font-weight: 600;
		flex: 1;
		padding: var(--space-2, 0.5rem);
		border: 1px solid rgba(45, 90, 79, 0.25);
		background: white;
		border-radius: 4px;
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

	.section-body-input {
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

	.section-body-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.5);
	}

	.section-title {
		font-family: 'IM Fell English', serif;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 var(--space-4, 1rem) 0;
		color: #151c1a;
	}

	.section-body {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1rem;
		line-height: 1.8;
		color: #2d2d28;
		white-space: pre-wrap;
	}

	.btn-add-section {
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

	.btn-add-section:hover {
		background: rgba(45, 90, 79, 0.05);
		border-color: #2d5a4f;
	}
</style>
