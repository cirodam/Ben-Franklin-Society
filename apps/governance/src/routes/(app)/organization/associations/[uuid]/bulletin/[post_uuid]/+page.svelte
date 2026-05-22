<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Textarea } from '@bfs/ui';
	import Tabs from '$lib/components/Tabs.svelte';
	import CategoryBadge from '$lib/components/bulletin/CategoryBadge.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showReplyForm = $state(false);

	const tabs = $derived([
		{ href: `/organization/associations/${data.association.uuid}`, label: 'Overview' },
		{ href: `/organization/associations/${data.association.uuid}/bulletin`, label: 'Bulletin' }
	]);

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function handleDeletePost(event: Event) {
		if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) {
			event.preventDefault();
		}
	}

	function handleDeleteComment(event: Event) {
		if (!confirm('Are you sure you want to delete this comment? This cannot be undone.')) {
			event.preventDefault();
		}
	}
</script>

<div class="page">
	<nav class="breadcrumb">
		<a href="/organization/associations">Associations</a>
		<span class="separator">›</span>
		<a href="/organization/associations/{data.association.uuid}">{data.association.name}</a>
		<span class="separator">›</span>
		<a href="/organization/associations/{data.association.uuid}/bulletin">Bulletin</a>
		<span class="separator">›</span>
		<span>Post</span>
	</nav>

	<Tabs {tabs} />

	<article class="thread">
		<header class="thread-header">
			<h1 class="thread-title">{data.post.title}</h1>
			<div class="thread-meta">
				<span class="thread-author">{data.post.author_given_name} {data.post.author_family_name}</span>
				<span class="thread-separator">•</span>
				<time class="thread-date">{formatDate(data.post.created_at)}</time>
				<CategoryBadge category={data.post.category} />
				{#if data.post.visibility !== 'public'}
					<span class="thread-visibility">
						{data.post.visibility === 'members_only' ? '👥 Members only' : '👔 Officers only'}
					</span>
				{/if}
				{#if data.post.pinned_at}
					<span class="thread-pinned">📌 Pinned</span>
				{/if}
			</div>
		</header>

		<div class="thread-body">
			{data.post.body}
		</div>

		<div class="thread-actions">
			<Button onclick={() => showReplyForm = !showReplyForm}>
				Reply
			</Button>
			{#if data.canEdit}
				<a href="/organization/associations/{data.association.uuid}/bulletin/{data.post.uuid}/edit">
					<Button variant="secondary">Edit</Button>
				</a>
			{/if}
			{#if data.canPin}
				{#if data.post.pinned_at}
					<form method="POST" action="?/unpin" use:enhance>
						<Button type="submit" variant="secondary">Unpin</Button>
					</form>
				{:else}
					<form method="POST" action="?/pin" use:enhance>
						<Button type="submit" variant="secondary">Pin</Button>
					</form>
				{/if}
			{/if}
			{#if data.canDelete}
				<form method="POST" action="?/deletePost" use:enhance onsubmit={handleDeletePost}>
					<Button type="submit" variant="danger">Delete Post</Button>
				</form>
			{/if}
		</div>
	</article>

	{#if showReplyForm}
		<form method="POST" action="?/comment" use:enhance class="reply-form">
			<Textarea
				name="body"
				placeholder="Write your reply..."
				rows={4}
				required
			/>
			<div class="form-actions">
				<Button type="button" variant="secondary" onclick={() => showReplyForm = false}>
					Cancel
				</Button>
				<Button type="submit">Post Reply</Button>
			</div>
		</form>
	{/if}

	{#if form?.error}
		<div class="error-message">{form.error}</div>
	{/if}

	{#if data.comments.length > 0}
		<section class="replies">
			<h2 class="replies-title">{data.comments.length} {data.comments.length === 1 ? 'Reply' : 'Replies'}</h2>
			{#each data.comments as comment}
				<article class="reply">
					<header class="reply-header">
						<span class="reply-author">{comment.author_given_name} {comment.author_family_name}</span>
						<span class="reply-separator">•</span>
						<time class="reply-date">{formatDate(comment.created_at)}</time>
					</header>
					<div class="reply-body">{comment.body}</div>
					{#if data.canDelete || comment.author_uuid === data.post.author_uuid}
						<form method="POST" action="?/deleteComment" use:enhance onsubmit={handleDeleteComment} class="reply-actions">
							<input type="hidden" name="comment_uuid" value={comment.uuid} />
							<Button type="submit" variant="secondary" size="sm">Delete</Button>
						</form>
					{/if}
				</article>
			{/each}
		</section>
	{:else if !showReplyForm}
		<div class="empty-replies">
			<p>No replies yet. Be the first to respond!</p>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.breadcrumb a {
		color: var(--text-muted);
		text-decoration: none;
	}

	.breadcrumb a:hover {
		color: var(--text);
		text-decoration: underline;
	}

	.separator {
		color: var(--text-muted);
	}

	.thread {
		background: var(--paper);
		border: 1px solid var(--border);
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.thread-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.thread-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: clamp(1.5rem, 3vw, 2rem);
		font-weight: 400;
		color: var(--ink);
		margin: 0;
		line-height: 1.3;
	}

	.thread-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-muted);
		flex-wrap: wrap;
	}

	.thread-author {
		font-weight: var(--weight-medium);
		color: var(--text);
	}

	.thread-separator {
		color: var(--text-muted);
	}

	.thread-visibility {
		font-size: var(--text-xs);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		background: var(--bg-secondary);
		color: var(--text-muted);
	}

	.thread-pinned {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--accent);
	}

	.thread-body {
		font-size: var(--text-base);
		line-height: 1.7;
		color: var(--text);
		white-space: pre-wrap;
	}

	.thread-actions {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.reply-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		background: var(--paper);
		padding: var(--space-5);
		border: 1px solid var(--border);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
	}

	.error-message {
		padding: var(--space-4);
		background: var(--error-bg);
		color: var(--error-text);
		border: 1px solid var(--error-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
	}

	.replies {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.replies-title {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		color: var(--text);
		margin: 0;
	}

	.reply {
		background: var(--paper);
		border: 1px solid var(--border);
		padding: var(--space-5);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.reply-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.reply-author {
		font-weight: var(--weight-medium);
		color: var(--text);
	}

	.reply-separator {
		color: var(--text-muted);
	}

	.reply-body {
		font-size: var(--text-base);
		line-height: 1.6;
		color: var(--text);
		white-space: pre-wrap;
	}

	.reply-actions {
		display: flex;
		justify-content: flex-end;
	}

	.empty-replies {
		text-align: center;
		padding: var(--space-8);
		color: var(--text-muted);
	}

	.empty-replies p {
		margin: 0;
		font-size: var(--text-base);
	}
</style>
