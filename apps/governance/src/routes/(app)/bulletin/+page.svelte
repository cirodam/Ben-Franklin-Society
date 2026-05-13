<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	function excerpt(text: string, maxLength = 120): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength).trim() + '...';
	}
</script>

<div class="page">
	<div class="page-header">
		<h1>Community Bulletin Board</h1>
		<a href="/bulletin/new" class="btn-new">+ New Notice</a>
	</div>

	{#if data.posts.length === 0}
		<div class="empty">
			<p>No notices yet. Be the first to post!</p>
		</div>
	{:else}
		<div class="card-grid">
			{#each data.posts as post}
				<a href="/bulletin/{post.uuid}" class="card" style="background-color: {post.color}">
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
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
	}

	.btn-new {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-bg);
		background: var(--color-accent);
		border-radius: var(--radius);
		text-decoration: none;
	}

	.btn-new:hover {
		background: var(--color-accent-hover);
	}

	.empty {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-8);
		text-align: center;
		color: var(--color-text-muted);
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-4);
	}

	.card {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-height: 200px;
		padding: var(--space-5);
		border-radius: var(--radius-lg);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		text-decoration: none;
		color: inherit;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
