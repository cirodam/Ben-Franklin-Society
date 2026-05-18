<script lang="ts">
	import { enhance } from '$app/forms';

	type CommentData = {
		uuid: string;
		body: string;
		created_at: string;
		edited_at: string | null;
		author_uuid: string;
		given_name: string;
		family_name: string;
		handle: string;
	};

	let {
		comment,
		actingAs = null,
		onEditStart
	}: {
		comment: CommentData;
		actingAs?: string | null;
		onEditStart?: (uuid: string, body: string) => void;
	} = $props();

	let isEditing = $state(false);
	let editBody = $state(comment.body);

	function startEdit() {
		editBody = comment.body;
		isEditing = true;
		onEditStart?.(comment.uuid, comment.body);
	}

	function cancelEdit() {
		isEditing = false;
		editBody = comment.body;
	}
</script>

<div class="comment">
	<div class="comment__avatar">
		{comment.given_name[0]}{comment.family_name[0]}
	</div>
	<div class="comment__content">
		<div class="comment__header">
			<strong class="comment__author">{comment.given_name} {comment.family_name}</strong>
			<span class="comment__handle">@{comment.handle}</span>
			<span class="comment__date">{new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
			{#if comment.edited_at}<span class="comment__edited">(edited)</span>{/if}
			{#if comment.author_uuid === actingAs}
				<div class="comment__actions">
					<button class="comment__action" onclick={startEdit}>Edit</button>
					<form method="POST" action="?/deleteComment" use:enhance style="display: inline;">
						<input type="hidden" name="comment_uuid" value={comment.uuid} />
						<button class="comment__action comment__action--danger" type="submit">Delete</button>
					</form>
				</div>
			{/if}
		</div>
		{#if isEditing}
			<form method="POST" action="?/editComment" use:enhance={() => {
				return ({ result, update }) => {
					if (result.type === 'success') {
						isEditing = false;
					}
					update();
				};
			}} class="comment__edit-form">
				<input type="hidden" name="comment_uuid" value={comment.uuid} />
				<textarea class="comment__edit-input" name="body" rows="3" bind:value={editBody} required></textarea>
				<div class="comment__edit-actions">
					<button type="submit" class="btn btn--sm btn--primary">Save</button>
					<button type="button" class="btn btn--sm btn--secondary" onclick={cancelEdit}>Cancel</button>
				</div>
			</form>
		{:else}
			<p class="comment__body">{comment.body}</p>
		{/if}
	</div>
</div>

<style>
	.comment {
		display: flex;
		gap: var(--space-3);
		align-items: flex-start;
	}

	.comment__avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		flex-shrink: 0;
	}

	.comment__content {
		flex: 1;
		min-width: 0;
	}

	.comment__header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
		flex-wrap: wrap;
		font-size: var(--text-sm);
	}

	.comment__author {
		font-weight: var(--weight-semibold);
	}

	.comment__handle,
	.comment__date,
	.comment__edited {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}

	.comment__edited {
		font-style: italic;
	}

	.comment__actions {
		margin-left: auto;
		display: flex;
		gap: var(--space-2);
	}

	.comment__action {
		background: none;
		border: none;
		padding: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		cursor: pointer;
		text-decoration: underline;
	}

	.comment__action:hover {
		color: var(--color-text);
	}

	.comment__action--danger:hover {
		color: #991b1b;
	}

	.comment__body {
		margin: 0;
		font-size: var(--text-sm);
		line-height: 1.7;
		white-space: pre-wrap;
	}

	.comment__edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.comment__edit-input {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-family: inherit;
		background: var(--color-bg);
		color: var(--color-text);
		resize: vertical;
		line-height: 1.6;
	}

	.comment__edit-input:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.comment__edit-actions {
		display: flex;
		gap: var(--space-2);
	}
</style>
