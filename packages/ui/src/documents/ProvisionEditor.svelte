<script lang="ts">
	import type { Provision } from '@bfs/types';
	import Input from '../Input.svelte';
	import Textarea from '../Textarea.svelte';
	import Button from '../Button.svelte';

	let {
		provision,
		onUpdate,
		onDelete
	}: {
		provision: Provision;
		onUpdate: (updates: Partial<Provision>) => void;
		onDelete?: () => void;
	} = $props();

	let number = $state(provision.number);
	let title = $state(provision.title || '');
	let text = $state(provision.text);
	let reasoning = $state(provision.reasoning || '');

	// Update parent when values change
	$effect(() => {
		onUpdate({
			number,
			title: title || undefined,
			text,
			reasoning: reasoning || undefined
		});
	});
</script>

<div class="provision-editor">
	<div class="provision-editor__header">
		<Input
			bind:value={number}
			placeholder="Number (e.g., '1', '1.a')"
			class="provision-editor__number"
		/>
		<Input
			bind:value={title}
			placeholder="Title (optional)"
			class="provision-editor__title"
		/>
		{#if onDelete}
			<Button variant="danger" size="sm" onclick={onDelete}>
				Delete
			</Button>
		{/if}
	</div>

	<div class="provision-editor__text">
		<label for="text" class="provision-editor__label">Provision Text</label>
		<Textarea
			id="text"
			bind:value={text}
			placeholder="The provision content..."
			rows={6}
		/>
	</div>

	<div class="provision-editor__reasoning">
		<label for="reasoning" class="provision-editor__label">Reasoning (optional)</label>
		<Textarea
			id="reasoning"
			bind:value={reasoning}
			placeholder="Rationale for this provision..."
			rows={3}
		/>
	</div>
</div>

<style>
	.provision-editor {
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		padding: 1rem;
		margin-bottom: 1rem;
		background: var(--color-surface);
	}

	.provision-editor__header {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 1rem;
	}

	.provision-editor__number {
		flex: 0 0 8rem;
	}

	.provision-editor__title {
		flex: 1;
	}

	.provision-editor__text,
	.provision-editor__reasoning {
		margin-bottom: 1rem;
	}

	.provision-editor__text:last-child,
	.provision-editor__reasoning:last-child {
		margin-bottom: 0;
	}

	.provision-editor__label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
		color: var(--color-text-secondary);
	}
</style>
