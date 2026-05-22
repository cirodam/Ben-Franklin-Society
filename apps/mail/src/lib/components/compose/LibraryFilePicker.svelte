<script lang="ts">
	import { onMount } from 'svelte';

	interface FileMetadata {
		id: number;
		filename: string;
		size_bytes: number;
		mime_type: string | null;
		path: string;
	}

	interface Bucket {
		id: number;
		bucket_key: string;
		owner_type: 'user' | 'association';
		owner_id: string;
		name?: string;
	}

	interface Props {
		onSelect: (file: FileMetadata) => void;
		onClose: () => void;
	}

	let { onSelect, onClose }: Props = $props();

	let buckets = $state<Bucket[]>([]);
	let files = $state<FileMetadata[]>([]);
	let selectedBucket = $state<string>('');
	let loading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');

	// Filter files by search query
	let filteredFiles = $derived(
		searchQuery
			? files.filter((f) => f.filename.toLowerCase().includes(searchQuery.toLowerCase()))
			: files
	);

	onMount(async () => {
		await loadBuckets();
	});

	async function loadBuckets() {
		try {
			const response = await fetch('/api/library/buckets');
			if (!response.ok) {
				throw new Error('Failed to load buckets');
			}
			const data = await response.json();
			buckets = data.buckets || [];

			if (buckets.length > 0) {
				selectedBucket = buckets[0].bucket_key;
				await loadFiles(selectedBucket);
			}

			loading = false;
		} catch (err: any) {
			error = err.message;
			loading = false;
		}
	}

	async function loadFiles(bucketKey: string) {
		try {
			error = null;
			const response = await fetch(`/api/library/buckets/${bucketKey}/files`);
			if (!response.ok) {
				throw new Error('Failed to load files');
			}
			const data = await response.json();
			files = data.files || [];
		} catch (err: any) {
			error = err.message;
		}
	}

	async function handleBucketChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedBucket = target.value;
		await loadFiles(selectedBucket);
	}

	function handleFileSelect(file: FileMetadata) {
		onSelect(file);
		onClose();
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div class="library-picker-overlay" onclick={onClose} role="presentation">
	<div
		class="library-picker-modal"
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-labelledby="library-picker-title"
	>
		<div class="modal-header">
			<h3 id="library-picker-title" class="t-label">Attach from Library</h3>
			<button type="button" class="close-btn" onclick={onClose} aria-label="Close">×</button>
		</div>

		<div class="modal-body">
			{#if loading}
				<p class="loading-msg">Loading your files...</p>
			{:else if error}
				<p class="error-msg">Error: {error}</p>
			{:else if buckets.length === 0}
				<p class="empty-msg">No library buckets available.</p>
			{:else}
				<div class="bucket-selector">
					<label for="bucket-select" class="t-label">Select Bucket:</label>
					<select id="bucket-select" value={selectedBucket} onchange={handleBucketChange}>
						{#each buckets as bucket}
							<option value={bucket.bucket_key}>
								{bucket.name || bucket.bucket_key}
							</option>
						{/each}
					</select>
				</div>

				<div class="search-box">
					<input
						type="text"
						placeholder="Search files..."
						bind:value={searchQuery}
						class="search-input"
					/>
				</div>

				{#if filteredFiles.length === 0}
					<p class="empty-msg">
						{searchQuery ? 'No files match your search.' : 'No files in this bucket.'}
					</p>
				{:else}
					<div class="file-list">
						{#each filteredFiles as file}
							<button
								type="button"
								class="file-item"
								onclick={() => handleFileSelect(file)}
							>
								<span class="file-icon">📄</span>
								<div class="file-info">
									<div class="file-name">{file.filename}</div>
									<div class="file-meta t-numeric">
										{formatBytes(file.size_bytes)}
										{#if file.mime_type}
											• {file.mime_type}
										{/if}
									</div>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

<style>
	.library-picker-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.library-picker-modal {
		background: var(--paper, #ffffff);
		border: 2px solid var(--border, rgba(0, 0, 0, 0.2));
		width: 100%;
		max-width: 600px;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border, rgba(0, 0, 0, 0.2));
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.25rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 2rem;
		line-height: 1;
		cursor: pointer;
		color: var(--ink, #000);
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: var(--tint-gold, rgba(139, 105, 20, 0.1));
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.bucket-selector {
		margin-bottom: 1rem;
	}

	.bucket-selector label {
		display: block;
		margin-bottom: 0.5rem;
	}

	.bucket-selector select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--border, rgba(0, 0, 0, 0.2));
		background: var(--paper, #fff);
		font-size: 1rem;
	}

	.search-box {
		margin-bottom: 1rem;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--border, rgba(0, 0, 0, 0.2));
		background: var(--paper, #fff);
		font-size: 1rem;
	}

	.file-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.file-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border: 1px solid var(--border, rgba(0, 0, 0, 0.2));
		background: var(--paper, #fff);
		cursor: pointer;
		text-align: left;
		width: 100%;
	}

	.file-item:hover {
		background: var(--tint-gold, rgba(139, 105, 20, 0.1));
	}

	.file-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.file-info {
		flex: 1;
		min-width: 0;
	}

	.file-name {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-meta {
		font-size: 0.875rem;
		color: var(--ink, #000);
		opacity: 0.7;
		margin-top: 0.25rem;
	}

	.loading-msg,
	.error-msg,
	.empty-msg {
		text-align: center;
		padding: 2rem;
		color: var(--ink, #000);
	}

	.error-msg {
		color: var(--danger, #c00);
	}
</style>
