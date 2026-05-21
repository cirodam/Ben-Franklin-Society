<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Textarea } from '@bfs/ui';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import MessageAttachments from './MessageAttachments.svelte';
	import ReportPanel from './ReportPanel.svelte';

	interface Recipient {
		uuid: string;
		recipient_handle_cache: string;
		type: 'to' | 'cc' | 'bcc';
	}

	interface Message {
		uuid: string;
		from_handle_cache: string;
		from_principal_uuid: string;
		sent_at: string;
		recipient_type: 'to' | 'cc' | 'bcc' | null;
		subject: string;
		body: string;
		content_type: string;
		trashed_at: string | null;
		recipients: Recipient[];
	}

	interface Attachment {
		uuid: string;
		filename: string;
		size_bytes: number;
	}

	let {
		message,
		actingAs,
		attachments = [],
		formData = null,
		reportOpenFor = $bindable(null),
		formatDateTime
	}: {
		message: Message;
		actingAs: string;
		attachments?: Attachment[];
		formData?: any;
		reportOpenFor?: string | null;
		formatDateTime: (date: string) => string;
	} = $props();

	const isSent = $derived(message.recipient_type === null);
	const toRecipients = $derived(message.recipients.filter((r) => r.type === 'to'));
	const ccRecipients = $derived(message.recipients.filter((r) => r.type === 'cc'));
	const bccRecipients = $derived(message.recipients.filter((r) => r.type === 'bcc'));
	const showBcc = $derived(message.from_principal_uuid === actingAs && bccRecipients.length > 0);

	function toggleReport() {
		reportOpenFor = reportOpenFor === message.uuid ? null : message.uuid;
	}
</script>

<div class="message-card" class:message-card--sent={isSent}>
	<div class="message-card__header">
		<div class="message-card__from">
			<span class="handle">@{message.from_handle_cache}</span>
			<span class="timestamp">{formatDateTime(message.sent_at)}</span>
		</div>
		<div class="message-card__recipients">
			{#if toRecipients.length > 0}
				<div class="recipient-line">
					<span class="recipient-label">To:</span>
					{#each toRecipients as r, i}
						<span>@{r.recipient_handle_cache}{i < toRecipients.length - 1 ? ', ' : ''}</span>
					{/each}
				</div>
			{/if}
			{#if ccRecipients.length > 0}
				<div class="recipient-line">
					<span class="recipient-label">CC:</span>
					{#each ccRecipients as r, i}
						<span>@{r.recipient_handle_cache}{i < ccRecipients.length - 1 ? ', ' : ''}</span>
					{/each}
				</div>
			{/if}
			{#if showBcc}
				<div class="recipient-line">
					<span class="recipient-label">BCC:</span>
					{#each bccRecipients as r, i}
						<span>@{r.recipient_handle_cache}{i < bccRecipients.length - 1 ? ', ' : ''}</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="message-card__body">
		{#if message.content_type === 'text/markdown'}
			<MarkdownRenderer markdown={message.body} />
		{:else}
			<div class="plain-text">{message.body}</div>
		{/if}
	</div>

	{#if attachments.length > 0}
		<MessageAttachments {attachments} />
	{/if}

	<div class="message-card__actions">
		<a href="/compose?reply_to={message.uuid}" class="action-btn">Reply</a>
		<a href="/forward/{message.uuid}" class="action-btn">Forward</a>

		{#if !isSent}
			{#if message.trashed_at}
				<form method="POST" action="?/restore" use:enhance>
					<input type="hidden" name="message_uuid" value={message.uuid} />
					<button type="submit" class="action-btn">Restore</button>
				</form>
			{:else}
				<form method="POST" action="?/trash" use:enhance>
					<input type="hidden" name="message_uuid" value={message.uuid} />
					<button type="submit" class="action-btn action-btn--muted">Move to Trash</button>
				</form>
			{/if}

			{#if formData?.reported && formData?.reported_uuid === message.uuid}
				<span class="action-confirmed">Reported</span>
			{:else}
				<button type="button" class="action-btn action-btn--danger" onclick={toggleReport}>
					Report
				</button>
			{/if}
		{/if}
	</div>

	{#if reportOpenFor === message.uuid}
		<ReportPanel messageUuid={message.uuid} {formData} onclose={() => (reportOpenFor = null)} />
	{/if}
</div>

<style>
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
	.action-btn--muted {
		color: var(--ink-slate);
	}
	.action-btn--muted:hover {
		color: var(--ink-charcoal);
	}
	.action-btn--danger {
		color: var(--wax-red);
	}
	.action-btn--danger:hover {
		color: #991b1b;
	}

	.action-confirmed {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		color: var(--ink-slate);
		font-style: italic;
	}
</style>
