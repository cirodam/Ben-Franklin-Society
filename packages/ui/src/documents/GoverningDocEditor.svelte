<script lang="ts">
	import type { GoverningDocument, Article, GoverningStatus, SeniorityLevel } from '@bfs/types';
	import ArticleEditor from './ArticleEditor.svelte';
	import Input from '../Input.svelte';
	import Textarea from '../Textarea.svelte';
	import Select from '../Select.svelte';
	import Button from '../Button.svelte';
	import Badge from '../Badge.svelte';
	import Card from '../Card.svelte';

	let {
		document: doc,
		onUpdate,
		readonly = false
	}: {
		document: GoverningDocument;
		onUpdate: (updates: Partial<GoverningDocument>) => void;
		readonly?: boolean;
	} = $props();

	let title = $state(doc.title);
	let slug = $state(doc.slug);
	let seniority = $state(doc.content.seniority);
	let preamble = $state(doc.content.preamble || '');
	let articles = $state<Article[]>(doc.content.articles);

	// Update parent when values change
	$effect(() => {
		onUpdate({
			title,
			slug,
			content: {
				...doc.content,
				seniority,
				preamble: preamble || undefined,
				articles
			}
		});
	});

	function addArticle() {
		const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
		const nextNumber = romanNumerals[articles.length] || (articles.length + 1).toString();
		articles = [...articles, { number: nextNumber, title: '', sections: [] }];
	}

	function updateArticle(index: number, updates: Partial<Article>) {
		articles = articles.map((a, i) =>
			i === index ? { ...a, ...updates } : a
		);
	}

	function deleteArticle(index: number) {
		articles = articles.filter((_, i) => i !== index);
	}

	const seniorityOptions: Array<{ value: SeniorityLevel; label: string }> = [
		{ value: 'charter', label: 'Charter' },
		{ value: 'constitution', label: 'Constitution' },
		{ value: 'bylaw', label: 'Bylaw' },
		{ value: 'ordinance', label: 'Ordinance' },
		{ value: 'regulation', label: 'Regulation' },
		{ value: 'policy', label: 'Policy' }
	];

	const statusColors: Record<GoverningStatus, 'neutral' | 'accent' | 'success' | 'warn' | 'danger'> = {
		draft: 'neutral',
		enacted: 'success',
		repealed: 'danger',
		sunsetted: 'warn'
	};
</script>

<div class="governing-doc-editor">
	<Card>
		<div class="governing-doc-editor__header">
			<div class="governing-doc-editor__status">
				<Badge label={doc.content.status} variant={statusColors[doc.content.status]} />
			</div>

			<div class="governing-doc-editor__metadata">
				<div class="governing-doc-editor__field">
					<label for="title">Document Title</label>
					<Input
						id="title"
						bind:value={title}
						placeholder="Enter document title"
						disabled={readonly}
					/>
				</div>

				<div class="governing-doc-editor__field">
					<label for="slug">Slug (URL identifier)</label>
					<Input
						id="slug"
						bind:value={slug}
						placeholder="document-slug"
						disabled={readonly}
					/>
				</div>

				<div class="governing-doc-editor__field">
					<label for="seniority">Seniority Level</label>
					<Select
						id="seniority"
						bind:value={seniority}
						disabled={readonly}
					>
						{#each seniorityOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</Select>
				</div>
			</div>
		</div>

		<div class="governing-doc-editor__preamble">
			<label for="preamble">Preamble (optional)</label>
			<Textarea
				id="preamble"
				bind:value={preamble}
				placeholder="Introductory text..."
				rows={4}
				disabled={readonly}
			/>
		</div>

		<div class="governing-doc-editor__articles">
			<div class="governing-doc-editor__articles-header">
				<h3>Articles</h3>
				{#if !readonly}
					<Button variant="secondary" size="sm" onclick={addArticle}>
						+ Add Article
					</Button>
				{/if}
			</div>

			{#if articles.length === 0}
				<div class="governing-doc-editor__empty">
					No articles yet. Click "Add Article" to begin drafting.
				</div>
			{:else}
				{#each articles as article, index (index)}
					<ArticleEditor
						{article}
						onUpdate={(updates) => updateArticle(index, updates)}
						onDelete={readonly ? undefined : () => deleteArticle(index)}
					/>
				{/each}
			{/if}
		</div>
	</Card>
</div>

<style>
	.governing-doc-editor {
		width: 100%;
	}

	.governing-doc-editor__header {
		margin-bottom: 2rem;
	}

	.governing-doc-editor__status {
		margin-bottom: 1rem;
	}

	.governing-doc-editor__metadata {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.governing-doc-editor__field label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
		color: var(--color-text-secondary);
	}

	.governing-doc-editor__preamble {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--color-border);
	}

	.governing-doc-editor__preamble label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
		color: var(--color-text-secondary);
	}

	.governing-doc-editor__articles {
		padding-top: 2rem;
		border-top: 1px solid var(--color-border);
	}

	.governing-doc-editor__articles-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.governing-doc-editor__articles-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.governing-doc-editor__empty {
		padding: 3rem 2rem;
		text-align: center;
		color: var(--color-text-secondary);
		background: var(--color-surface);
		border: 1px dashed var(--color-border);
		border-radius: 0.375rem;
	}
</style>
