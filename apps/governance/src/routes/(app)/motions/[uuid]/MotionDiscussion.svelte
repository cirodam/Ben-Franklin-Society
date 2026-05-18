<script lang="ts">
	import Comment from './Comment.svelte';
	import CommentForm from './CommentForm.svelte';

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
		comments = [],
		actingAs = null
	}: {
		comments?: CommentData[];
		actingAs?: string | null;
	} = $props();

	let editingCommentUuid = $state<string | null>(null);

	function handleEditStart(uuid: string, body: string) {
		editingCommentUuid = uuid;
	}
</script>

<div class="discussion">
	<div class="paper-card__header">
		<h3 class="paper-card__title">Discussion</h3>
		<span class="paper-card__subtitle">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
	</div>

	{#if comments.length > 0}
		<div class="thread">
			{#each comments as comment}
				<Comment {comment} {actingAs} onEditStart={handleEditStart} />
			{/each}
		</div>
	{:else}
		<p class="discussion__empty">No comments yet. Be the first to share your thoughts.</p>
	{/if}

	<CommentForm {actingAs} />
</div>

<style>
	.discussion {
		max-width: 900px;
		margin: var(--space-6) auto var(--space-8);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.paper-card__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
	}

	.paper-card__title {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 0;
	}

	.paper-card__subtitle {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.discussion__empty {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		padding: var(--space-8) 0;
	}

	.thread {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
</style>
