<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Card, Textarea, formatDateTime } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { messages } = $derived(data);

	const root = $derived(messages[0]);
	const last = $derived(messages[messages.length - 1]);

	let replyBody = $state('');

	// Track which message has its report form open (by uuid or null).
	let reportOpenFor = $state<string | null>(null);

	// Type assertion to work around ActionData inference issue
	const formData = $derived(form as any);
</script>

<div class="page">
	<div class="page-header">
		<a href="/" class="back-link">← Inbox</a>
		<h1>{root?.subject ?? ''}</h1>
	</div>

	<div class="message-list">
		{#each messages as msg}
			<div class="message-card" class:message-card--sent={msg.recipient_type === null}>
				<div class="message-card__header">
					<div class="message-card__from">
						<span class="handle">@{msg.from_handle_cache}</span>
						<span class="timestamp">{formatDateTime(msg.sent_at)}</span>
					</div>
					<div class="message-card__to">
						To:
						{#each msg.recipients as r, i}
							@{r.recipient_handle_cache}{i < msg.recipients.length - 1 ? ', ' : ''}
						{/each}
					</div>
				</div>

				<div class="message-card__body">{msg.body}</div>

				<div class="message-card__actions">
					<!-- Reply / Forward links (open compose in a new context) -->
					<a href="/compose?reply_to={msg.uuid}" class="action-btn">Reply</a>
					<a href="/compose?forward={msg.uuid}"  class="action-btn">Forward</a>

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
					{#if formData.reported && formData.reported_uuid === msg.uuid}
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

				<!-- Inline report form -->
				{#if reportOpenFor === msg.uuid}
					<div class="report-panel">
						{#if formData.report_error && formData.reported_uuid === msg.uuid}
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

			{#if formData.reply_error}
				<Alert variant="danger">{formData.reply_error}</Alert>
			{/if}

			<form method="POST" action="?/reply" use:enhance={() => {
				return ({ result, update }) => {
					if (result.type === 'success') replyBody = '';
					update();
				};
			}}>
				<input type="hidden" name="reply_to_id" value={last?.uuid ?? ''} />
				<Textarea
					name="body"
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
		gap: var(--space-2);
	}

	.back-link {
		font-size: var(--text-sm);
		color: var(--color-accent);
		text-decoration: none;
	}
	.back-link:hover { text-decoration: underline; }

	.page-header h1 {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
	}

	.message-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.message-card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		overflow: hidden;
	}
	.message-card--sent {
		border-color: var(--color-border-faint);
		background: var(--color-bg);
	}

	.message-card__header {
		padding: var(--space-4) var(--space-5) var(--space-3);
		border-bottom: 1px solid var(--color-border-faint);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.message-card__from {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
	}

	.handle {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	.timestamp {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.message-card__to {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.message-card__body {
		padding: var(--space-5);
		font-size: var(--text-sm);
		line-height: 1.65;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.message-card__actions {
		padding: var(--space-3) var(--space-5);
		border-top: 1px solid var(--color-border-faint);
		display: flex;
		gap: var(--space-3);
	}

	.action-btn {
		background: none;
		border: none;
		font-size: var(--text-xs);
		color: var(--color-accent);
		cursor: pointer;
		padding: 0;
		text-decoration: none;
	}
	.action-btn:hover { text-decoration: underline; }
	.action-btn--muted  { color: var(--color-text-muted); }
	.action-btn--danger { color: var(--color-danger); }

	.action-confirmed {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.report-panel {
		border-top: 1px solid var(--color-border-faint);
		background: var(--color-bg);
		padding: var(--space-4) var(--space-5);
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
		gap: var(--space-3);
	}

	.reply-box__title {
		margin: 0;
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
	}

	.reply-box__footer {
		display: flex;
		justify-content: flex-end;
	}
</style>
