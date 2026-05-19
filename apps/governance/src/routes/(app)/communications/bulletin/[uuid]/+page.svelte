<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Textarea } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { 
			year: 'numeric', 
			month: 'short', 
			day: 'numeric' 
		});
	}
</script>

<div class="page">
	<a href="/communications/bulletin" class="back-link t-label-tight">← Back to Town Square</a>

	<article class="thread">
		<header class="thread-header">
			<h1 class="thread-title t-display">{data.post.title}</h1>
			<div class="thread-meta">
				<span class="thread-author t-label">{data.post.given_name} {data.post.family_name}</span>
				<span class="thread-separator"></span>
				<time class="thread-date t-label">{formatDate(data.post.created_at)}</time>
			</div>
		</header>

		<div class="thread-body t-prose">{data.post.body}</div>
	</article>

	<section class="replies">
		<h2 class="replies-title t-display">Replies</h2>

		<form method="POST" action="?/comment" use:enhance class="reply-form">
			<div class="reply-form-label t-label">Add to the conversation</div>
			<Textarea
				name="body"
				placeholder="Say something..."
				rows={4}
				required
			/>
			<div class="reply-form-footer">
				<p class="reply-form-note t-label-tight">Replies become part of the chapter record</p>
				<Button type="submit">Reply</Button>
			</div>
		</form>

		{#if data.comments.length > 0}
			<div class="replies-list">
				{#each data.comments as comment}
					<article class="reply">
						<header class="reply-header">
							<span class="reply-author t-label">{comment.given_name} {comment.family_name}</span>
							<time class="reply-date t-label">{formatDate(comment.created_at)}</time>
						</header>
						<div class="reply-body t-prose">{comment.body}</div>
					</article>
				{/each}
			</div>
		{:else}
			<p class="no-replies">No replies yet. Be the first to join the conversation!</p>
		{/if}
	</section>
</div>

<style>
	.page {
		max-width: 900px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.back-link {
		font-size: var(--text-sm);
		color: var(--ink-faint);
		text-decoration: none;
		transition: color 0.15s;
	}

	.back-link:hover {
		color: var(--accent);
	}

	/* Thread (Original Post) */
	.thread {
		background: var(--paper);
		padding: 3rem 3rem 2.5rem;
		border-radius: var(--radius);
		box-shadow: var(--shadow-elevated);
	}

	.thread-header {
		margin-bottom: 1.5rem;
	}

	.thread-title {
		font-size: var(--text-2xl);
		color: var(--ink);
		margin: 0 0 0.75rem 0;
	}

	.thread-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.thread-author {
		font-size: var(--text-sm);
		color: var(--ink-mid);
	}

	.thread-separator {
		width: 2px;
		height: 2px;
		border-radius: 50%;
		background: var(--rule-strong);
	}

	.thread-date {
		font-size: var(--text-sm);
		color: var(--ink-faint);
	}

	.thread-body {
		font-size: var(--text-read);
		color: var(--ink);
		white-space: pre-wrap;
	}

	/* Replies Section */
	.replies {
		background: var(--disc-bg);
		padding: 2.5rem 3rem;
		border-radius: var(--radius);
		box-shadow: var(--shadow-elevated);
	}

	.replies-title {
		font-size: var(--text-xl);
		color: var(--ink);
		margin: 0 0 2rem 0;
	}

	/* Reply Form */
	.reply-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--rule);
	}

	.reply-form-label {
		font-size: var(--text-sm);
		color: var(--ink-mid);
	}

	.reply-form-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.reply-form-note {
		font-size: var(--text-xs);
		color: var(--ink-faint);
		margin: 0;
		font-style: italic;
	}

	/* Replies List */
	.no-replies {
		font-size: var(--text-sm);
		color: var(--ink-faint);
		text-align: center;
		padding: 2rem 0;
		margin: 0;
		font-style: italic;
	}

	.replies-list {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.reply {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.reply-header {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
	}

	.reply-author {
		font-size: var(--text-sm);
		color: var(--ink-mid);
	}

	.reply-date {
		font-size: var(--text-sm);
		color: var(--ink-faint);
	}

	.reply-body {
		font-size: var(--text-body);
		color: var(--ink);
		white-space: pre-wrap;
	}
</style>
