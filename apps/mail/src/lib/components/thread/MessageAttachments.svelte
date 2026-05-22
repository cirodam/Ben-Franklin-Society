<script lang="ts">
	import { enhance } from '$app/forms';

	interface Attachment {
		uuid: string;
		filename: string;
		size_bytes: number;
	}

	let { attachments }: { attachments: Attachment[] } = $props();

	let savingAttachments = $state<Set<string>>(new Set());

	function handleSaveStart(uuid: string) {
		savingAttachments.add(uuid);
		savingAttachments = savingAttachments; // Trigger reactivity
	}

	function handleSaveEnd(uuid: string) {
		savingAttachments.delete(uuid);
		savingAttachments = savingAttachments; // Trigger reactivity
	}
</script>

<div class="message-attachments">
	<div class="attachments-header">📎 Attachments:</div>
	<div class="attachments-list">
		{#each attachments as attachment}
			<div class="attachment-item">
				<a href="/attachment/{attachment.uuid}" class="attachment-link" download>
					<span class="attachment-icon">📄</span>
					<span class="attachment-name">{attachment.filename}</span>
					<span class="attachment-size">({(attachment.size_bytes / 1024).toFixed(1)} KB)</span>
				</a>

				<form
					method="POST"
					action="?/save_to_library"
					use:enhance={() => {
						handleSaveStart(attachment.uuid);
						return async ({ result, update }) => {
							handleSaveEnd(attachment.uuid);
							if (result.type === 'success') {
								alert('Saved to your library!');
							} else {
								alert('Failed to save to library');
							}
							await update();
						};
					}}
				>
					<input type="hidden" name="attachment_uuid" value={attachment.uuid} />
					<button
						type="submit"
						class="save-library-btn"
						disabled={savingAttachments.has(attachment.uuid)}
					>
						{savingAttachments.has(attachment.uuid) ? '⏳ Saving...' : '📚 Save to Library'}
					</button>
				</form>
			</div>
		{/each}
	</div>
</div>

<style>
	.message-attachments {
		padding: var(--space-4) var(--space-6);
		border-top: 1px solid var(--border-faint);
		background: var(--background-secondary, #f9f9f9);
	}

	.attachments-header {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--ink-charcoal);
		margin-bottom: var(--space-2);
	}

	.attachments-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.attachment-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.attachment-link {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: white;
		border: 1px solid var(--border-base);
		border-radius: var(--radius-sm);
		text-decoration: none;
		color: var(--text-primary);
		transition: all 0.2s;
		flex: 1;
	}

	.attachment-link:hover {
		border-color: var(--postal-primary);
		background: var(--paper-light-blue);
	}

	.attachment-icon {
		font-size: var(--text-base);
	}

	.attachment-name {
		flex: 1;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.attachment-size {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--text-secondary);
	}

	.save-library-btn {
		padding: var(--space-2) var(--space-3);
		background: white;
		border: 1px solid var(--border-base);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.save-library-btn:hover:not(:disabled) {
		border-color: var(--postal-primary);
		background: var(--paper-light-blue);
	}

	.save-library-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
