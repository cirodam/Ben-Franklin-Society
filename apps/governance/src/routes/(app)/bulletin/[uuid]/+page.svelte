<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const canDelete = (authorUuid: string) => {
		return data.post.author_uuid === authorUuid;
	};
</script>

<div class="page">
	<a href="/bulletin" class="back-link">← Back to Bulletin Board</a>

	<div class="post-card" style="background-color: {data.post.color}">
		<div class="post-header">
			<h1 class="post-title">{data.post.title}</h1>
			{#if canDelete(data.post.author_uuid)}
				<form method="POST" action="?/deletePost" use:enhance>
					<button type="submit" class="btn-delete" title="Delete post">×</button>
				</form>
			{/if}
		</div>
		
		<div class="post-body">{data.post.body}</div>
		
		<div class="post-footer">
			<div class="post-author">
				<a href="/people/{data.post.author_uuid}" class="author-link">
					{data.post.given_name} {data.post.family_name}
				</a>
				<span class="author-handle">@{data.post.handle}</span>
			</div>
			<div class="post-meta">
				<time>{data.post.created_at.slice(0, 10)}</time>
				{#if data.post.updated_at}
					<span class="edited">(edited)</span>
				{/if}
			</div>
		</div>
	</div>

	<div class="comments-section">
		<h2 class="comments-title">
			Comments
			<span class="comment-count">({data.comments.length})</span>
		</h2>

		<form method="POST" action="?/comment" use:enhance class="comment-form">
			<textarea
				name="body"
				placeholder="Add a comment..."
				rows="3"
				required
				class="comment-input"
			></textarea>
			<button type="submit" class="btn-submit">Post Comment</button>
		</form>

		{#if data.comments.length === 0}
			<p class="no-comments">No comments yet. Be the first to comment!</p>
		{:else}
			<div class="comments-list">
				{#each data.comments as comment}
					<div class="comment">
						<div class="comment-header">
							<div class="comment-author">
								<a href="/people/{comment.author_uuid}" class="author-link">
									{comment.given_name} {comment.family_name}
								</a>
								<span class="author-handle">@{comment.handle}</span>
							</div>
							<div class="comment-meta">
								<time>{comment.created_at.slice(0, 10)}</time>
								{#if comment.updated_at}
									<span class="edited">(edited)</span>
								{/if}
								{#if canDelete(comment.author_uuid)}
									<form method="POST" action="?/deleteComment" use:enhance class="delete-form">
										<input type="hidden" name="comment_uuid" value={comment.uuid} />
										<button type="submit" class="btn-delete-comment">Delete</button>
									</form>
								{/if}
							</div>
						</div>
						<div class="comment-body">{comment.body}</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.back-link {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.back-link:hover {
		color: var(--color-accent);
		text-decoration: underline;
	}

	.post-card {
		padding: var(--space-6);
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.post-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.post-title {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		margin: 0;
		color: rgba(0, 0, 0, 0.9);
		flex: 1;
	}

	.btn-delete {
		font-size: var(--text-2xl);
		font-weight: bold;
		line-height: 1;
		background: rgba(0, 0, 0, 0.1);
		border: none;
		border-radius: var(--radius);
		width: 32px;
		height: 32px;
		cursor: pointer;
		color: rgba(0, 0, 0, 0.6);
		transition: background 0.2s, color 0.2s;
	}

	.btn-delete:hover {
		background: #fee2e2;
		color: #991b1b;
	}

	.post-body {
		font-size: var(--text-base);
		line-height: 1.6;
		white-space: pre-wrap;
		color: rgba(0, 0, 0, 0.8);
		margin-bottom: var(--space-5);
	}

	.post-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--space-4);
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	.post-author {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}

	.author-link {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: rgba(0, 0, 0, 0.8);
		text-decoration: none;
	}

	.author-link:hover {
		text-decoration: underline;
	}

	.author-handle {
		font-size: var(--text-xs);
		font-family: var(--font-mono);
		color: rgba(0, 0, 0, 0.5);
	}

	.post-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-xs);
		color: rgba(0, 0, 0, 0.6);
	}

	.edited {
		font-style: italic;
	}

	.comments-section {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.comments-title {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 0;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.comment-count {
		font-size: var(--text-sm);
		font-weight: var(--weight-normal);
		color: var(--color-text-muted);
	}

	.comment-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.comment-input {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-bg);
		color: var(--color-text);
		resize: vertical;
	}

	.comment-input:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px var(--color-accent-subtle);
	}

	.btn-submit {
		align-self: flex-end;
		padding: var(--space-2) var(--space-4);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		background: var(--color-accent);
		color: var(--color-bg);
		border: none;
		border-radius: var(--radius);
		cursor: pointer;
	}

	.btn-submit:hover {
		background: var(--color-accent-hover);
	}

	.no-comments {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-align: center;
		padding: var(--space-6) 0;
	}

	.comments-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.comment {
		padding: var(--space-4);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.comment-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-2);
	}

	.comment-author {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}

	.comment-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.delete-form {
		display: inline;
	}

	.btn-delete-comment {
		font-size: var(--text-xs);
		padding: 2px 8px;
		background: transparent;
		color: var(--color-text-muted);
		border: none;
		cursor: pointer;
	}

	.btn-delete-comment:hover {
		color: var(--color-danger);
		text-decoration: underline;
	}

	.comment-body {
		font-size: var(--text-sm);
		line-height: 1.5;
		white-space: pre-wrap;
		color: var(--color-text);
	}
</style>
