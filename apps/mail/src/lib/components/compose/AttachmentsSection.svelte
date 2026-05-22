<script lang="ts">
	import { enhance } from '$app/forms';
	import LibraryFilePicker from './LibraryFilePicker.svelte';

	interface Attachment {
		uuid: string;
		filename: string;
		size_bytes: number;
	}

	interface LibraryFile {
		id: number;
		filename: string;
		size_bytes: number;
		mime_type: string | null;
		path: string;
	}

	let {
		attachments = [],
		draftUuid = null
	}: {
		attachments?: Attachment[];
		draftUuid?: string | null;
	} = $props();

	let showLibraryPicker = $state(false);
	let libraryFileIds = $state<number[]>([]);

	function handleLibraryFileSelect(file: LibraryFile) {
		libraryFileIds = [...libraryFileIds, file.id];
	}

	function removeLibraryFile(fileId: number) {
		libraryFileIds = libraryFileIds.filter((id) => id !== fileId);
	}
</script>

<div class="attachments-section">
	<label class="label">Attachments</label>

	{#if attachments.length > 0}
		<div class="attachment-list">
			{#each attachments as attachment}
				<div class="attachment-item">
					<span class="attachment-icon">📎</span>
					<span class="attachment-name">{attachment.filename}</span>
					<span class="attachment-size">{(attachment.size_bytes / 1024).toFixed(1)} KB</span>
					<form method="POST" action="?/delete_attachment" use:enhance>
						<input type="hidden" name="attachment_uuid" value={attachment.uuid} />
						{#if draftUuid}
							<input type="hidden" name="draft_uuid" value={draftUuid} />
						{/if}
						<button type="submit" class="attachment-delete" title="Remove attachment">×</button>
					</form>
				</div>
			{/each}
		</div>
	{/if}

	<div class="file-upload">
		<input
			type="file"
			name="attachments"
			id="file-input"
			multiple
			accept=".pdf,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
			class="file-input"
		/>
		<label for="file-input" class="file-label">
			<span class="file-icon">📎</span>
			Attach files (max 10MB per file, 25MB total)
		</label>

		<button
			type="button"
			class="library-btn"
			onclick={() => (showLibraryPicker = true)}
		>
			<span class="file-icon">📚</span>
			Attach from Library
		</button>
	</div>

	{#if libraryFileIds.length > 0}
		<div class="library-attachments">
			<p class="library-label">From Library:</p>
			{#each libraryFileIds as fileId}
				<div class="library-attachment-item">
					<span class="attachment-icon">📄</span>
					<span class="attachment-name">Library file #{fileId}</span>
					<input type="hidden" name="library_file_ids" value={fileId} />
					<button
						type="button"
						class="attachment-delete"
						onclick={() => removeLibraryFile(fileId)}
						title="Remove"
					>
						×
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showLibraryPicker}
	<LibraryFilePicker
		onSelect={handleLibraryFileSelect}
		onClose={() => (showLibraryPicker = false)}
	/>
{/if}

<style>
	.attachments-section {
		padding: var(--space-4);
		background: var(--background-secondary, #f9f9f9);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-base);
	}

	.label {
		display: block;
		margin-bottom: var(--space-2);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--ink-charcoal);
	}

	.attachment-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.attachment-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: white;
		border: 1px solid var(--border-base);
		border-radius: var(--radius-sm);
	}

	.attachment-icon {
		font-size: var(--text-lg);
	}

	.attachment-name {
		flex: 1;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.attachment-size {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--text-secondary);
	}

	.attachment-item form {
		display: inline;
	}

	.attachment-delete {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: var(--text-xl);
		padding: 0 var(--space-2);
		line-height: 1;
	}

	.attachment-delete:hover {

	.library-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: white;
		border: 1px solid var(--border-base);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.2s;
		margin-left: var(--space-2);
	}

	.library-btn:hover {
		border-color: var(--postal-primary);
		background: var(--paper-light-blue);
	}

	.library-attachments {
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--border-base);
	}

	.library-label {
		font-size: var(--text-sm);
		font-weight: 600;
		margin-bottom: var(--space-2);
		color: var(--text-secondary);
	}

	.library-attachment-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--paper-light-blue, #f0f8ff);
		border: 1px solid var(--border-base);
		border-radius: var(--radius-sm);
		margin-bottom: var(--space-2);
	}
		color: var(--error-color, #c00);
	}

	.file-upload {
		position: relative;
	}

	.file-input {
		position: absolute;
		opacity: 0;
		width: 0.1px;
		height: 0.1px;
	}

	.file-label {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: white;
		border: 1px solid var(--border-base);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.file-label:hover {
		border-color: var(--postal-primary);
		background: var(--paper-light-blue);
	}

	.file-icon {
		font-size: var(--text-base);
	}
</style>
