<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Input, PageHeader, Textarea } from '@bfs/ui';
	import type { ActionData } from './$types.js';

	let { form }: { form: ActionData } = $props();

	let selectedColor = $state('#fef3c7'); // Default: light yellow

	const presetColors = [
		{ name: 'Yellow', value: '#fef3c7' },
		{ name: 'Pink', value: '#fce7f3' },
		{ name: 'Blue', value: '#dbeafe' },
		{ name: 'Green', value: '#d1fae5' },
		{ name: 'Purple', value: '#e9d5ff' },
		{ name: 'Orange', value: '#fed7aa' },
		{ name: 'Red', value: '#fee2e2' },
		{ name: 'Gray', value: '#e5e7eb' },
	];
</script>

<div class="page">
	<PageHeader title="New Notice" />

	<form method="POST" use:enhance class="form">
		{#if form?.error}
			<Alert variant="danger">{form.error}</Alert>
		{/if}

		<div class="form-group">
			<label for="title">Title</label>
			<Input
				id="title"
				name="title"
				required
				placeholder="What's this about?"
			/>
		</div>

		<div class="form-group">
			<label for="body">Message</label>
			<Textarea
				id="body"
				name="body"
				required
				rows={8}
				placeholder="Write your notice here..."
			/>
		</div>

		<div class="form-group">
			<div class="color-section-label">Card Color</div>
			<div class="color-picker">
				<div class="preset-colors">
					{#each presetColors as preset}
						<button
							type="button"
							class="color-preset"
							class:selected={selectedColor === preset.value}
							style="background-color: {preset.value}"
							title={preset.name}
							onclick={() => selectedColor = preset.value}
						>
							{#if selectedColor === preset.value}
								<span class="checkmark">✓</span>
							{/if}
						</button>
					{/each}
				</div>
				<div class="custom-color">
					<label for="color" class="color-label">Or pick custom:</label>
					<input
						type="color"
						id="color"
						name="color"
						bind:value={selectedColor}
						class="color-input"
					/>
					<span class="color-value">{selectedColor}</span>
				</div>
			</div>
		</div>

		<div class="form-preview" style="background-color: {selectedColor}">
			<div class="preview-label">Preview</div>
			<div class="preview-content">
				<h3>Your title will appear here</h3>
				<p>Your message text will appear here in this color.</p>
			</div>
		</div>

		<div class="form-actions">
			<Button href="/bulletin" variant="secondary">Cancel</Button>
			<Button type="submit">Post Notice</Button>
		</div>
	</form>
</div>

<style>
	.page {
		max-width: 700px;
		margin: 0 auto;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-group label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	.color-section-label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	.color-picker {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.preset-colors {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.color-preset {
		width: 48px;
		height: 48px;
		border: 2px solid var(--color-border);
		border-radius: var(--radius);
		cursor: pointer;
		position: relative;
		transition: transform 0.2s, border-color 0.2s;
	}

	.color-preset:hover {
		transform: scale(1.05);
	}

	.color-preset.selected {
		border-color: var(--color-accent);
		border-width: 3px;
	}

	.checkmark {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: var(--text-lg);
		font-weight: bold;
		color: rgba(0, 0, 0, 0.7);
	}

	.custom-color {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.color-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.color-input {
		width: 60px;
		height: 40px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		cursor: pointer;
	}

	.color-value {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.form-preview {
		padding: var(--space-5);
		border-radius: var(--radius-lg);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		position: relative;
	}

	.preview-label {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: rgba(0, 0, 0, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.preview-content h3 {
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		margin: 0 0 var(--space-2);
		color: rgba(0, 0, 0, 0.9);
	}

	.preview-content p {
		font-size: var(--text-sm);
		margin: 0;
		color: rgba(0, 0, 0, 0.7);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
	}
</style>
