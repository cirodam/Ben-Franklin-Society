<script lang="ts">
	import Badge from '@bfs/ui/src/Badge.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	function getSeniorityName(seniority: number): string {
		const names: Record<number, string> = {
			1: 'Charter',
			2: 'Constitution',
			3: 'Bylaw',
			4: 'Ordinance',
			5: 'Regulation',
			6: 'Policy'
		};
		return names[seniority] || 'Document';
	}

	const statusVariant = (status: string): 'success' | 'warn' | 'danger' =>
		status === 'adopted' ? 'success' : status === 'draft' ? 'warn' : 'danger';
</script>

<div class="page">
	<div class="page-header">
		<h1>My Documents</h1>
		<p class="page-subtitle">Draft governing documents you've created</p>
	</div>

	{#if data.documents.length === 0}
		<div class="empty">
			<p>You haven't created any documents yet.</p>
			<p class="empty__hint">
				Documents are formal governing texts that can be attached to motions and 
				adopted by the society through the deliberative process.
			</p>
		</div>
	{:else}
		<div class="documents-list">
			{#each data.documents as doc (doc.slug)}
				<a href="/documents/{doc.slug}" class="document-card">
					<div class="document-card__main">
						<div class="document-card__title">{doc.title}</div>
						<code class="document-card__slug">{doc.slug}</code>
					</div>
					<div class="document-card__meta">
						<span class="seniority-badge seniority--{doc.seniority}">
							{getSeniorityName(doc.seniority)}
						</span>
						<Badge label={doc.status} variant={statusVariant(doc.status)} />
						<span class="document-card__date">
							Created {doc.created_at.slice(0, 10)}
						</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.page-header h1 {
		margin: 0;
		font-size: var(--text-3xl);
	}

	.page-subtitle {
		margin: var(--space-2) 0 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.empty {
		text-align: center;
		padding: var(--space-12) var(--space-6);
		color: var(--color-text-muted);
	}

	.empty p {
		margin: 0 0 var(--space-4);
		font-size: var(--text-base);
	}

	.empty__hint {
		font-size: var(--text-sm);
		max-width: 500px;
		margin: 0 auto;
	}

	.documents-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.document-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--color-border);
		text-decoration: none;
		color: inherit;
		transition: background 0.1s;
	}
	.document-card:last-child { border-bottom: none; }
	.document-card:hover { background: var(--color-surface); }

	.document-card__main {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
		flex: 1;
	}

	.document-card__title {
		font-weight: var(--weight-semibold);
		font-size: var(--text-lg);
	}

	.document-card__slug {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.document-card__meta {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-shrink: 0;
	}

	.document-card__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.seniority-badge {
		font-size: var(--text-xs);
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-full);
		font-weight: var(--weight-medium);
		background: var(--color-accent-subtle);
		color: var(--color-accent);
		border: 1px solid var(--color-accent);
		white-space: nowrap;
	}

	.seniority--1 { background: #fef3c7; border-color: #f59e0b; color: #92400e; } /* charter - amber */
	.seniority--2 { background: #dbeafe; border-color: #3b82f6; color: #1e40af; } /* constitution - blue */
	.seniority--3 { background: #e0e7ff; border-color: #6366f1; color: #3730a3; } /* bylaw - indigo */
	.seniority--4 { background: #e9d5ff; border-color: #a855f7; color: #6b21a8; } /* ordinance - purple */
	.seniority--5 { background: #fce7f3; border-color: #ec4899; color: #9f1239; } /* regulation - pink */
	.seniority--6 { background: #f3f4f6; border-color: #6b7280; color: #374151; } /* policy - gray */
</style>
