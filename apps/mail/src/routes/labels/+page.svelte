<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';
	import { Button, Input, PageHeader } from '@bfs/ui';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { labels } = $derived(data);

	let editingUuid = $state<string | null>(null);
	let isCreating = $state(false);

	let labelName = $state('');
	let labelColor = $state('#3d5a80');

	const defaultColors = [
		'#3d5a80', // postal blue
		'#e07a5f', // terracotta
		'#81b29a', // sage green
		'#f2cc8f', // cream
		'#6a4c93', // purple
		'#c9ada7', // taupe
		'#457b9d', // steel blue
		'#e63946', // red
	];

	function startCreate() {
		isCreating = true;
		editingUuid = null;
		labelName = '';
		labelColor = defaultColors[0];
	}

	function startEdit(label: (typeof labels)[0]) {
		isCreating = false;
		editingUuid = label.uuid;
		labelName = label.name;
		labelColor = label.color || defaultColors[0];
	}

	function cancel() {
		isCreating = false;
		editingUuid = null;
		labelName = '';
		labelColor = defaultColors[0];
	}
</script>

<PageHeader title="Labels" />

<div class="labels-page">
	{#if form?.error}
		<div class="error-message">{form.error}</div>
	{/if}

	{#if form?.success}
		<div class="success-message">Label saved successfully!</div>
	{/if}

	{#if !isCreating && !editingUuid}
		<div class="labels-header">
			<p class="description">
				Organize your messages with personal labels. Labels are private and help you categorize threads.
			</p>
			<Button onclick={startCreate}>New Label</Button>
		</div>

		{#if labels.length === 0}
			<div class="empty-state">
				<p>No labels yet. Create your first label to organize your messages.</p>
			</div>
		{:else}
			<div class="labels-list">
				{#each labels as label}
					<div class="label-card">
						<div class="label-info">
							<div class="label-preview">
								<span class="label-color" style="background-color: {label.color || '#999'}"></span>
								<span class="label-name">{label.name}</span>
							</div>
							<span class="label-count">{label.thread_count} thread{label.thread_count !== 1 ? 's' : ''}</span>
						</div>
						<div class="label-actions">
							<Button size="sm" onclick={() => startEdit(label)}>Edit</Button>
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="uuid" value={label.uuid} />
								<Button
									type="submit"
									size="sm"
									variant="danger"
									onclick={(e) => {
										if (!confirm(`Delete label "${label.name}"?`)) e.preventDefault();
									}}
								>
									Delete
								</Button>
							</form>
							<a href="/labels/{label.uuid}">
								<Button size="sm" variant="secondary">View Threads</Button>
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="label-form">
			<h2>{isCreating ? 'Create Label' : 'Edit Label'}</h2>

			<form
				method="POST"
				action={isCreating ? '?/create' : '?/update'}
				use:enhance={() => {
					return ({ result, update }) => {
						if (result.type === 'success') {
							cancel();
						}
						update();
					};
				}}
			>
				{#if editingUuid}
					<input type="hidden" name="uuid" value={editingUuid} />
				{/if}

				<label>
					<span>Label Name</span>
					<Input
						type="text"
						name="name"
						placeholder="e.g., Important"
						bind:value={labelName}
						required
					/>
				</label>

				<label>
					<span>Color</span>
					<div class="color-picker">
						<input
							type="color"
							name="color"
							bind:value={labelColor}
							class="color-input"
						/>
						<div class="color-presets">
							{#each defaultColors as color}
								<button
									type="button"
									class="color-preset"
									style="background-color: {color}"
									class:color-preset--selected={labelColor === color}
									onclick={() => labelColor = color}
									title={color}
								></button>
							{/each}
						</div>
					</div>
				</label>

				<div class="form-actions">
					<Button type="submit">{isCreating ? 'Create Label' : 'Save Changes'}</Button>
					<Button type="button" variant="secondary" onclick={cancel}>Cancel</Button>
				</div>
			</form>
		</div>
	{/if}
</div>

<style>
	.labels-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.labels-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		gap: 2rem;
	}

	.description {
		color: var(--text-secondary);
		margin: 0;
		flex: 1;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-secondary);
	}

	.error-message,
	.success-message {
		padding: 1rem;
		margin-bottom: 1rem;
		border-radius: 4px;
	}

	.error-message {
		background: var(--error-background, #fee);
		color: var(--error-color, #c00);
		border: 1px solid var(--error-border, #fcc);
	}

	.success-message {
		background: var(--success-background, #efe);
		color: var(--success-color, #060);
		border: 1px solid var(--success-border, #cfc);
	}

	.labels-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.label-card {
		border: 1px solid var(--border-color, #ddd);
		border-radius: 6px;
		padding: 1.5rem;
		background: var(--card-background, white);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.label-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.label-preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.label-color {
		width: 20px;
		height: 20px;
		border-radius: 4px;
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.label-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.label-count {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-family: var(--font-mono);
	}

	.label-actions {
		display: flex;
		gap: 0.5rem;
	}

	.label-actions form {
		display: inline;
	}

	.label-form {
		background: var(--card-background, white);
		border: 1px solid var(--border-color, #ddd);
		border-radius: 6px;
		padding: 2rem;
	}

	.label-form h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
	}

	.label-form label {
		display: block;
		margin-bottom: 1.5rem;
	}

	.label-form label span {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.color-picker {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.color-input {
		width: 100px;
		height: 40px;
		border: 1px solid var(--border-color, #ddd);
		border-radius: 4px;
		cursor: pointer;
	}

	.color-presets {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.color-preset {
		width: 32px;
		height: 32px;
		border: 2px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.color-preset:hover {
		transform: scale(1.1);
	}

	.color-preset--selected {
		border-color: var(--text-primary);
		box-shadow: 0 0 0 2px white, 0 0 0 4px var(--text-primary);
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}
</style>
