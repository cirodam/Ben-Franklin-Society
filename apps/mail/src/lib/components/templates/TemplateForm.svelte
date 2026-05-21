<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Input } from '@bfs/ui';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';

	let {
		isCreating,
		editingUuid,
		templateName = $bindable(''),
		templateSubject = $bindable(''),
		templateBody = $bindable(''),
		onCancel
	}: {
		isCreating: boolean;
		editingUuid: string | null;
		templateName: string;
		templateSubject: string;
		templateBody: string;
		onCancel: () => void;
	} = $props();
</script>

<div class="template-form">
	<h2>{isCreating ? 'Create Template' : 'Edit Template'}</h2>

	<form
		method="POST"
		action={isCreating ? '?/create' : '?/update'}
		use:enhance={() => {
			return ({ result, update }) => {
				if (result.type === 'success') {
					onCancel();
				}
				update();
			};
		}}
	>
		{#if editingUuid}
			<input type="hidden" name="uuid" value={editingUuid} />
		{/if}

		<label>
			<span>Template Name</span>
			<Input
				type="text"
				name="name"
				placeholder="e.g., Weekly Update"
				bind:value={templateName}
				required
			/>
		</label>

		<label>
			<span>Default Subject</span>
			<Input
				type="text"
				name="subject"
				placeholder="e.g., Weekly Update - {{date}}"
				bind:value={templateSubject}
				required
			/>
		</label>

		<label>
			<span>Default Body</span>
			<MarkdownEditor name="body" bind:value={templateBody} required />
		</label>

		<div class="form-actions">
			<Button type="submit">{isCreating ? 'Create Template' : 'Save Changes'}</Button>
			<Button type="button" variant="secondary" onclick={onCancel}>Cancel</Button>
		</div>
	</form>
</div>

<style>
	.template-form {
		background: var(--card-background, white);
		border: 1px solid var(--border-color, #ddd);
		border-radius: 6px;
		padding: 2rem;
	}

	.template-form h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
	}

	.template-form label {
		display: block;
		margin-bottom: 1.5rem;
	}

	.template-form label span {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}
</style>
