<script lang="ts">
	import { enhance } from '$app/forms';
	import { GoverningDocument, Button } from '@bfs/ui';
	import type { PageData } from './$types.js';
	import type { GoverningDocument as GoverningDocType } from '@bfs/types';

	let { data }: { data: PageData } = $props();

	// Track the edited document state
	let editedDoc = $state<GoverningDocType>(structuredClone(data.document));
	let isSubmitting = $state(false);

	// Handle changes from the unified component
	function handleChange(updates: Partial<GoverningDocType>) {
		editedDoc = { ...editedDoc, ...updates };
	}

	// Prepare form data for submission
	function prepareFormData() {
		return {
			title: editedDoc.title,
			seniority: editedDoc.content.seniority,
			preamble: editedDoc.content.preamble || '',
			articles: JSON.stringify(editedDoc.content.articles)
		};
	}
</script>

<svelte:head>
	<style>
		:global(.app-shell__main) {
			background: linear-gradient(135deg, #e8e4d9 0%, #d4cfc0 100%) !important;
		}
		:global(.app-shell__content) {
			padding: 0 !important;
			max-width: none !important;
		}
	</style>
</svelte:head>

<div class="page">
	<header class="header">
		<h1 class="page-title">Edit Governing Document</h1>
		<p class="subtitle">{data.document.title}</p>
	</header>

	<form 
		method="POST" 
		class="editor-form"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
			};
		}}
	>
		{#each Object.entries(prepareFormData()) as [key, value]}
			<input type="hidden" name={key} value={value} />
		{/each}

		<div class="document-container">
			<GoverningDocument 
				doc={editedDoc}
				mode="edit"
				onChange={handleChange}
			/>
		</div>

		<div class="form-actions">
			<a href="/library/{data.document.slug}" class="btn-secondary">Cancel</a>
			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Saving...' : 'Save Changes'}
			</Button>
		</div>
	</form>
</div>

<style>
	.page {
		min-height: 100vh;
		padding: var(--space-8, 2rem);
	}

	.header {
		text-align: center;
		margin-bottom: var(--space-8);
		max-width: 900px;
		margin-left: auto;
		margin-right: auto;
	}

	.page-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 400;
		color: var(--ink, #151c1a);
		margin: 0 0 var(--space-2, 0.5rem) 0;
	}

	.subtitle {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base, 1rem);
		color: var(--ink-mid, #5a5a50);
		margin: 0;
		font-style: italic;
	}

	.editor-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6, 1.5rem);
	}

	.document-container {
		display: flex;
		justify-content: center;
	}

	.form-actions {
		display: flex;
		gap: var(--space-3, 0.75rem);
		justify-content: center;
		padding: var(--space-6, 1.5rem) 0;
		max-width: 900px;
		margin: 0 auto;
	}

	.btn-secondary {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm, 0.875rem);
		letter-spacing: 0.08em;
		padding: var(--space-3, 0.75rem) var(--space-5, 1.25rem);
		border: 2px solid var(--border, rgba(45, 90, 79, 0.2));
		border-radius: 4px;
		color: var(--ink-mid, #5a5a50);
		background: white;
		text-decoration: none;
		display: inline-block;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary:hover {
		background: rgba(45, 90, 79, 0.05);
		border-color: var(--accent, #2d5a4f);
	}
</style>
