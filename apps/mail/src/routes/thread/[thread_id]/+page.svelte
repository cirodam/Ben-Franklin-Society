<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Card, Textarea, formatDateTime } from '@bfs/ui';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { messages, actingAs, signature, messageAttachments, availableLabels, threadLabels } = $derived(data);

	const root = $derived(messages[0]);
	const last = $derived(messages[messages.length - 1]);

	let replyBody = $state(signature || '');

	// Track which message has its report form open (by uuid or null).
	let reportOpenFor = $state<string | null>(null);

	// Quote parent toggle
	let quoteParent = $state(false);

	const quotedText = $derived(
		last
			? `\nOn ${formatDateTime(last.sent_at)}, @${last.from_handle_cache} wrote:\n> ${last.body.replace(/\n/g, '\n> ')}\n\n${signature}`
			: signature
	);

	const replyBodyWithQuote = $derived(quoteParent ? quotedText : (replyBody || signature));

	// Type assertion to work around ActionData inference issue
	const formData = $derived(form as any);
</script>

<div class="page">
	<div class="page-header">
		<a href="/" class="back-link">← Inbox</a>
		<div class="header-row">
			<h1>{root?.subject ?? ''}</h1>
			<div class="thread-actions">
				<form method="POST" action="?/archive" use:enhance>
					<button type="submit" class="thread-action-btn">📦 Archive</button>
				</form>
				<form method="POST" action="?/unarchive" use:enhance>
					<button type="submit" class="thread-action-btn">↩ Move to Inbox</button>
				</form>
			</div>
		</div>
	</div>

	<!-- Labels Section -->
	{#if availableLabels.length > 0}
		<div class="labels-section">
			<div class="labels-header">
				<span class="labels-title">Labels:</span>
				{#if threadLabels.length === 0}
					<span class="no-labels">None</span>
				{/if}
			</div>
			<div class="labels-content">
				<div class="current-labels">
					{#each threadLabels as label}
						<form method="POST" action="?/remove_label" use:enhance class="label-tag">
							<input type="hidden" name="label_uuid" value={label.uuid} />
							<span class="label-color" style="background-color: {label.color || '#999'}"></span>
							<span class="label-name">{label.name}</span>
							<button type="submit" class="label-remove" title="Remove label">×</button>
						</form>
					{/each}
				</div>
				<details class="add-label-dropdown">
					<summary class="add-label-btn">+ Add Label</summary>
					<div class="add-label-menu">
						{#each availableLabels.filter((l) => !threadLabels.some((tl) => tl.uuid === l.uuid)) as label}
							<form method="POST" action="?/add_label" use:enhance>
								<input type="hidden" name="label_uuid" value={label.uuid} />
								<button type="submit" class="label-option">
									<span class="label-color" style="background-color: {label.color || '#999'}"></span>
									<span class="label-name">{label.name}</span>
								</button>
							</form>
						{/each}
						{#if availableLabels.filter((l) => !threadLabels.some((tl) => tl.uuid === l.uuid)).length === 0}
							<div class="no-more-labels">All labels applied</div>
						{/if}
					</div>
				</details>
			</div>
		</div>
	{/if}

	<div class="message-list">
		{#each messages as msg}
			<div class="message-card" class:message-card--sent={msg.recipient_type === null}>
				<div class="message-card__header">
					<div class="message-card__from">
						<span class="handle">@{msg.from_handle_cache}</span>
						<span class="timestamp">{formatDateTime(msg.sent_at)}</span>
					</div>
					<div class="message-card__recipients">
						{#if msg.recipients.filter((r) => r.type === 'to').length > 0}
							<div class="recipient-line">
								<span class="recipient-label">To:</span>
								{#each msg.recipients.filter((r) => r.type === 'to') as r, i}
									<span>@{r.recipient_handle_cache}{i < msg.recipients.filter((r) => r.type === 'to').length - 1 ? ', ' : ''}</span>
								{/each}
							</div>
						{/if}
						{#if msg.recipients.filter((r) => r.type === 'cc').length > 0}
							<div class="recipient-line">
								<span class="recipient-label">CC:</span>
								{#each msg.recipients.filter((r) => r.type === 'cc') as r, i}
									<span>@{r.recipient_handle_cache}{i < msg.recipients.filter((r) => r.type === 'cc').length - 1 ? ', ' : ''}</span>
								{/each}
							</div>
						{/if}
						{#if msg.from_principal_uuid === actingAs && msg.recipients.filter((r) => r.type === 'bcc').length > 0}
							<div class="recipient-line">
								<span class="recipient-label">BCC:</span>
								{#each msg.recipients.filter((r) => r.type === 'bcc') as r, i}
									<span>@{r.recipient_handle_cache}{i < msg.recipients.filter((r) => r.type === 'bcc').length - 1 ? ', ' : ''}</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<div class="message-card__body">
					{#if msg.content_type === 'text/markdown'}
						<MarkdownRenderer markdown={msg.body} />
					{:else}
						<div class="plain-text">{msg.body}</div>
					{/if}
				</div>
			{#if messageAttachments[msg.uuid] && messageAttachments[msg.uuid].length > 0}
				<div class="message-attachments">
					<div class="attachments-header">📎 Attachments:</div>
					<div class="attachments-list">
						{#each messageAttachments[msg.uuid] as attachment}
							<a href="/attachment/{attachment.uuid}" class="attachment-link" download>
								<span class="attachment-icon">📄</span>
								<span class="attachment-name">{attachment.filename}</span>
								<span class="attachment-size">
									({(attachment.size_bytes / 1024).toFixed(1)} KB)
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
				<div class="message-card__actions">
					<!-- Reply / Forward links (open compose in a new context) -->
					<a href="/compose?reply_to={msg.uuid}" class="action-btn">Reply</a>
					<a href="/forward/{msg.uuid}"  class="action-btn">Forward</a>

					{#if msg.recipient_type !== null}
						<!-- Trash / Restore for received messages -->
						{#if msg.trashed_at}
							<form method="POST" action="?/restore" use:enhance>
								<input type="hidden" name="message_uuid" value={msg.uuid} />
								<button type="submit" class="action-btn">Restore</button>
							</form>
						{:else}
							<form method="POST" action="?/trash" use:enhance>
								<input type="hidden" name="message_uuid" value={msg.uuid} />
								<button type="submit" class="action-btn action-btn--muted">Move to Trash</button>
							</form>
						{/if}

						<!-- Report -->
						{#if formData?.reported && formData?.reported_uuid === msg.uuid}
							<span class="action-confirmed">Reported</span>
						{:else}
							<button
								type="button"
								class="action-btn action-btn--danger"
								onclick={() => { reportOpenFor = reportOpenFor === msg.uuid ? null : msg.uuid; }}
							>
								Report
							</button>
						{/if}
					{/if}
				</div>
				{#if reportOpenFor === msg.uuid}
					<div class="report-panel">
						{#if formData?.report_error && formData?.reported_uuid === msg.uuid}
							<Alert variant="danger">{formData.report_error}</Alert>
						{/if}
						<form method="POST" action="?/report" use:enhance={() => {
							return ({ result, update }) => {
								if (result.type === 'success') reportOpenFor = null;
								update();
							};
						}}>
							<input type="hidden" name="message_uuid" value={msg.uuid} />
							<Textarea
								name="reason"
								placeholder="Describe why you're reporting this message…"
								rows={3}
								required
							/>
							<div class="report-panel__footer">
								<Button
									type="button"
									variant="secondary"
									onclick={() => { reportOpenFor = null; }}
								>Cancel</Button>
								<Button type="submit" variant="danger">Submit Report</Button>
							</div>
						</form>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Inline quick-reply form (replies to the last message) -->
	<Card>
		<div class="reply-box">
			<h2 class="reply-box__title">Reply</h2>

			{#if formData?.reply_error}
				<Alert variant="danger">{formData.reply_error}</Alert>
			{/if}

			<form method="POST" action="?/reply" use:enhance={() => {
				return ({ result, update }) => {
					if (result.type === 'success') {
						replyBody = signature || '';
						quoteParent = false;
					}
					update();
				};
			}}>
				<input type="hidden" name="reply_to_id" value={last?.uuid ?? ''} />
				<input type="hidden" name="content_type" value="text/markdown" />
				
				<div class="quote-toggle">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={quoteParent} />
						<span>Quote parent message</span>
					</label>
				</div>

				<input type="hidden" name="body" value={replyBodyWithQuote} />
				<Textarea
					placeholder="Write your reply…"
					rows={5}
					bind:value={replyBody}
					required
				/>
				<div class="reply-box__footer">
					<Button type="submit" variant="primary" disabled={!replyBody.trim()}>Send Reply</Button>
				</div>
			</form>
		</div>
	</Card>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
	}

	.thread-actions {
		display: flex;
		gap: var(--space-2);
	}

	.thread-action-btn {
		padding: var(--space-2) var(--space-4);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		background: var(--parchment);
		color: var(--postal-blue-dark);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.thread-action-btn:hover {
		background: var(--postal-blue-light);
		border-color: var(--postal-blue-mid);
	}

	.back-link {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--postal-blue);
		text-decoration: none;
		transition: color 0.2s;
	}
	.back-link:hover {
		color: var(--postal-blue-mid);
		text-decoration: underline;
	}

	.page-header h1 {
		margin: 0;
		font-family: var(--font-sans);
		font-size: var(--text-2xl);
		font-weight: 600;
		color: var(--ink-navy);
		line-height: 1.3;
	}

	.message-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.labels-section {
		padding: var(--space-4) var(--space-6);
		background: var(--parchment);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-4);
	}

	.labels-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.labels-title {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--ink-charcoal);
	}

	.no-labels {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--text-secondary);
		font-style: italic;
	}

	.labels-content {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.current-labels {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.label-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		background: white;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-xs);
	}

	.label-color {
		width: 12px;
		height: 12px;
		border-radius: 2px;
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.label-name {
		font-weight: 500;
		color: var(--text-primary);
	}

	.label-remove {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: var(--text-base);
		padding: 0 0.125rem;
		line-height: 1;
		transition: color 0.2s;
	}

	.label-remove:hover {
		color: var(--error-color, #c00);
	}

	.add-label-dropdown {
		position: relative;
	}

	.add-label-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		background: white;
		border: 1px dashed var(--border);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--postal-blue);
		cursor: pointer;
		list-style: none;
		transition: all 0.2s;
	}

	.add-label-btn:hover {
		border-color: var(--postal-blue);
		background: var(--paper-light-blue);
	}

	.add-label-btn::-webkit-details-marker {
		display: none;
	}

	.add-label-menu {
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 0.25rem;
		background: white;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 150px;
		max-height: 200px;
		overflow-y: auto;
		z-index: 10;
	}

	.add-label-menu form {
		display: block;
	}

	.label-option {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: none;
		border: none;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
		transition: background 0.2s;
	}

	.label-option:hover {
		background: var(--paper-light-blue);
	}

	.no-more-labels {
		padding: 0.75rem;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--text-secondary);
		font-style: italic;
		text-align: center;
	}

	/* Letter-style message cards */
	.message-card {
		border: 2px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background: white;
		overflow: hidden;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
	}
	.message-card--sent {
		border-color: var(--postal-blue-mid);
		border-left-width: 4px;
		background: var(--postal-blue-light);
		box-shadow: 0 2px 6px rgba(61, 90, 128, 0.12);
	}

	/* Letter header with postmark aesthetic */
	.message-card__header {
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		background: var(--parchment);
	}

	.message-card--sent .message-card__header {
		background: rgba(255, 255, 255, 0.5);
		border-bottom-color: var(--postal-blue-mid);
	}

	.message-card__from {
		display: flex;
		align-items: baseline;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.handle {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--postal-blue-dark);
	}

	.message-card--sent .handle {
		color: var(--postal-blue);
	}

	/* Postmark-style timestamp */
	.timestamp {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--ink-slate);
		padding: 0.125rem var(--space-2);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: white;
	}

	.message-card__recipients {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--text-xs);
		color: var(--ink-slate);
		font-family: var(--font-mono);
	}

	.recipient-line {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.recipient-label {
		font-weight: 600;
		color: var(--ink-charcoal);
		min-width: 3ch;
	}

	/* Letter body with serif font */
	.message-card__body {
		padding: var(--space-6) var(--space-6) var(--space-5);
	}

	.plain-text {
		font-family: var(--font-serif);
		font-size: var(--text-base);
		line-height: 1.7;
		color: var(--ink-navy);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.message-card__actions {
		padding: var(--space-3) var(--space-6);
		border-top: 1px solid var(--border-faint);
		display: flex;
		gap: var(--space-4);
		background: var(--parchment);
	}

	.message-card--sent .message-card__actions {
		background: rgba(255, 255, 255, 0.5);
	}

	.action-btn {
		background: none;
		border: none;
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--postal-blue);
		cursor: pointer;
		padding: 0;
		text-decoration: none;
		transition: color 0.2s;
	}
	.action-btn:hover {
		color: var(--postal-blue-mid);
		text-decoration: underline;
	}
	.action-btn--muted  { color: var(--ink-slate); }
	.action-btn--muted:hover { color: var(--ink-charcoal); }
	.action-btn--danger { color: var(--wax-red); }
	.action-btn--danger:hover { color: #991b1b; }

	.action-confirmed {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		color: var(--ink-slate);
		font-style: italic;
	}

	.report-panel {
		border-top: 1px solid var(--border-faint);
		background: var(--wax-red-light);
		padding: var(--space-4) var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.report-panel__footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
	}

	.reply-box {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.reply-box__title {
		margin: 0;
		font-family: var(--font-sans);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--ink-navy);
	}

	.reply-box__footer {
		display: flex;
		justify-content: flex-end;
	}

	.quote-toggle {
		margin-bottom: var(--space-3);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--ink-charcoal);
		cursor: pointer;
		user-select: none;
	}

	.checkbox-label input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

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
</style>
