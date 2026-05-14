<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { document: doc } = $derived(data);

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
</script>

<div class="page">
	<div class="page-header">
		<a href="/documents" class="back">← Documents</a>
		<h1>{doc.title}</h1>
		<div class="meta-row">
			<span class="seniority-badge {getSeniorityVariant(doc.seniority)}">{getSeniorityName(doc.seniority)}</span>
			<span class="status-badge {statusVariant[doc.status] ?? ''}">{doc.status}</span>
			{#if doc.adopted_at}
				<span class="meta-item">Adopted {doc.adopted_at.slice(0, 10)}</span>
			{/if}
			{#if doc.repealed_at}
				<span class="meta-item meta-item--warn">Repealed {doc.repealed_at.slice(0, 10)}</span>
			{/if}
		</div>
	</div>

	<div class="document">
		{#each doc.articles as article, articleIdx}
			<div class="article">
				<h2 class="article__heading">
					<span class="article__number">Article {article.number}</span>
					{article.title}
				</h2>
				<div class="sections">
					{#each article.sections as section, sectionIdx}
						<div class="section" id="article-{article.number}-section-{sectionIdx}">
							<div class="section__header">
								<span class="section__number">§ {sectionIdx + 1}</span>
								<span class="section__title">{section.title}</span>
								<button 
									class="copy-link-btn" 
									onclick={() => copyLink(article.number, sectionIdx)}
									title="Copy link to this section"
								>
									{#if copiedId === `article-${article.number}-section-${sectionIdx}`}
										✓
									{:else}
										🔗
									{/if}
								</button>
							</div>
							<p class="section__body">{section.body}</p>
							{#if section.rationale}
								<details class="section__rationale">
									<summary>Rationale</summary>
									<p>{section.rationale}</p>
								</details>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}

	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 740px;
		margin: 0 auto;
	}

	.back {
		display: inline-block;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		margin-bottom: var(--space-2);
	}
	.back:hover { color: var(--color-text); }

	.page-header h1 { margin: 0 0 var(--space-3); }

	.meta-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.seniority-badge {
		display: inline-block;
		font-size: var(--text-xs);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-weight: var(--weight-medium);
		text-transform: capitalize;
		border: 1px solid;
	}

	.seniority--1 { background: #fefce8; border-color: #fbbf24; color: #92400e; }
	.seniority--2 { background: #dbeafe; border-color: #3b82f6; color: #1e40af; }
	.seniority--3 { background: #ede9fe; border-color: #8b5cf6; color: #6b21a8; }
	.seniority--4 { background: #fce7f3; border-color: #ec4899; color: #9f1239; }
	.seniority--5 { background: #e0f2fe; border-color: #0ea5e9; color: #075985; }
	.seniority--6 { background: #f0fdf4; border-color: #22c55e; color: #166534; }

	.status-badge {
		display: inline-block;
		font-size: var(--text-xs);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: 1px solid transparent;
	}
	.status--draft    { background: var(--color-surface); border-color: var(--color-border); color: var(--color-text-muted); }
	.status--adopted  { background: #dcfce7; border-color: #86efac; color: #166534; }
	.status--repealed { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }

	.meta-item {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
	.meta-item--warn { color: #b45309; }

	.document {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
	}

	.article__heading {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.article__number {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-muted);
		font-weight: var(--weight-medium);
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.section {
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		scroll-margin-top: var(--space-6);
		transition: all 0.3s ease;
	}

	.section:target {
		background: #fef3c7;
		border-color: #fbbf24;
		box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
	}

	.section__header {
		margin-bottom: var(--space-3);
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.section__number {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	.section__title {
		font-weight: var(--weight-semibold);
		font-size: var(--text-base);
		color: var(--color-text);
		flex: 1;
	}

	.copy-link-btn {
		padding: var(--space-1) var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: var(--text-sm);
		transition: all 0.15s;
		flex-shrink: 0;
	}
	.copy-link-btn:hover {
		background: var(--color-surface);
		border-color: var(--color-text-muted);
		color: var(--color-text);
	}

	.section__body {
		margin: 0;
		font-size: var(--text-sm);
		line-height: 1.7;
		color: var(--color-text);
	}

	.section__rationale {
		margin-top: var(--space-4);
		padding: var(--space-3);
		background: var(--color-background);
		border-radius: var(--radius);
		border: 1px solid var(--color-border);
	}

	.section__rationale summary {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		cursor: pointer;
	}

	.section__rationale p {
		margin: var(--space-2) 0 0;
		font-size: var(--text-sm);
		line-height: 1.6;
		color: var(--color-text-muted);
		font-style: italic;
	}
</style>
