<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, EmptyState, PageHeader, Input, Textarea } from '@bfs/ui';
	import type { ActionData, PageData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showForm = $state(false);

	function excerpt(text: string, maxLength = 120): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength).trim() + '...';
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
			<div class="form-header">New Thread</div>
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
						<h2 class="thread-title">{post.title}</h2>
						<p class="thread-preview">{excerpt(post.body)}</p>
						<div class="thread-meta">
							<span class="thread-author">{post.given_name} {post.family_name}</span>
							<span class="thread-separator"></span>
							<span class="thread-date">{post.created_at.slice(0, 10)}</span>
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
		box-shadow:
			0 2px 4px rgba(0,0,0,0.06),
			0 8px 24px rgba(0,0,0,0.10),
			0 24px 64px rgba(0,0,0,0.12),
			0 48px 96px rgba(0,0,0,0.08);
	}

	.form-header {
		font-family: 'IM Fell English SC', serif;
		font-size: 0.7rem;
		letter-spacing: 0.1em;
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
		box-shadow:
			0 2px 4px rgba(0,0,0,0.06),
			0 8px 24px rgba(0,0,0,0.10),
			0 24px 64px rgba(0,0,0,0.12),
			0 48px 96px rgba(0,0,0,0.08);
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
		font-family: 'IM Fell English', serif;
		font-size: 1.2rem;
		font-weight: 400;
		color: var(--ink);
		line-height: 1.3;
		margin: 0;
	}

	.thread-row:hover .thread-title {
		color: var(--accent);
	}

	.thread-preview {
		font-family: 'Libre Baskerville', serif;
		font-size: 0.95rem;
		color: var(--ink-faint);
		line-height: 1.55;
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

	.thread-replies {
		font-family: 'IM Fell English SC', serif;
		font-size: 0.68rem;
		letter-spacing: 0.1em;
		color: var(--ink-faint);
		margin-left: auto;
	}
</style>
