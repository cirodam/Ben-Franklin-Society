<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Card } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { comments } = $derived(data);
	const actingAs = $derived(data.actingAs ?? null);

	let editingCommentUuid = $state<string | null>(null);
	let editBody = $state('');

	function startEdit(uuid: string, body: string) {
		editingCommentUuid = uuid;
		editBody = body;
	}

	function cancelEdit() {
		editingCommentUuid = null;
		editBody = '';
	}

	function formatDate(isoString: string) {
		return new Date(isoString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	}
</script>

<div class="page">
	<div class="page-header">
		<a href="javascript:history.back()" class="back-link">← Back</a>
	</div>

	<header class="header">
		<h1 class="page-title">Discussion</h1>
	</header>

	<Card>
		<div class="discussion">
			{#if actingAs}
				<form
					method="POST"
					action="?/comment"
					use:enhance={() => {
						return async ({ update, formElement }) => {
							await update();
							formElement.reset();
						};
					}}
					class="comment-form"
				>
					<div class="comment-form__label">Add to the conversation</div>
					<textarea
						class="comment-form__input"
						name="body"
						rows="3"
						placeholder="Share your thoughts..."
						required
					></textarea>
					<div class="comment-form__footer">
						<Button type="submit">Post Comment</Button>
					</div>
				</form>
			{:else}
				<p class="login-message">Please log in to comment.</p>
			{/if}

			{#if comments.length > 0}
				<div class="comments-list">
					{#each comments as comment}
						<div class="comment">
							<div class="comment__header">
								<span class="comment__author"
									>{comment.given_name} {comment.family_name}</span
								>
								<span class="comment__separator">•</span>
								<time class="comment__date">{formatDate(comment.created_at)}</time>
								{#if comment.edited_at}
									<span class="comment__edited">(edited)</span>
								{/if}
								{#if comment.author_uuid === actingAs}
									<div class="comment__actions">
										<button
											class="comment__action"
											onclick={() => startEdit(comment.uuid, comment.body)}
										>
											Edit
										</button>
										<form
											method="POST"
											action="?/deleteComment"
											use:enhance
											style="display: inline;"
											onsubmit={(e) => {
												if (
													!confirm('Are you sure you want to delete this comment?')
												) {
													e.preventDefault();
												}
											}}
										>
											<input type="hidden" name="comment_uuid" value={comment.uuid} />
											<button class="comment__action comment__action--danger" type="submit"
												>Delete</button
											>
										</form>
									</div>
								{/if}
							</div>
							{#if editingCommentUuid === comment.uuid}
								<form
									method="POST"
									action="?/editComment"
									use:enhance={() => {
										return ({ result, update }) => {
											if (result.type === 'success') {
												cancelEdit();
											}
											update();
										};
									}}
									class="comment__edit-form"
								>
									<input type="hidden" name="comment_uuid" value={comment.uuid} />
									<textarea
										class="comment__edit-input"
										name="body"
										rows="3"
										bind:value={editBody}
										required
									></textarea>
									<div class="comment__edit-actions">
										<Button type="submit" size="small">Save</Button>
										<Button type="button" variant="secondary" size="small" onclick={cancelEdit}
											>Cancel</Button
										>
									</div>
								</form>
							{:else}
								<p class="comment__body">{comment.body}</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-message">No comments yet. Be the first to share your thoughts.</p>
			{/if}
		</div>
	</Card>
</div>

<style>
	.page {
		max-width: 60rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
	}

	.page-header {
		margin-bottom: var(--space-4);
	}

	.back-link {
		font-family: var(--font-label);
		font-size: var(--text-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink-mid);
		text-decoration: none;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: var(--gold);
	}

	.header {
		margin-bottom: var(--space-8);
	}

	.page-title {
		font-family: var(--font-prose);
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 600;
		color: var(--ink);
		margin: 0;
		line-height: 1.3;
	}

	.discussion {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.comment-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.comment-form__label {
		font-family: var(--font-label);
		font-size: var(--text-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink);
		font-weight: 600;
	}

	.comment-form__input,
	.comment__edit-input {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid rgba(45, 90, 79, 0.2);
		padding: var(--space-3);
		font-size: var(--text-base);
		font-family: var(--font-prose);
		background: var(--paper);
		color: var(--ink);
		resize: vertical;
		line-height: 1.6;
		border-radius: var(--radius);
	}

	.comment-form__input:focus,
	.comment__edit-input:focus {
		outline: none;
		border-color: var(--gold);
	}

	.comment-form__footer {
		display: flex;
		justify-content: flex-end;
	}

	.login-message,
	.empty-message {
		text-align: center;
		color: var(--ink-mid);
		font-family: var(--font-prose);
		font-size: var(--text-base);
		padding: var(--space-6);
		margin: 0;
		font-style: italic;
	}

	.comments-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.comment {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid rgba(45, 90, 79, 0.1);
	}

	.comment:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.comment__header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
		font-size: var(--text-sm);
	}

	.comment__author {
		font-family: var(--font-label);
		font-weight: 600;
		color: var(--ink);
	}

	.comment__separator {
		color: var(--ink-mid);
	}

	.comment__date {
		font-family: var(--font-prose);
		color: var(--ink-mid);
	}

	.comment__edited {
		font-family: var(--font-prose);
		color: var(--ink-mid);
		font-style: italic;
		font-size: var(--text-xs);
	}

	.comment__actions {
		display: flex;
		gap: var(--space-2);
		margin-left: auto;
	}

	.comment__action {
		font-family: var(--font-label);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: var(--space-1) var(--space-2);
		background: transparent;
		border: 1px solid rgba(45, 90, 79, 0.2);
		border-radius: var(--radius);
		color: var(--ink-mid);
		cursor: pointer;
		transition: all 0.2s;
	}

	.comment__action:hover {
		border-color: var(--gold);
		color: var(--gold);
	}

	.comment__action--danger:hover {
		border-color: #c53030;
		color: #c53030;
	}

	.comment__body {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--ink);
		margin: 0;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.comment__edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.comment__edit-actions {
		display: flex;
		gap: var(--space-2);
		justify-content: flex-end;
	}
</style>
