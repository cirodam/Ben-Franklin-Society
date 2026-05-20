<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@bfs/ui';
	import EditSectionModal from './EditSectionModal.svelte';
	import AddSectionModal from './AddSectionModal.svelte';
	import EditArticleModal from './EditArticleModal.svelte';
	import AddArticleModal from './AddArticleModal.svelte';
	import DocumentView from './DocumentView.svelte';
	import type { GoverningDocument } from '$lib/server/documents/library-types.js';

	let { document: doc, canEdit = false }: { document: GoverningDocument; canEdit?: boolean } = $props();

	const statusVariant: Record<string, string> = {
		draft:    'status--draft',
		adopted:  'status--adopted',
		repealed: 'status--repealed',
	};

	function getSeniorityName(seniority: number): string {
		const names: Record<number, string> = {
			1: 'Charter',
			2: 'Constitution',
			3: 'Bylaw',
			4: 'Ordinance',
			5: 'Regulation',
			6: 'Policy'
		};
		return names[seniority] ?? 'Document';
	}

	function getSeniorityVariant(seniority: number): string {
		return `seniority--${seniority}`;
	}

	let copiedId = $state<string | null>(null);

	function copyLink(articleNumber: string, sectionIdx: number) {
		const sectionId = `article-${articleNumber}-section-${sectionIdx}`;
		const url = `${window.location.origin}${window.location.pathname}#${sectionId}`;
		navigator.clipboard.writeText(url).then(() => {
			copiedId = sectionId;
			setTimeout(() => copiedId = null, 2000);
		});
	}

	// Modal states
	let editSectionModal = $state({ open: false, articleIdx: 0, sectionIdx: 0, section: { title: '', body: '', rationale: '' } });
	let addSectionModal = $state({ open: false, articleIdx: 0 });
	let editArticleModal = $state({ open: false, articleIdx: 0, article: { number: '', title: '' } });
	let addArticleModal = $state({ open: false });

	function openEditSection(articleIdx: number, sectionIdx: number, section: any) {
		editSectionModal = { open: true, articleIdx, sectionIdx, section };
	}

	function openAddSection(articleIdx: number) {
		addSectionModal = { open: true, articleIdx };
	}

	function openEditArticle(articleIdx: number, article: any) {
		editArticleModal = { open: true, articleIdx, article };
	}

	function openAddArticle() {
		addArticleModal = { open: true };
	}
</script>

