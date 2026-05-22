<script lang="ts">
	import CategoryBadge from './CategoryBadge.svelte';

	type BulletinPost = {
		uuid: string;
		title: string;
		body: string;
		author_given_name: string;
		author_family_name: string;
		created_at: string;
		category: 'announcement' | 'discussion' | 'question' | 'event' | 'policy' | null;
		visibility: 'public' | 'members_only' | 'officers_only';
		comment_count: number;
		pinned_at: string | null;
	};

	let { 
		post, 
		href,
		showAssociation = false,
		associationName
	}: { 
		post: BulletinPost; 
		href: string;
		showAssociation?: boolean;
		associationName?: string;
	} = $props();

	function excerpt(text: string, maxLength = 120): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength).trim() + '...';
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		// Use absolute dates to avoid FOMO and anxiety from "X minutes ago" language
		return date.toLocaleDateString('en-US', { 
			year: 'numeric', 
			month: 'short', 
			day: 'numeric' 
		});
	}
</script>

<a {href} class="post-card">
	<div class="post-main">
		<div class="post-header">
			{#if post.pinned_at}
				<span class="post-pinned">📌</span>
			{/if}
			<h3 class="post-title">{post.title}</h3>
			<CategoryBadge category={post.category} />
		</div>
		
		<p class="post-preview">{excerpt(post.body)}</p>
		
		<div class="post-meta">
			{#if showAssociation && associationName}
				<span class="post-association">{associationName}</span>
				<span class="post-separator">•</span>
			{/if}
			<span class="post-author">{post.author_given_name} {post.author_family_name}</span>
			<span class="post-separator">•</span>
			<time class="post-date">{formatDate(post.created_at)}</time>
			{#if post.visibility !== 'public'}
				<span class="post-visibility">
					{post.visibility === 'members_only' ? '👥 Members' : '👔 Officers'}
				</span>
			{/if}
			{#if post.comment_count > 0}
				<span class="post-replies">{post.comment_count} {post.comment_count === 1 ? 'reply' : 'replies'}</span>
			{/if}
		</div>
	</div>
</a>

<style>
	.post-card {
		display: block;
		padding: var(--space-5);
		background: var(--paper);
		border: 1px solid var(--border);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.post-card:hover {
		border-color: var(--accent);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.post-main {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.post-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.post-pinned {
		font-size: var(--text-base);
	}

	.post-title {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		color: var(--text);
		margin: 0;
		line-height: 1.4;
		flex: 1;
	}

	.post-preview {
		font-size: var(--text-base);
		color: var(--text-muted);
		line-height: 1.5;
		margin: 0;
	}

	.post-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-muted);
		flex-wrap: wrap;
	}

	.post-association {
		font-weight: var(--weight-semibold);
		color: var(--accent);
	}

	.post-author {
		font-weight: var(--weight-medium);
		color: var(--text);
	}

	.post-separator {
		color: var(--text-muted);
	}

	.post-visibility {
		font-size: var(--text-xs);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		background: var(--bg-secondary);
		color: var(--text-muted);
	}

	.post-replies {
		font-weight: var(--weight-medium);
		color: var(--accent);
	}
</style>
