<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Textarea } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const canDelete = (authorUuid: string) => {
		return data.post.author_uuid === authorUuid;
	};
</script>

<div class="page">
	<a href="/communications/bulletin" class="back-link">← Back to Town Square</a>

	<article class="thread">
		<header class="thread-header">
			<h1 class="thread-title">{data.post.title}</h1>
			<div class="thread-meta">
				<span class="thread-author">{data.post.given_name} {data.post.family_name}</span>
				<span class="thread-separator"></span>
				<time class="thread-date">{data.post.created_at.slice(0, 10)}</time>
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
				<p class="reply-form-note">Replies become part of the chapter record</p>
				<Button type="submit">Reply</Button>
			</div>
		</form>

		{#if data.comments.length > 0}
			<div class="replies-list">
				{#each data.comments as comment}
					<article class="reply">
						<header class="reply-header">
							<span class="reply-author">{comment.given_name} {comment.family_name}</span>
							<time class="reply-date">{comment.created_at.slice(0, 10)}</time>
						</header>
						<div class="reply-body">{comment.body}</div>
					</article>
				{/each}
			</div>
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
		font-family: 'IM Fell English SC', serif;
		font-size: 0.7rem;
		letter-spacing: 0.1em;
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
		box-shadow:
			0 2px 4px rgba(0,0,0,0.06),
			0 8px 24px rgba(0,0,0,0.10),
			0 24px 64px rgba(0,0,0,0.12),
			0 48px 96px rgba(0,0,0,0.08);
	}

	.thread-header {
		margin-bottom: 1.5rem;
	}

	.thread-title {
		font-family: 'IM Fell English', serif;
		font-size: 2rem;
		font-weight: 400;
		line-height: 1.3;
		color: var(--ink);
		margin: 0 0 0.75rem 0;
	}

	.thread-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.thread-author {
		font-family: 'IM Fell English SC', serif;
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		color: var(--ink-mid);
	}

	.thread-separator {
		width: 2px;
		height: 2px;
		border-radius: 50%;
		background: var(--rule-strong);
	}

	.thread-date {
		font-family: 'IM Fell English SC', serif;
		font-size: 0.68rem;
		letter-spacing: 0.1em;
		color: var(--ink-faint);
	}

	.thread-body {
		font-family: 'Libre Baskerville', serif;
		font-size: 1rem;
		line-height: 1.65;
		color: var(--ink);
		white-space: pre-wrap;
	}

	/* Replies Section */
	.replies {
		background: var(--disc-bg);
		padding: 2.5rem 3rem;
		border-radius: var(--radius);
		box-shadow:
			0 2px 4px rgba(0,0,0,0.06),
			0 8px 24px rgba(0,0,0,0.10),
			0 24px 64px rgba(0,0,0,0.12),
			0 48px 96px rgba(0,0,0,0.08);
	}

	.replies-title {
		font-family: 'IM Fell English', serif;
		font-size: 1.5rem;
		font-weight: 400;
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
		font-family: 'IM Fell English SC', serif;
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		color: var(--ink-mid);
	}

	.reply-form-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.reply-form-note {
		font-family: 'IM Fell English SC', serif;
		font-size: 0.62rem;
		letter-spacing: 0.08em;
		color: var(--ink-faint);
		margin: 0;
		font-style: italic;
	}

	/* Replies List */
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
		font-family: 'IM Fell English SC', serif;
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		color: var(--ink-mid);
	}

	.reply-date {
		font-family: 'IM Fell English SC', serif;
		font-size: 0.68rem;
		letter-spacing: 0.1em;
		color: var(--ink-faint);
	}

	.reply-body {
		font-family: 'Libre Baskerville', serif;
		font-size: 0.95rem;
		line-height: 1.65;
		color: var(--ink);
		white-space: pre-wrap;
	}
</style>
