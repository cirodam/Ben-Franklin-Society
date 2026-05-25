<script lang="ts">
	import { Card, Badge, Button } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	function formatDate(timestamp: number): string {
		return new Date(timestamp * 1000).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function truncate(str: string, length: number): string {
		if (str.length <= length) return str;
		return str.substring(0, length) + '...';
	}
</script>

<div class="societies-page">
	<div class="page-header">
		<div>
			<h1>Registered Societies</h1>
			<p class="subtitle">
				Showing {data.societies.length} of {data.total.toLocaleString()} societies
			</p>
		</div>
	</div>

	{#if data.societies.length === 0}
		<Card>
			<div class="empty-state">
				<p>No societies registered yet</p>
			</div>
		</Card>
	{:else}
		<div class="societies-list">
			{#each data.societies as society}
				<Card>
					<div class="society-card">
						<div class="society-header">
							<div class="society-title">
								<h3>
									<a href="/societies/{society.handle}" class="society-link">
										{society.handle}
									</a>
								</h3>
								<div class="society-badges">
									{#if !society.parent_uuid}
										<Badge variant="success" label="Root" />
									{/if}
									{#if society.status !== 'active'}
										<Badge variant="danger" label={society.status} />
									{/if}
								</div>
							</div>
							<div class="society-meta">
								<span class="meta-item">
									Founded: {formatDate(society.founded_at)}
								</span>
								{#if society.people_count}
									<span class="meta-item">
										{society.people_count.toLocaleString()} members
									</span>
								{/if}
							</div>
						</div>

						<div class="society-details">
							<div class="detail-row">
								<span class="detail-label">UUID:</span>
								<code class="detail-value">{truncate(society.uuid, 36)}</code>
							</div>

							{#if society.parent_uuid}
								<div class="detail-row">
									<span class="detail-label">Parent:</span>
									<code class="detail-value">{truncate(society.parent_uuid, 36)}</code>
								</div>
							{/if}

							{#if society.url}
								<div class="detail-row">
									<span class="detail-label">URL:</span>
									<a href={society.url} class="detail-link" target="_blank" rel="noopener">
										{society.url}
									</a>
								</div>
							{/if}

							{#if society.bfs_url}
								<div class="detail-row">
									<span class="detail-label">BFS URL:</span>
									<span class="detail-value">{society.bfs_url}</span>
								</div>
							{/if}

							<div class="detail-row">
								<span class="detail-label">Public Key:</span>
								<code class="detail-value mono-small">{truncate(society.public_key, 60)}</code>
							</div>
						</div>
					</div>
				</Card>
			{/each}
		</div>

		{#if data.totalPages > 1}
			<div class="pagination">
				{#if data.page > 1}
					<Button href="/societies?page={data.page - 1}" variant="secondary">
						Previous
					</Button>
				{/if}
				<span class="page-info">
					Page {data.page} of {data.totalPages}
				</span>
				{#if data.page < data.totalPages}
					<Button href="/societies?page={data.page + 1}" variant="secondary">
						Next
					</Button>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.societies-page {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 600;
	}

	.subtitle {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: 1rem;
	}

	.societies-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.society-card {
		padding: 1.5rem;
	}

	.society-header {
		margin-bottom: 1.5rem;
	}

	.society-title {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.society-title h3 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.society-link {
		color: var(--color-text);
		text-decoration: none;
		font-family: monospace;
	}

	.society-link:hover {
		color: var(--color-primary);
	}

	.society-badges {
		display: flex;
		gap: 0.5rem;
	}

	.society-meta {
		display: flex;
		gap: 1.5rem;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.society-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.detail-row {
		display: flex;
		gap: 1rem;
		align-items: baseline;
	}

	.detail-label {
		font-weight: 600;
		color: var(--color-text-secondary);
		min-width: 100px;
		font-size: 0.9rem;
	}

	.detail-value {
		color: var(--color-text);
		font-size: 0.9rem;
	}

	code.detail-value {
		font-family: monospace;
		background: var(--color-surface-elevated);
		padding: 0.25rem 0.5rem;
		border-radius: 3px;
	}

	.mono-small {
		font-size: 0.8rem;
	}

	.detail-link {
		color: var(--color-primary);
		text-decoration: none;
	}

	.detail-link:hover {
		text-decoration: underline;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 2rem;
		padding: 2rem 0;
	}

	.page-info {
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.empty-state {
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-state p {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: 1.1rem;
		font-style: italic;
	}
</style>
