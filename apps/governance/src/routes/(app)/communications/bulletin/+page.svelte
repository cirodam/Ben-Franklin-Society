<script lang="ts">
	import { Button, EmptyState, PageHeader, Card } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	function excerpt(text: string, maxLength = 120): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength).trim() + '...';
	}
</script>

<div class="page">
	<PageHeader title="Community Bulletin Board">
		{#snippet actions()}
			<Button href="/communications/bulletin/new">+ New Notice</Button>
		{/snippet}
	</PageHeader>

	{#if data.posts.length === 0}
		<EmptyState
			icon="📌"
			title="No notices yet"
			description="Be the first to post!"
		/>
	{:else}
		<div class="card-grid">
			{#each data.posts as post}
				<Card href="/communications/bulletin/{post.uuid}" hover style="background-color: {post.color}; min-height: 200px">
					<div class="card-content">
						<h2 class="card-title">{post.title}</h2>
						<p class="card-body">{excerpt(post.body)}</p>
					</div>
					<div class="card-footer">
						<div class="card-author">
							<span class="author-name">{post.given_name} {post.family_name}</span>
							<span class="author-handle">@{post.handle}</span>
						</div>
						<div class="card-meta">
							{#if post.comment_count > 0}
								<span class="comment-count">💬 {post.comment_count}</span>
							{/if}
							<span class="post-date">{post.created_at.slice(0, 10)}</span>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-4);
	}

	.card-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.card-title {
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		margin: 0;
		color: rgba(0, 0, 0, 0.9);
	}

	.card-body {
		font-size: var(--text-sm);
		line-height: 1.5;
		margin: 0;
		color: rgba(0, 0, 0, 0.7);
	}

	.card-footer {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding-top: var(--space-3);
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	.card-author {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}

	.author-name {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: rgba(0, 0, 0, 0.8);
	}

	.author-handle {
		font-size: var(--text-xs);
		font-family: var(--font-mono);
		color: rgba(0, 0, 0, 0.5);
	}

	.card-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: var(--text-xs);
		color: rgba(0, 0, 0, 0.6);
	}

	.comment-count {
		font-weight: var(--weight-medium);
	}
</style>
