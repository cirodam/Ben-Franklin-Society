<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Input, Select, Textarea } from '@bfs/ui';
	import VisibilitySelector from './VisibilitySelector.svelte';

	let { 
		action = '',
		method = 'POST',
		title = '',
		body = '',
		visibility = 'public',
		category = '',
		showVisibility = true,
		showCategory = true,
		submitLabel = 'Post',
		cancelLabel = 'Cancel',
		oncancel
	}: {
		action?: string;
		method?: string;
		title?: string;
		body?: string;
		visibility?: string;
		category?: string;
		showVisibility?: boolean;
		showCategory?: boolean;
		submitLabel?: string;
		cancelLabel?: string;
		oncancel?: () => void;
	} = $props();

	const categoryOptions = [
		{ value: '', label: 'General' },
		{ value: 'announcement', label: 'Announcement' },
		{ value: 'discussion', label: 'Discussion' },
		{ value: 'question', label: 'Question' },
		{ value: 'event', label: 'Event' },
		{ value: 'policy', label: 'Policy' }
	];
</script>

<form {method} {action} use:enhance class="bulletin-form">
	<Input
		name="title"
		placeholder="Post title"
		value={title}
		required
	/>
	
	<Textarea
		name="body"
		placeholder="What's on your mind?"
		rows={6}
		value={body}
		required
	/>
	
	{#if showVisibility}
		<VisibilitySelector value={visibility} />
	{/if}
	
	{#if showCategory}
		<Select 
			name="category" 
			label="Category" 
			value={category}
		>
			{#each categoryOptions as option}
				<option value={option.value} selected={option.value === category}>{option.label}</option>
			{/each}
		</Select>
	{/if}
	
	<div class="form-actions">
		{#if oncancel}
			<Button type="button" variant="secondary" onclick={oncancel}>
				{cancelLabel}
			</Button>
		{/if}
		<Button type="submit">{submitLabel}</Button>
	</div>
</form>

<style>
	.bulletin-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		background: var(--paper);
		padding: var(--space-6);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
	}
</style>
