<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Card, Textarea, formatDateTime } from '@bfs/ui';

	interface Message {
		uuid: string;
		from_handle_cache: string;
		sent_at: string;
		body: string;
	}

	let {
		lastMessage,
		signature,
		formData = null
	}: {
		lastMessage: Message | undefined;
		signature: string;
		formData?: any;
	} = $props();

	let replyBody = $state(signature || '');
	let quoteParent = $state(false);

	const quotedText = $derived(
		lastMessage
			? `\nOn ${formatDateTime(lastMessage.sent_at)}, @${lastMessage.from_handle_cache} wrote:\n> ${lastMessage.body.replace(/\n/g, '\n> ')}\n\n${signature}`
			: signature
	);

	const replyBodyWithQuote = $derived(quoteParent ? quotedText : replyBody || signature);

	function resetForm() {
		replyBody = signature || '';
		quoteParent = false;
	}
</script>

<Card>
	<div class="reply-box">
		<h2 class="reply-box__title">Reply</h2>

		{#if formData?.reply_error}
			<Alert variant="danger">{formData.reply_error}</Alert>
		{/if}

		<form
			method="POST"
			action="?/reply"
			use:enhance={() => {
				return ({ result, update }) => {
					if (result.type === 'success') {
						resetForm();
					}
					update();
				};
			}}
		>
			<input type="hidden" name="reply_to_id" value={lastMessage?.uuid ?? ''} />
			<input type="hidden" name="content_type" value="text/markdown" />

			<div class="quote-toggle">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={quoteParent} />
					<span>Quote parent message</span>
				</label>
			</div>

			<input type="hidden" name="body" value={replyBodyWithQuote} />
			<Textarea placeholder="Write your reply…" rows={5} bind:value={replyBody} required />
			<div class="reply-box__footer">
				<Button type="submit" variant="primary" disabled={!replyBody.trim()}>Send Reply</Button>
			</div>
		</form>
	</div>
</Card>

<style>
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
</style>
