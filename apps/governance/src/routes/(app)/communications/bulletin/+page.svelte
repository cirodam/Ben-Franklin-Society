<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, EmptyState, Input, Textarea } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let showForm = $state(false);

	function excerpt(text: string, maxLength = 120): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength).trim() + '...';
	}

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
	<header class="header">
		<h1 class="page-title">Community Bulletin Board</h1>
		<div class="header-actions">
			<Button onclick={() => showForm = !showForm}>
				{showForm ? 'Cancel' : '+ Start a thread'}
			</Button>
		</div>
	</header>

	{#if showForm}
		<form method="POST" use:enhance class="new-thread-form">
			<h3 class="form-header">New Thread</h3>
			<Input
				name="title"
				placeholder="What's on your mind?"
				required
			/>
			<Textarea
				name="body"
				placeholder="Say more, or leave it at the title..."
				rows={4}
				required
			/>
			<div class="form-actions">
				<Button type="button" variant="secondary" onclick={() => showForm = false}>Cancel</Button>
				<Button type="submit">Post to Board</Button>
			</div>
		</form>
	{/if}

	{#if data.posts.length === 0}
		<EmptyState
			title="No notices yet"
			description="Be the first to post!"
		/>
	{:else}
		<div class="thread-list">
			{#each data.posts as post}
				<a href="/communications/bulletin/{post.uuid}" class="thread-row">
					<div class="thread-main">
						<h2 class="thread-title">{post.title}</h2>
						<p class="thread-preview">{excerpt(post.body)}</p>
						<div class="thread-meta">
							<span class="thread-author">{post.given_name} {post.family_name}</span>
							<span class="thread-separator">•</span>
							<span class="thread-date">{formatDate(post.created_at)}</span>
							{#if post.comment_count > 0}
								<span class="thread-replies">{post.comment_count} {post.comment_count === 1 ? 'reply' : 'replies'}</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1000px;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.header {
		text-align: center;
		margin-bottom: var(--space-6);
	}

	.page-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: clamp(2.25rem, 4.5vw, 3.5rem);
		font-weight: 400;
		color: var(--ink);
		margin: 0 0 var(--space-6) 0;
		line-height: 1.3;
	}

	.header-actions {
		display: flex;
		justify-content: center;
	}

	.new-thread-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		background: var(--paper);
		padding: var(--space-6);
		border: 1px solid var(--border);
		margin-bottom: var(--space-4);
	}

	.form-header {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: var(--ink);
		margin: 0;
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
	}

	.thread-list {
		display: flex;
		flex-direction: column;
		background: var(--paper);
		border: 1px solid var(--border);
	}

	.thread-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-6);
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--border-subtle);
		background: transparent;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		color: inherit;
	}

	.thread-row:last-child {
		border-bottom: none;
	}

	.thread-row:hover {
		border-color: var(--gold-hover);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 4px 8px rgba(0, 0, 0, 0.08);
	}

	.thread-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}

	.thread-title {
		font-family: 'IM Fell English', Georgia, serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: var(--ink);
		margin: 0;
		line-height: 1.3;
	}

	.thread-row:hover .thread-title {
		color: var(--gold);
	}

	.thread-preview {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		font-style: italic;
		color: var(--ink-faint);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin: 0;
		line-height: 1.6;
	}

	.thread-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.thread-author {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-faint);
	}

	.thread-separator {
		font-size: var(--text-sm);
		color: var(--gold);
	}

	.thread-date {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-faint);
		font-variant-numeric: oldstyle-nums;
	}

	.thread-replies {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--gold);
		margin-left: auto;
	}
</style>
