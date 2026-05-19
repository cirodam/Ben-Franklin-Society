<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, EmptyState, PageHeader, Input, Textarea } from '@bfs/ui';
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
			month: 'short', 
			day: 'numeric' 
		});
	}
</script>

<div class="page">
	<PageHeader title="Community Bulletin Board">
		{#snippet actions()}
			<Button onclick={() => showForm = !showForm}>
				{showForm ? 'Cancel' : 'Start a thread'}
			</Button>
		{/snippet}
	</PageHeader>

	{#if showForm}
		<form method="POST" use:enhance class="new-thread-form">
			<div class="form-header t-label">New Thread</div>
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
				<Button type="submit">Post to Square</Button>
			</div>
		</form>
	{/if}

	{#if data.posts.length === 0}
		<EmptyState
			icon="📌"
			title="No notices yet"
			description="Be the first to post!"
		/>
	{:else}
		<div class="thread-list">
			{#each data.posts as post}
				<a href="/communications/bulletin/{post.uuid}" class="thread-row">
					<div class="thread-main">
						<h2 class="thread-title t-display">{post.title}</h2>
						<p class="thread-preview t-prose-italic">{excerpt(post.body)}</p>
						<div class="thread-meta">
							<span class="thread-author t-label">{post.given_name} {post.family_name}</span>
							<span class="thread-separator"></span>
							<span class="thread-date t-label">{formatDate(post.created_at)}</span>
							{#if post.comment_count > 0}
								<span class="thread-replies t-label">{post.comment_count} {post.comment_count === 1 ? 'reply' : 'replies'}</span>
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
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 1000px;
		margin: 0 auto;
		width: 100%;
	}

	.new-thread-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		background: var(--paper);
		padding: 1.5rem 2rem;
		border-radius: var(--radius);
		box-shadow: var(--shadow-elevated);
	}

	.form-header {
		font-size: var(--text-sm);
		color: var(--ink-mid);
		text-transform: uppercase;
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
		box-shadow: var(--shadow-elevated);
	}

	.thread-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-6);
		padding: 1.4rem 2rem;
		border-bottom: 1px solid var(--rule);
		background: transparent;
		cursor: pointer;
		transition: background 0.12s;
		text-decoration: none;
		color: inherit;
	}

	.thread-row:last-child {
		border-bottom: none;
	}

	.thread-row:hover {
		background: var(--surface-dk);
	}

	.thread-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}

	.thread-title {
		font-size: var(--text-lg);
		color: var(--ink);
		margin: 0;
	}

	.thread-row:hover .thread-title {
		color: var(--accent);
	}

	.thread-preview {
		font-size: var(--text-body);
		color: var(--ink-faint);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin: 0;
	}

	.thread-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.thread-author {
		font-size: var(--text-sm);
		color: var(--ink-mid);
	}

	.thread-separator {
		width: 2px;
		height: 2px;
		border-radius: 50%;
		background: var(--rule-strong);
	}

	.thread-date {
		font-size: var(--text-sm);
		color: var(--ink-faint);
	}

	.thread-replies {
		font-size: var(--text-sm);
		color: var(--ink-faint);
		margin-left: auto;
	}
</style>
