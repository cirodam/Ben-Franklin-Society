<script lang="ts">
	import Badge from '@bfs/ui/src/Badge.svelte';
	import { PageHeader, EmptyState, List, ListItem } from '@bfs/ui';
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
	<PageHeader 
		title="My Library" 
		description="Draft governing documents you've created" 
	/>

	{#if data.documents.length === 0}
		<EmptyState
			icon="📄"
			title="You haven't created any documents yet"
			description="Documents are formal governing texts that can be attached to motions and adopted by the society through the deliberative process."
		/>
	{:else}
		<List>
			{#each data.documents as doc (doc.slug)}
				<ListItem href="/library/{doc.slug}">
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
				</ListItem>
			{/each}
		</List>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

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
