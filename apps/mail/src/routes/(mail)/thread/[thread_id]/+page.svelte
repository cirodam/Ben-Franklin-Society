<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDateTime } from '@bfs/ui';
	import MessageCard from '$lib/components/thread/MessageCard.svelte';
	import ThreadLabels from '$lib/components/thread/ThreadLabels.svelte';
	import ReplyForm from '$lib/components/thread/ReplyForm.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { messages, actingAs, signature, messageAttachments, availableLabels, threadLabels } =
		$derived(data);

	const root = $derived(messages[0]);
	const last = $derived(messages[messages.length - 1]);

	// Track which message has its report form open (by uuid or null).
	let reportOpenFor = $state<string | null>(null);

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

	<ThreadLabels {availableLabels} {threadLabels} />

	<div class="message-list">
		{#each messages as msg}
			<MessageCard
				message={msg}
				{actingAs}
				attachments={messageAttachments[msg.uuid] || []}
				{formData}
				bind:reportOpenFor
				{formatDateTime}
			/>
		{/each}
	</div>

	<ReplyForm lastMessage={last} {signature} {formData} />
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
</style>