<DocumentView>
	{#snippet header()}
		<div class="document-title-block" class:document-title-block--charter={doc.content.seniority === 1}>
			<h1 class="document-title" class:document-title--charter={doc.content.seniority === 1}>{doc.title}</h1>
			{#if doc.content.preamble && doc.content.seniority === 1}
				<div class="preamble">
					{doc.content.preamble}
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet body()}
	{#each doc.content.articles as article, articleIdx}
		<div class="article">
			<div class="article-heading-container">
				<h2 class="article-heading">
					<span class="article-number">Article {article.number}</span>
					<span class="article-title">{article.title}</span>
				</h2>
				{#if canEdit}
					<div class="article-actions">
						<button
							class="edit-btn"
							onclick={() => openEditArticle(articleIdx, article)}
							title="Edit article"
							aria-label="Edit article"
						>
							✏️
						</button>
						<button
							class="edit-btn"
							onclick={() => openAddSection(articleIdx)}
							title="Add section"
							aria-label="Add section"
						>
							➕
						</button>
						<form method="POST" action="?/deleteArticle" use:enhance style="display: inline;">
							<input type="hidden" name="articleIdx" value={articleIdx} />
							<button
								class="delete-btn"
								type="submit"
								title="Delete article"
								aria-label="Delete article"
								onclick={(e) => {
									if (!confirm('Are you sure you want to delete this article?')) {
										e.preventDefault();
									}
								}}
							>
								🗑️
							</button>
						</form>
					</div>
				{/if}
			</div>
			
			{#each article.sections as section, sectionIdx}
				<div class="section" id="article-{article.number}-section-{sectionIdx}">
					<div class="section-header">
						<span class="section-number">§ {sectionIdx + 1}.</span>
						<span class="section-title">{section.title}</span>
						<div class="section-actions">
							<button 
								class="copy-link-btn" 
								onclick={() => copyLink(article.number, sectionIdx)}
								title="Copy link to this section"
								aria-label="Copy link to this section"
							>
								{#if copiedId === `article-${article.number}-section-${sectionIdx}`}
									✓
								{:else}
									🔗
								{/if}
							</button>
							{#if canEdit}
								<button
									class="edit-btn"
									onclick={() => openEditSection(articleIdx, sectionIdx, section)}
									title="Edit section"
									aria-label="Edit section"
								>
									✏️
								</button>
								<form method="POST" action="?/deleteSection" use:enhance style="display: inline;">
									<input type="hidden" name="articleIdx" value={articleIdx} />
									<input type="hidden" name="sectionIdx" value={sectionIdx} />
									<button
										class="delete-btn"
										type="submit"
										title="Delete section"
										aria-label="Delete section"
										onclick={(e) => {
											if (!confirm('Are you sure you want to delete this section?')) {
												e.preventDefault();
											}
										}}
									>
										🗑️
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
				</div>
			{/each}
		</div>
	{/each}

	{#if canEdit}
		<div class="add-article-container">
			<Button variant="secondary" onclick={openAddArticle}>
				➕ Add Article
			</Button>
		</div>
	{/if}
	{/snippet}
</DocumentView>

{#if canEdit}
	<EditSectionModal 
		bind:open={editSectionModal.open} 
		articleIdx={editSectionModal.articleIdx}
		sectionIdx={editSectionModal.sectionIdx}
		section={editSectionModal.section}
	/>
	<AddSectionModal 
		bind:open={addSectionModal.open}
		articleIdx={addSectionModal.articleIdx}
	/>
	<EditArticleModal 
		bind:open={editArticleModal.open}
		articleIdx={editArticleModal.articleIdx}
		article={editArticleModal.article}
	/>
	<AddArticleModal bind:open={addArticleModal.open} />
{/if}

<style>
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
	.seniority--1 { 
		background: linear-gradient(135deg, #fef7e0 0%, #f9edc8 100%);
		border-color: #c89542;
		border-width: 2px;
		color: #6b4d15;
		font-weight: 600;
		box-shadow: 0 1px 3px rgba(122, 92, 26, 0.15);
	}
	.seniority--2 { background: #e8f0f8; border-color: #5b8cb8; color: #1e3a5f; }
	.seniority--3 { background: #f0ebf8; border-color: #8b6cb8; color: #4a2870; }
	.seniority--4 { background: #f8ebf0; border-color: #b86c8b; color: #70284a; }
	.seniority--5 { background: #ebf5f8; border-color: #5ba2b8; color: #1e5270; }
	.seniority--6 { background: #ebf8f0; border-color: #6cb88b; color: #28704a; }

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
		gap: var(--space-1);
		align-items: center;
	}

	.article-actions {
		position: absolute;
		right: 0;
		top: 0;
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

	.copy-link-btn, .edit-btn, .delete-btn {
		padding: var(--space-1) var(--space-2);
		border: 1px solid var(--border);
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		font-size: var(--text-sm);
		transition: all 0.15s;
		opacity: 0.6;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: inherit;
	}

	.section:hover .copy-link-btn {
		opacity: 1;
	}

	.copy-link-btn:hover {
		opacity: 1;
		background: rgba(212, 162, 74, 0.15);
		border-color: var(--gold-hover);
		color: var(--gold);
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

	.add-article-container {
		margin-top: var(--space-12);
		padding-top: var(--space-8);
		border-top: 2px solid var(--border);
		text-align: center;
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
