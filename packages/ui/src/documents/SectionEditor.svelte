<script lang="ts">
	import type { Section } from '@bfs/types';
	import Input from '../Input.svelte';
	import Textarea from '../Textarea.svelte';
	import Button from '../Button.svelte';

	let {
		section,
		onUpdate,
		onDelete
	}: {
		section: Section;
		onUpdate: (updates: Partial<Section>) => void;
		onDelete?: () => void;
	} = $props();

	let title = $state(section.title);
	let body = $state(section.body);
	let rationale = $state(section.rationale || '');

	// Update parent when user finishes editing
	function handleUpdate() {
		onUpdate({ title, body, rationale: rationale || undefined });
	}
</script>

<div class="section-editor">
	<div class="section-editor__header">
		<Input
			bind:value={title}
			onblur={handleUpdate}
			placeholder="Section title"
			class="section-editor__title"
		/>
		{#if onDelete}
			<Button variant="danger" size="sm" onclick={onDelete}>
				Delete Section
			</Button>
		{/if}
	</div>

	<div class="section-editor__body">
		<label for="body" class="section-editor__label">Content</label>
		<Textarea
			id="body"
			bind:value={body}
			onblur={handleUpdate}
			placeholder="Section content..."
			rows={8}
		/>
	</div>

	<div class="section-editor__rationale">
		<label for="rationale" class="section-editor__label">Rationale (optional)</label>
		<Textarea
			id="rationale"
			bind:value={rationale}
			onblur={handleUpdate}
			placeholder="Explanation or reasoning for this section..."
			rows={3}
		/>
	</div>
</div>

<style>
	.section-editor {
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		padding: 1rem;
		margin-bottom: 1rem;
		background: var(--color-surface);
	}

	.section-editor__header {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 1rem;
	}

	.section-editor__title {
		flex: 1;
	}

	.section-editor__body,
	.section-editor__rationale {
		margin-bottom: 1rem;
	}

	.section-editor__body:last-child,
	.section-editor__rationale:last-child {
		margin-bottom: 0;
	}

	.section-editor__label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
		color: var(--color-text-secondary);
	}
</style>
