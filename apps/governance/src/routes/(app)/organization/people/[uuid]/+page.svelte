<script lang="ts">
	import { Badge, Card, PageHeader } from '@bfs/ui';
	
	const { data } = $props();

	function excerpt(text: string, length = 120): string {
		if (text.length <= length) return text;
		return text.slice(0, length) + '...';
	}

	function formatCompensation(franks: number): string {
		if (franks === 0) return 'Volunteer';
		return `${franks.toLocaleString()}F`;
	}

	const statusVariant = (s: string): 'success' | 'warning' | 'danger' => {
		if (s === 'active') return 'success';
		if (s === 'suspended') return 'warning';
		return 'danger';
	};
</script>

<div class="page">
	<PageHeader title="{data.person.given_name} {data.person.family_name}">
		{#if data.person.handle}
			<p class="handle">@{data.person.handle}</p>
		{/if}
	</PageHeader>

	<div class="sections">
		<Card>
			<h2>Profile</h2>
			<dl class="profile-details">
				<dt>Status</dt>
				<dd><Badge label={data.person.status} variant={statusVariant(data.person.status)} /></dd>
				
				{#if data.person.date_of_birth}
					<dt>Date of Birth</dt>
					<dd>{new Date(data.person.date_of_birth).toLocaleDateString()}</dd>
				{/if}
				
				{#if data.person.notes}
					<dt>Notes</dt>
					<dd>{data.person.notes}</dd>
				{/if}
			</dl>
		</Card>

		{#if data.roles.length > 0}
			<Card>
				<h2>Roles ({data.roles.length})</h2>
				<div class="roles-list">
					{#each data.roles as role}
						<div class="role-card">
							<div class="role-header">
								<h3 class="role-name">{role.title}</h3>
							</div>
							<div class="role-association">
								<a href="/organization/associations/{role.association_uuid}">
									{role.association_name}
								</a>
							</div>
							{#if role.description}
								<div class="role-description">{role.description}</div>
							{/if}
							<div class="role-meta">
								<span>{formatCompensation(role.compensation_franks)}</span>
								<span>Since {new Date(role.assigned_at).toLocaleDateString()}</span>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		{/if}

		{#if data.posts.length > 0}
			<Card>
				<h2>Recent Bulletin Posts ({data.posts.length})</h2>
				<div class="posts-list">
					{#each data.posts as post}
						<a href="/communications/bulletin/{post.uuid}" class="post-card" style="background-color: {post.color}">
							<h3 class="post-title">{post.title}</h3>
							<p class="post-excerpt">{excerpt(post.body)}</p>
							<div class="post-meta">
								<span>{new Date(post.created_at).toLocaleDateString()}</span>
								<span>{post.comment_count} comment{post.comment_count === 1 ? '' : 's'}</span>
							</div>
						</a>
					{/each}
				</div>
			</Card>
		{/if}
	</div>
</div>

<style>
	.page {
		max-width: 900px;
		margin: 0 auto;
	}

	.handle {
		margin: var(--space-2) 0 0;
		font-size: var(--text-lg);
		color: var(--color-text-muted);
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.sections h2 {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-4);
		color: var(--color-text);
	}

	.profile-details {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-2) var(--space-4);
		font-size: var(--text-sm);
	}

	.profile-details dt {
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
	}

	.profile-details dd {
		margin: 0;
		color: var(--color-text);
	}

	.roles-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.role-card {
		padding: var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.role-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.role-name {
		margin: 0;
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.role-association {
		margin-bottom: var(--space-2);
	}

	.role-association a {
		color: var(--color-accent);
		text-decoration: none;
		font-size: var(--text-sm);
	}

	.role-association a:hover {
		text-decoration: underline;
	}

	.role-meta {
		display: flex;
		gap: var(--space-4);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.posts-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-4);
	}

	.post-card {
		display: block;
		padding: var(--space-4);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: var(--color-text);
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.post-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.post-title {
		margin: 0 0 var(--space-2);
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		color: inherit;
	}

	.post-excerpt {
		margin: 0 0 var(--space-3);
		font-size: var(--text-sm);
		line-height: 1.5;
		color: rgba(0, 0, 0, 0.7);
	}

	.post-meta {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-xs);
		color: rgba(0, 0, 0, 0.6);
	}
</style>
