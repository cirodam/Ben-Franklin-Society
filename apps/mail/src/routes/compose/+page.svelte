<script lang="ts">
	import { enhance } from '$app/forms';
	import { PageHeader, Alert, Input, Button } from '@bfs/ui';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { draft, prefill, signature, templates, attachments, contactGroups } = $derived(data);

	// Pre-fill values from a draft, from a failed action, or from URL prefill (reply/forward).
	const prefillTo = $derived(
		form?.to_raw ??
		prefill?.to_raw ??
		(draft ? draft.recipients.filter((r) => r.type === 'to').map((r) => `@${r.recipient_handle_cache}`).join(', ') : '')
	);
	const prefillCc = $derived(
		form?.cc_raw ??
		(draft ? draft.recipients.filter((r) => r.type === 'cc').map((r) => `@${r.recipient_handle_cache}`).join(', ') : '')
	);
	const prefillBcc = $derived(
		form?.bcc_raw ??
		(draft ? draft.recipients.filter((r) => r.type === 'bcc').map((r) => `@${r.recipient_handle_cache}`).join(', ') : '')
	);
	const prefillSubject = $derived(form?.subject ?? prefill?.subject ?? draft?.subject ?? '');
	const prefillBody    = $derived(form?.body    ?? prefill?.body    ?? draft?.body    ?? (prefill ? '' : signature));

	// Template selection state
	let selectedTemplate = $state<string>('');
	let toValue = $state(prefillTo);
	let ccValue = $state(prefillCc);
	let bccValue = $state(prefillBcc);
	let subjectValue = $state(prefillSubject);
	let bodyValue = $state(prefillBody);

	// Watch for template changes and apply template content
	$effect(() => {
		if (selectedTemplate) {
			const template = templates.find((t) => t.uuid === selectedTemplate);
			if (template) {
				subjectValue = template.subject;
				bodyValue = template.body;
			}
		}
	});

	// Autosave functionality
	let lastSavedAt = $state<Date | null>(null);
	let isSaving = $state(false);
	let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

	// Trigger autosave when form content changes
	$effect(() => {
		// Watch for changes in form fields
		toValue;
		ccValue;
		bccValue;
		subjectValue;
		bodyValue;

		// Clear existing timer
		if (autosaveTimer) {
			clearTimeout(autosaveTimer);
		}

		// Only autosave if there's content (at least a subject or body)
		if (!subjectValue && !bodyValue) return;

		// Set new timer to save after 3 seconds of inactivity
		autosaveTimer = setTimeout(async () => {
			await autosave();
		}, 3000);

		// Cleanup on unmount
		return () => {
			if (autosaveTimer) clearTimeout(autosaveTimer);
		};
	});

	async function autosave() {
		if (isSaving) return;

		isSaving = true;
		try {
			const formData = new FormData();
			if (draft) formData.append('draft_uuid', draft.uuid);
			formData.append('to', toValue);
			formData.append('cc', ccValue);
			formData.append('bcc', bccValue);
			formData.append('subject', subjectValue);
			formData.append('body', bodyValue);
			formData.append('content_type', 'text/markdown');

			const response = await fetch('?/autosave', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				const result = await response.json();
				lastSavedAt = new Date();
				
				// Update URL if this is a new draft
				if (!draft && result?.draft_uuid) {
					const url = new URL(window.location.href);
					url.searchParams.set('draft', result.draft_uuid);
					window.history.replaceState({}, '', url);
				}
			}
		} catch (error) {
			console.error('Autosave failed:', error);
		} finally {
			isSaving = false;
		}
	}

	function formatSaveTime(date: Date | null): string {
		if (!date) return '';
		const now = new Date();
		const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
		
		if (diffSeconds < 10) return 'just now';
		if (diffSeconds < 60) return `${diffSeconds}s ago`;
		const diffMinutes = Math.floor(diffSeconds / 60);
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		const diffHours = Math.floor(diffMinutes / 60);
		return `${diffHours}h ago`;
	}
</script>

