<script lang="ts">
	import { enhance } from '$app/forms';
	import DocumentView from './DocumentView.svelte';
	import type { GoverningDocument, SeniorityLevel } from '@bfs/types';

	let { document: doc, canEdit = false }: { document: GoverningDocument; canEdit?: boolean } = $props();

	let copiedId = $state<string | null>(null);
	let editingSection = $state<{articleIdx: number, sectionIdx: number} | null>(null);
	let editingArticle = $state<number | null>(null);

	function copyLink(articleNumber: string, sectionIdx: number) {
		const sectionId = `article-${articleNumber}-section-${sectionIdx}`;
		const url = `${window.location.origin}${window.location.pathname}#${sectionId}`;
		navigator.clipboard.writeText(url).then(() => {
			copiedId = sectionId;
			setTimeout(() => copiedId = null, 2000);
		});
	}

	function startEditingSection(articleIdx: number, sectionIdx: number) {
		editingSection = { articleIdx, sectionIdx };
	}

	function startEditingArticle(articleIdx: number) {
		editingArticle = articleIdx;
	}
</script>

<DocumentView>
	{#snippet header()}
		<div class="document-title-block" class:document-title-block--charter={doc.content.seniority === 'charter'}>
			<div class="document-letterhead">
				<div class="letterhead-body">The Ben Franklin Society</div>
				<div class="letterhead-doc-number">
					{doc.document_id || `#${doc.uuid.slice(0, 8)}`}
				</div>
			</div>
			<h1 class="document-title" class:document-title--charter={doc.content.seniority === 'charter'}>{doc.title}</h1>
			{#if doc.content.preamble && doc.content.seniority === 'charter'}
				<div class="preamble">
					{doc.content.preamble}
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet body()}
	{#each doc.content.articles as article, articleIdx}
		<div class="article">
			{#if canEdit && editingArticle === articleIdx}
				<form method="POST" action="?/editArticle" use:enhance={() => {
					return async ({ update }) => {
						await update();
						editingArticle = null;
					};
				}} class="article-edit-form">
					<input type="hidden" name="articleIdx" value={articleIdx} />
					<div class="article-form-row">
						<label>Article Number:</label>
						<input type="text" name="number" value={article.number} class="article-number-input" />
					</div>
					<div class="article-form-row">
						<label>Title:</label>
						<input type="text" name="title" value={article.title} class="article-title-input" />
					</div>
					<div class="article-form-actions">
						<button type="submit" class="save-article-btn">Save</button>
						<button type="button" onclick={() => editingArticle = null} class="cancel-article-btn">Cancel</button>
					</div>
				</form>
			{:else}
				<div class="article-heading-container">
					<h2 class="article-heading">
						<span class="article-number">Article {article.number}</span>
						<span class="article-title">{article.title}</span>
					</h2>
					{#if canEdit}
						<div class="article-actions">
							<button
								class="subtle-action-btn"
								onclick={() => startEditingArticle(articleIdx)}
								title="Edit article"
							>
								edit
							</button>
							<form method="POST" action="?/deleteArticle" use:enhance style="display: inline;">
								<input type="hidden" name="articleIdx" value={articleIdx} />
								<button
									class="subtle-action-btn delete"
									type="submit"
									title="Delete article"
									onclick={(e) => {
										if (!confirm('Are you sure you want to delete this article?')) {
											e.preventDefault();
										}
									}}
								>
									delete
								</button>
							</form>
						</div>
					{/if}
				</div>
			{/if}
			
			{#each article.sections as section, sectionIdx}
				<div class="section" id="article-{article.number}-section-{sectionIdx}">
					{#if canEdit && editingSection?.articleIdx === articleIdx && editingSection?.sectionIdx === sectionIdx}
						<form method="POST" action="?/editSection" use:enhance={() => {
							return async ({ update }) => {
								await update();
								editingSection = null;
							};
						}} class="section-edit-form">
							<input type="hidden" name="articleIdx" value={articleIdx} />
							<input type="hidden" name="sectionIdx" value={sectionIdx} />
							<div class="section-number">§ {sectionIdx + 1}.</div>
							<div class="section-edit-content">
								<input 
									type="text" 
									name="title" 
									value={section.title} 
									placeholder="Section title"
									class="section-title-input"
								/>
								<textarea 
									name="body" 
									class="section-body-input"
									rows="4"
								>{section.body}</textarea>
								<textarea 
									name="rationale" 
									placeholder="Rationale (optional)"
									class="section-rationale-input"
									rows="2"
								>{section.rationale || ''}</textarea>
								<div class="section-form-actions">
									<button type="submit" class="save-section-btn">Save</button>
									<button type="button" onclick={() => editingSection = null} class="cancel-section-btn">Cancel</button>
								</div>
							</div>
						</form>
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
										✓
									{:else}
										link
									{/if}
								</button>
								{#if canEdit}
									<button
										class="subtle-action-btn"
										onclick={() => startEditingSection(articleIdx, sectionIdx)}
										title="Edit section"
									>
										edit
									</button>
									<form method="POST" action="?/deleteSection" use:enhance style="display: inline;">
										<input type="hidden" name="articleIdx" value={articleIdx} />
										<input type="hidden" name="sectionIdx" value={sectionIdx} />
										<button
											class="subtle-action-btn delete"
											type="submit"
											title="Delete section"
											onclick={(e) => {
												if (!confirm('Are you sure you want to delete this section?')) {
													e.preventDefault();
												}
											}}
										>
											delete
										</button>
									</form>
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
					{/if}
				</div>
			{/each}

			{#if canEdit}
				<form method="POST" action="?/addSection" use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success' && result.data?.articleIdx !== undefined && result.data?.newSectionIdx !== undefined) {
							editingSection = { articleIdx: result.data.articleIdx, sectionIdx: result.data.newSectionIdx };
						}
					};
				}} class="add-section-form">
					<input type="hidden" name="articleIdx" value={articleIdx} />
					<button type="submit" class="add-section-btn">+ Add Section</button>
				</form>
			{/if}
		</div>
	{/each}

	{#if canEdit}
		<form method="POST" action="?/addArticle" use:enhance={() => {
			return async ({ result, update }) => {
				await update();
				if (result.type === 'success' && result.data?.newArticleIdx !== undefined) {
					editingArticle = result.data.newArticleIdx;
				}
			};
		}} class="add-article-form">
			<button type="submit" class="add-article-btn">+ Add Article</button>
		</form>
	{/if}
	{/snippet}
</DocumentView>

<style>
	/* Document letterhead */
	.document-letterhead {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-4);
		font-family: 'IM Fell English SC', serif;
	}

	.letterhead-body {
		font-size: var(--text-xs);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	.letterhead-doc-number {
		font-size: var(--text-xs);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	/* Preamble styling */
	.preamble {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.25rem;
		line-height: 2;
		color: var(--ink);
		margin-top: var(--space-8);
		padding: 0 var(--space-8);
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
		color: var(--ink);
	}

	/* Charter special styling */
	.document-title-block--charter {
		padding-top: var(--space-16) !important;
	}

	.document-title--charter {
		font-size: clamp(3rem, 6vw, 4.5rem) !important;
		letter-spacing: 0.02em;
		margin-top: 0 !important;
		margin-bottom: var(--space-8) !important;
	}

	.document-subtitle {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		text-align: center;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-mid);
		margin-bottom: var(--space-6);
		font-weight: 400;
	}

	/* Seniority badge variants */
	.seniority--charter { 
		background: linear-gradient(135deg, #fef7e0 0%, #f9edc8 100%);
		border-color: #c89542;
		border-width: 2px;
		color: #6b4d15;
		font-weight: 600;
		box-shadow: 0 1px 3px rgba(122, 92, 26, 0.15);
	}
	.seniority--constitution { background: #e8f0f8; border-color: #5b8cb8; color: #1e3a5f; }
	.seniority--bylaw { background: #f0ebf8; border-color: #8b6cb8; color: #4a2870; }
	.seniority--ordinance { background: #f8ebf0; border-color: #b86c8b; color: #70284a; }
	.seniority--regulation { background: #ebf5f8; border-color: #5ba2b8; color: #1e5270; }
	.seniority--policy { background: #ebf8f0; border-color: #6cb88b; color: #28704a; }

	.article {
		margin-bottom: var(--space-16);
		padding-top: var(--space-8);
	}

	.article:first-child {
		padding-top: var(--space-12);
	}

	.article:last-child {
		margin-bottom: 0;
	}

	.article-heading {
		text-align: center;
		margin: 0 0 var(--space-10) 0;
		padding: 0;
		border: none;
		flex: 1;
	}

	.article-number {
		display: block;
		font-size: var(--text-base);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: var(--ink-mid);
		margin-bottom: var(--space-3);
		font-family: 'IM Fell English SC', serif;
	}

	.article-title {
		display: block;
		font-size: 2rem;
		font-weight: 400;
		line-height: 1.3;
		color: var(--ink);
		font-family: 'IM Fell English', serif;
		letter-spacing: 0.01em;
	}

	.article-heading-container {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: var(--space-4);
		margin-bottom: var(--space-10);
		position: relative;
	}

	.article-heading-container .article-heading {
		flex: 0 1 auto;
	}

	.article-actions, .section-actions {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}

	.article-actions {
		position: absolute;
		right: 0;
		top: 0;
		opacity: 0.5;
		transition: opacity 0.2s;
	}

	.article:hover .article-actions {
		opacity: 1;
	}

	/* Subtle action buttons */
	.subtle-action-btn {
		padding: var(--space-1) var(--space-2);
		border: none;
		background: transparent;
		color: #7a5c1a;
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		letter-spacing: 0.05em;
		text-transform: lowercase;
		cursor: pointer;
		transition: all 0.15s;
		opacity: 0.6;
	}

	.subtle-action-btn:hover {
		opacity: 1;
		text-decoration: underline;
	}

	.subtle-action-btn.delete {
		color: #b86c8b;
	}

	.subtle-action-btn.delete:hover {
		color: #70284a;
	}

	.copy-link-btn {
		padding: var(--space-1) var(--space-2);
		border: none;
		background: transparent;
		cursor: pointer;
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		letter-spacing: 0.05em;
		text-transform: lowercase;
		color: #7a5c1a;
		transition: all 0.15s;
		opacity: 0.5;
	}

	.section:hover .copy-link-btn {
		opacity: 1;
	}

	.copy-link-btn:hover {
		text-decoration: underline;
	}

	/* Inline edit forms */
	.article-edit-form {
		padding: var(--space-6);
		background: rgba(122, 92, 26, 0.03);
		border: 1px solid rgba(122, 92, 26, 0.2);
		border-radius: 2px;
		margin-bottom: var(--space-8);
	}

	.article-form-row {
		margin-bottom: var(--space-4);
	}

	.article-form-row label {
		display: block;
		margin-bottom: var(--space-2);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #7a5c1a;
	}

	.article-number-input,
	.article-title-input {
		width: 100%;
		padding: var(--space-2);
		font-family: 'IM Fell English', serif;
		font-size: var(--text-lg);
		color: var(--ink);
		background: transparent;
		border: none;
		border-bottom: 1px dotted rgba(122, 92, 26, 0.4);
		transition: all 0.2s;
	}

	.article-number-input:focus,
	.article-title-input:focus {
		outline: none;
		border-bottom-style: solid;
		border-bottom-color: #7a5c1a;
		background: rgba(255, 255, 255, 0.5);
	}

	.article-form-actions,
	.section-form-actions {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-4);
	}

	.save-article-btn,
	.save-section-btn {
		padding: var(--space-2) var(--space-4);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.05em;
		color: white;
		background: #2d5a4f;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	.save-article-btn:hover,
	.save-section-btn:hover {
		background: #234a40;
	}

	.cancel-article-btn,
	.cancel-section-btn {
		padding: var(--space-2) var(--space-4);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.05em;
		color: #5a5a50;
		background: transparent;
		border: 1px solid #5a5a50;
		cursor: pointer;
		transition: all 0.2s;
	}

	.cancel-article-btn:hover,
	.cancel-section-btn:hover {
		background: rgba(90, 90, 80, 0.05);
	}

	.section-edit-form {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-4);
		background: rgba(122, 92, 26, 0.03);
		border: 1px solid rgba(122, 92, 26, 0.2);
		border-radius: 2px;
		margin-bottom: var(--space-6);
	}

	.section-edit-content {
		flex: 1;
	}

	.section-title-input,
	.section-body-input,
	.section-rationale-input {
		width: 100%;
		padding: var(--space-2);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.0625rem;
		line-height: 1.75;
		color: var(--ink);
		background: transparent;
		border: none;
		border-bottom: 1px dotted rgba(122, 92, 26, 0.4);
		margin-bottom: var(--space-3);
		transition: all 0.2s;
	}

	.section-title-input {
		font-weight: 700;
		font-style: italic;
	}

	.section-rationale-input {
		font-style: italic;
		font-size: var(--text-sm);
	}

	.section-title-input:focus,
	.section-body-input:focus,
	.section-rationale-input:focus {
		outline: none;
		border-bottom-style: solid;
		border-bottom-color: #7a5c1a;
		background: rgba(255, 255, 255, 0.5);
	}

	.add-section-form,
	.add-article-form {
		margin: var(--space-6) 0;
	}

	.add-section-btn,
	.add-article-btn {
		padding: var(--space-2) var(--space-4);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.05em;
		color: #2d5a4f;
		background: transparent;
		border: 1px dashed rgba(45, 90, 79, 0.4);
		cursor: pointer;
		transition: all 0.2s;
	}

	.add-section-btn:hover,
	.add-article-btn:hover {
		background: rgba(45, 90, 79, 0.05);
		border-style: solid;
	}

	.add-article-form {
		margin-top: var(--space-12);
		padding-top: var(--space-8);
		border-top: 2px solid var(--border);
		text-align: center;
	}

	.section {
		margin-bottom: var(--space-8);
		scroll-margin-top: var(--space-8);
		transition: all 0.3s ease;
		position: relative;
	}

	.section:target {
		background: rgba(212, 162, 74, 0.08);
		margin-left: calc(-1 * var(--space-4));
		margin-right: calc(-1 * var(--space-4));
		padding: var(--space-4);
		border-left: 3px solid var(--gold-hover);
		border-radius: 2px;
	}

	.section-header {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
		flex-wrap: wrap;
	}

	.section-number {
		font-size: var(--text-base);
		font-weight: 700;
		color: var(--gold);
		font-variant-numeric: oldstyle-nums;
		min-width: 2.5rem;
	}

	.section-title {
		font-weight: 700;
		font-size: var(--text-base);
		color: var(--ink);
		flex: 1;
		font-style: italic;
	}

	.section-body {
		font-size: 1.0625rem;
		line-height: 1.75;
		color: var(--ink);
		text-align: justify;
		hyphens: auto;
		margin-left: 2.5rem;
	}

	.section-rationale {
		margin-top: var(--space-5);
		margin-left: 2.5rem;
		padding: var(--space-4) var(--space-5);
		background: var(--tint-gold);
		border-left: 3px solid var(--gold-hover);
		border-radius: 2px;
	}

	.section-rationale summary {
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--gold);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		cursor: pointer;
		margin-bottom: var(--space-2);
	}

	.section-rationale p {
		margin: var(--space-3) 0 0;
		font-size: 1.0625rem;
		line-height: 1.75;
		color: var(--ink);
		text-align: justify;
		hyphens: auto;
	}

	@media (max-width: 768px) {
		.section-body {
			margin-left: 0;
			text-align: left;
		}

		.section-rationale {
			margin-left: 0;
		}
	}
</style>
