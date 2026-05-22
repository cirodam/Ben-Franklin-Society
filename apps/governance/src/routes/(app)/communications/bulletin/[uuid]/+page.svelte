<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Textarea } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		});
	}
</script>

<div class="page">
	<a href="/communications/bulletin" class="back-link">← Bulletin</a>

	<article class="thread">
		<header class="thread-header">
			<h1 class="thread-title">{data.post.title}</h1>
			<div class="thread-meta">
				<span class="thread-author">{data.post.author_given_name} {data.post.author_family_name}</span>
				<span class="thread-separator">•</span>
				<time class="thread-date">{formatDate(data.post.created_at)}</time>
			</div>
		</header>

		<div class="thread-body">{data.post.body}</div>
	</article>

	<section class="replies">
		<h2 class="replies-title">Replies</h2>

		<form method="POST" action="?/comment" use:enhance class="reply-form">
			<div class="reply-form-label">Add to the conversation</div>
			<Textarea
				name="body"
				placeholder="Say something..."
				rows={4}
				required
			/>
			<div class="reply-form-footer">
				<Button type="submit">Reply</Button>
			</div>
		</form>

		{#if data.comments.length > 0}
			<div class="replies-list">
				{#each data.comments as comment}
					<article class="reply">
						<header class="reply-header">
					<span class="reply-author">{comment.author_given_name} {comment.author_family_name}</span>
						<span class="reply-separator">•</span>
						<time class="reply-date">{formatDate(comment.created_at)}</time>
					</header>
					<div class="reply-body">{comment.body}</div>
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
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		color: var(--ink-mid);
		text-decoration: none;
		background: transparent;
		border: 1px solid var(--border);
		transition: all 0.2s;
		align-self: flex-start;
	}

	.back-link:hover {
		background: var(--paper);
		color: var(--ink);
		border-color: var(--gold-hover);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	/* Thread (Original Post) */
	.thread {
		background: var(--paper);
		padding: var(--space-8);
		border: 1px solid var(--border);
		box-shadow: 
			0 2px 4px rgba(0,0,0,0.06),
			0 8px 24px rgba(0,0,0,0.10);
	}

	.thread-header {
		margin-bottom: var(--space-6);
		padding-bottom: var(--space-4);
		border-bottom: 1px solid var(--border-subtle);
	}

	.thread-title {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: var(--text-3xl);
		font-weight: 400;
		color: var(--ink);
		margin: 0 0 var(--space-3) 0;
		line-height: 1.2;
	}

	.thread-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.thread-author {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.15em;
		color: var(--ink-mid);
	}

	.thread-separator {
		color: var(--gold);
		font-size: var(--text-xs);
	}

	.thread-date {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--gold);
		font-variant-numeric: oldstyle-nums;
	}

	.thread-body {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-read);
		line-height: 1.8;
		color: var(--ink);
		white-space: pre-wrap;
	}

	/* Replies Section */
	.replies {
		background: var(--paper);
		padding: var(--space-8);
		border: 1px solid var(--border);
		box-shadow: 
			0 2px 4px rgba(0,0,0,0.06),
			0 8px 24px rgba(0,0,0,0.10);
	}

	.replies-title {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: var(--ink);
		margin: 0 0 var(--space-6) 0;
	}

	/* Reply Form */
	.reply-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-bottom: var(--space-8);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid var(--border-subtle);
	}

	.reply-form-label {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.15em;
		color: var(--ink-mid);
	}

	.reply-form-footer {
		display: flex;
		justify-content: flex-end;
		align-items: center;
	}

	/* Replies List */
	.no-replies {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		font-style: italic;
		color: var(--ink-mid);
		text-align: center;
		padding: var(--space-6) 0;
		margin: 0;
	}

	.replies-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.reply {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid var(--border-faint);
	}

	.reply:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.reply-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.reply-author {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.15em;
		color: var(--ink-mid);
	}

	.reply-separator {
		color: var(--gold);
		font-size: var(--text-xs);
	}

	.reply-date {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--gold);
		font-variant-numeric: oldstyle-nums;
	}

	.reply-body {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-body);
		line-height: 1.75;
		color: var(--ink);
		white-space: pre-wrap;
	}
</style>
