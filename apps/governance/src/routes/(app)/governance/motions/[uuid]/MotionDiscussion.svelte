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
	<h2 class="discussion-title">Discussion</h2>
	
	<CommentForm {actingAs} />

	{#if comments.length > 0}
		<div class="thread">
			{#each comments as comment}
				<Comment {comment} {actingAs} onEditStart={handleEditStart} />
			{/each}
		</div>
	{:else}
		<p class="discussion__empty">No comments yet. Be the first to share your thoughts.</p>
	{/if}
</div>

<style>
	.discussion {
		background: var(--paper);
		padding: var(--space-8);
		border: 1px solid rgba(45, 90, 79, 0.2);
		box-shadow: 
			0 2px 4px rgba(0,0,0,0.06),
			0 8px 24px rgba(0,0,0,0.10);
	}

	.discussion-title {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0 0 var(--space-6) 0;
	}

	.discussion__empty {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		font-style: italic;
		color: #374340;
		text-align: center;
		padding: var(--space-6) 0;
		margin: 0;
	}

	.thread {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
</style>