<div class="page">
	<PageHeader title="New Message" />

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	<form method="POST" class="compose-form" enctype="multipart/form-data">
		<!-- Hidden draft uuid if editing a draft -->
		{#if draft}
			<input type="hidden" name="draft_uuid" value={draft.uuid} />
		{/if}

		<!-- Autosave indicator -->
		{#if isSaving}
			<div class="autosave-indicator autosave-indicator--saving">
				💾 Saving draft...
			</div>
		{:else if lastSavedAt}
			<div class="autosave-indicator autosave-indicator--saved">
				✓ Draft saved {formatSaveTime(lastSavedAt)}
			</div>
		{/if}

		{#if templates.length > 0}
			<div class="template-selector">
				<label for="template-select" class="label">Use Template (optional)</label>
				<select id="template-select" bind:value={selectedTemplate} class="template-select">
					<option value="">-- No template --</option>
					{#each templates as template}
						<option value={template.uuid}>{template.name}</option>
					{/each}
				</select>
			</div>
		{/if}

		<Input
			id="to"
			name="to"
			label="To"
			placeholder="@handle, @another"
			bind:value={toValue}
			required
		/>

		{#if contactGroups.length > 0}
			<div class="contact-groups-hint">
				<strong>Available Groups:</strong>
				{#each contactGroups as group, i}
					<button
						type="button"
						class="group-pill"
						onclick={() => {
							const currentValue = toValue.trim();
							toValue = currentValue ? `${currentValue}, ${group.name}` : group.name;
						}}
						title="Click to add to To field"
					>
						{group.name} ({group.members.length})
					</button>
					{#if i < contactGroups.length - 1}{' '}{/if}
				{/each}
			</div>
		{/if}

		<Input
			id="cc"
			name="cc"
			label="Cc (optional)"
			placeholder="@handle"
			bind:value={ccValue}
		/>

		<Input
			id="bcc"
			name="bcc"
			label="Bcc (optional)"
			placeholder="@handle"
			bind:value={bccValue}
		/>

		<Input
			id="subject"
			name="subject"
			label="Subject"
			placeholder="Subject"
			bind:value={subjectValue}
			required
		/>

		<!-- Hidden field for content type -->
		<input type="hidden" name="content_type" value="text/markdown" />

		<div>
			<label class="label">Message</label>
			<MarkdownEditor
				name="body"
				bind:value={bodyValue}
				rows={12}
				placeholder="Write your message…"
				required
			/>
		</div>

		<!-- Attachments -->
		<div class="attachments-section">
			<label class="label">Attachments</label>
			
			{#if attachments && attachments.length > 0}
				<div class="attachment-list">
					{#each attachments as attachment}
						<div class="attachment-item">
							<span class="attachment-icon">📎</span>
							<span class="attachment-name">{attachment.filename}</span>
							<span class="attachment-size">
								{(attachment.size_bytes / 1024).toFixed(1)} KB
							</span>
							<form method="POST" action="?/delete_attachment" use:enhance>
								<input type="hidden" name="attachment_uuid" value={attachment.uuid} />
								{#if draft}
									<input type="hidden" name="draft_uuid" value={draft.uuid} />
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
			</div>
		</div>

		<div class="form-actions">
				<Button type="submit" formaction="?/save_draft" variant="secondary">Save Draft</Button>
				<Button type="submit" formaction="?/send">Send</Button>
			</div>
		</form>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.compose-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		background: white;
		border: 2px solid var(--border-strong);
		border-radius: var(--radius-lg);
		padding: var(--space-7);
		box-shadow: 0 2px 8px rgba(43, 76, 126, 0.08);
	}

	.label {
		display: block;
		margin-bottom: var(--space-2);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--ink-charcoal);
	}

	.autosave-indicator {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		text-align: center;
		transition: all 0.3s;
	}

	.autosave-indicator--saving {
		background: var(--paper-light-blue);
		color: var(--postal-primary);
		border: 1px solid var(--postal-primary);
	}

	.autosave-indicator--saved {
		background: var(--success-background, #efe);
		color: var(--success-color, #060);
		border: 1px solid var(--success-border, #cfc);
	}

	.contact-groups-hint {
		padding: var(--space-3);
		background: var(--parchment);
		border: 1px solid var(--border-base);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		margin-top: -var(--space-3);
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.contact-groups-hint strong {
		color: var(--ink-charcoal);
		margin-right: var(--space-1);
	}

	.group-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		background: white;
		border: 1px solid var(--postal-blue-mid);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--postal-blue-dark);
		cursor: pointer;
		transition: all 0.2s;
	}

	.group-pill:hover {
		background: var(--paper-light-blue);
		border-color: var(--postal-blue);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.template-selector {
		padding: var(--space-4);
		background: var(--paper-light-blue);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-base);
	}

	.template-select {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--border-base);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-base);
		background: white;
		cursor: pointer;
	}

	.template-select:focus {
		outline: 2px solid var(--postal-primary);
		outline-offset: 2px;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		margin-top: var(--space-2);
	}

	.attachments-section {
		padding: var(--space-4);
		background: var(--background-secondary, #f9f9f9);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-base);
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
