<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@bfs/ui';

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
	<div class="comment__header">
		<span class="comment__author">{comment.given_name} {comment.family_name}</span>
		<span class="comment__separator">•</span>
		<time class="comment__date">{new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
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
				<Button type="submit" size="sm">
					{#snippet children()}Save{/snippet}
				</Button>
				<Button type="button" variant="secondary" size="sm" onclick={cancelEdit}>
					{#snippet children()}Cancel{/snippet}
				</Button>
			</div>
		</form>
	{:else}
		<p class="comment__body">{comment.body}</p>
	{/if}
</div>

<style>
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
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.15em;
		color: #374340;
	}

	.comment__separator {
		color: #7a5c1a;
		font-size: var(--text-xs);
	}

	.comment__date {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #7a5c1a;
		font-variant-numeric: oldstyle-nums;
	}

	.comment__edited {
		color: #374340;
		font-size: var(--text-xs);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-style: italic;
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
		font-family: 'Libre Baskerville', Georgia, serif;
		color: #7a5c1a;
		cursor: pointer;
		text-decoration: none;
	}

	.comment__action:hover {
		color: #d4a24a;
		text-decoration: underline;
	}

	.comment__action--danger:hover {
		color: #991b1b;
	}

	.comment__body {
		margin: 0;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-body);
		line-height: 1.75;
		color: #151c1a;
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
		border: 1px solid rgba(45, 90, 79, 0.2);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-family: 'Libre Baskerville', Georgia, serif;
		background: #fafaf7;
		color: #151c1a;
		resize: vertical;
		line-height: 1.6;
	}

	.comment__edit-input:focus {
		outline: none;
		border-color: #7a5c1a;
	}

	.comment__edit-actions {
		display: flex;
		gap: var(--space-2);
	}
</style>
