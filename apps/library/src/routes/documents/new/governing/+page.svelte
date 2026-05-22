<script lang="ts">
	import type { PageData } from './$types.js';
	import { GoverningDocEditor } from '@bfs/ui';
	import type { GoverningDocument } from '@bfs/types';
	import { goto } from '$app/navigation';

	const { data } = $props<{ data: PageData }>();

	// Initialize empty governing document
	let document = $state<GoverningDocument>({
		uuid: crypto.randomUUID(),
		type: 'governing',
		slug: '',
		document_id: null,
		version: 1,
		title: '',
		owner_uuid: data.session.acting_as_uuid,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		content: {
			status: 'draft',
			seniority: 'bylaw',
			articles: [],
			preamble: undefined
		}
	});

	let selectedBucket = $state(data.buckets[0]?.bucket_key || '');
	let saving = $state(false);
	let error = $state<string | null>(null);

	function handleUpdate(updates: Partial<GoverningDocument>) {
		document = { ...document, ...updates, updated_at: new Date().toISOString() };
	}

	async function handleSave() {
		if (!selectedBucket) {
			error = 'Please select a bucket';
			return;
		}

		if (!document.title) {
			error = 'Please enter a title';
			return;
		}

		if (!document.slug) {
			// Auto-generate slug from title
			document.slug = document.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
		}

		saving = true;
		error = null;

		try {
			const formData = new FormData();
			formData.append('bucket_key', selectedBucket);
			formData.append('document', JSON.stringify(document));

			const response = await fetch('', {
				method: 'POST',
				body: formData
			});

			if (response.redirected) {
				window.location.href = response.url;
			} else {
				const result = await response.json();
				if (!result.success) {
					error = result.error || 'Failed to save document';
				}
			}
		} catch (err) {
			error = 'Failed to save document';
			console.error(err);
		} finally {
			saving = false;
		}
	}
</script>

<div class="page">
	<div class="page__header">
		<h1>Create New Governing Document</h1>
		<p>Draft a charter, constitution, bylaw, or other governing document</p>
	</div>

	<div class="page__content">
		<div class="form-section">
			<label for="bucket">Save to Bucket</label>
			<select id="bucket" bind:value={selectedBucket} required>
				<option value="">Select a bucket...</option>
				{#each data.buckets as bucket}
					<option value={bucket.bucket_key}>{bucket.name || bucket.bucket_key}</option>
				{/each}
			</select>
		</div>

		{#if error}
			<div class="alert alert--danger">
				{error}
			</div>
		{/if}

		<GoverningDocEditor {document} onUpdate={handleUpdate} />

		<div class="actions">
			<button
				type="button"
				class="btn btn--secondary"
				onclick={() => goto('/')}
			>
				Cancel
			</button>
			<button
				type="button"
				class="btn btn--primary"
				onclick={handleSave}
				disabled={saving}
			>
				{saving ? 'Saving...' : 'Save Document'}
			</button>
		</div>
	</div>
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page__header {
		margin-bottom: 2rem;
	}

	.page__header h1 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
	}

	.page__header p {
		color: var(--color-text-secondary);
		margin: 0;
	}

	.page__content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-section label {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.form-section select {
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		font-size: 1rem;
	}

	.alert {
		padding: 1rem;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
	}

	.alert--danger {
		background-color: #fee;
		border: 1px solid #fcc;
		color: #c00;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		padding-top: 2rem;
		border-top: 1px solid var(--color-border);
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
	}

	.btn--primary {
		background-color: var(--color-primary);
		color: white;
	}

	.btn--primary:hover:not(:disabled) {
		background-color: var(--color-primary-dark);
	}

	.btn--primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn--secondary {
		background-color: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn--secondary:hover {
		background-color: var(--color-background);
	}
</style>
