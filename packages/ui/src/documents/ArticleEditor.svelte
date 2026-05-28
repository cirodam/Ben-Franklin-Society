<script lang="ts">
	import type { Article, Section } from '@bfs/types';
	import SectionEditor from './SectionEditor.svelte';
	import Input from '../Input.svelte';
	import Button from '../Button.svelte';

	let {
		article,
		onUpdate,
		onDelete
	}: {
		article: Article;
		onUpdate: (updates: Partial<Article>) => void;
		onDelete?: () => void;
	} = $props();

	let number = $state(article.number);
	let title = $state(article.title);
	let sections = $state<Section[]>(article.sections);

	// Update parent when user finishes editing
	function handleUpdate() {
		onUpdate({ number, title, sections });
	}

	function addSection() {
		sections = [...sections, { title: '', body: '', rationale: undefined }];
		handleUpdate();
	}

	function updateSection(index: number, updates: Partial<Section>) {
		sections = sections.map((s, i) =>
			i === index ? { ...s, ...updates } : s
		);
		handleUpdate();
	}

	function deleteSection(index: number) {
		sections = sections.filter((_, i) => i !== index);
		handleUpdate();
	}
</script>

<div class="article-editor">
	<div class="article-editor__header">
		<Input
			bind:value={number}
			onblur={handleUpdate}
			placeholder="Article number (e.g., 'I', 'II')"
			class="article-editor__number"
		/>
		<Input
			bind:value={title}
			onblur={handleUpdate}
			placeholder="Article title"
			class="article-editor__title"
		/>
		{#if onDelete}
			<Button variant="danger" size="sm" onclick={onDelete}>
				Delete Article
			</Button>
		{/if}
	</div>

	<div class="article-editor__sections">
		<div class="article-editor__sections-header">
			<h4>Sections</h4>
			<Button variant="secondary" size="sm" onclick={addSection}>
				+ Add Section
			</Button>
		</div>

		{#if sections.length === 0}
			<div class="article-editor__empty">
				No sections yet. Click "Add Section" to begin.
			</div>
		{:else}
			{#each sections as section, index (index)}
				<SectionEditor
					{section}
					onUpdate={(updates) => updateSection(index, updates)}
					onDelete={() => deleteSection(index)}
				/>
			{/each}
		{/if}
	</div>
</div>

<style>
	.article-editor {
		border: 2px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		background: var(--color-background);
	}

	.article-editor__header {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.article-editor__number {
		flex: 0 0 8rem;
	}

	.article-editor__title {
		flex: 1;
	}

	.article-editor__sections {
		margin-top: 1rem;
	}

	.article-editor__sections-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.article-editor__sections-header h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.article-editor__empty {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-secondary);
		background: var(--color-surface);
		border: 1px dashed var(--color-border);
		border-radius: 0.375rem;
	}
</style>
