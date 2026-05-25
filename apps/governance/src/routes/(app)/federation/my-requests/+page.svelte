<script lang="ts">
	import { Button, Card, Badge, Alert } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	function formatDate(timestamp: number): string {
		return new Date(timestamp * 1000).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusVariant(status: string | null): 'neutral' | 'success' | 'warn' | 'danger' {
		if (!status) return 'neutral';
		switch (status) {
			case 'approved': return 'success';
			case 'rejected': return 'danger';
			case 'pending': return 'neutral';
			default: return 'neutral';
		}
	}
</script>

<div class="my-requests-page">
	<div class="page-header">
		<div>
			<h1>My Adoption Requests</h1>
			<p class="page-description">
				Adoption requests you've sent to parent societies
			</p>
		</div>
		<Button href="/federation/adopt-request" variant="primary">
			Request Adoption
		</Button>
	</div>

	{#if data.requests.length === 0}
		<Card>
			<Alert variant="info">
				You haven't sent any adoption requests yet. Click "Request Adoption" to request adoption from a parent society.
			</Alert>
		</Card>
	{:else}
		<div class="requests-list">
			{#each data.requests as request}
				<Card>
					<div class="request-item">
						<div class="request-header">
							<div>
								<h3 class="request-title">
									{request.parent_handle || 'Unknown Parent'}
								</h3>
								<p class="request-meta">
									Requested {formatDate(request.requested_at)}
									{#if request.last_checked}
										· Last checked {formatDate(request.last_checked)}
									{/if}
								</p>
							</div>
							<div class="request-badges">
								{#if request.completed}
									<Badge variant="success" label="Completed" />
								{:else if request.status}
									<Badge 
										variant={getStatusVariant(request.status)} 
										label={request.status}
									/>
								{:else}
									<Badge variant="neutral" label="Unknown" />
								{/if}
							</div>
						</div>

						{#if request.message}
							<div class="request-message">
								<strong>Your message:</strong>
								<p>{request.message}</p>
							</div>
						{/if}

						<div class="request-details">
							<div class="detail-item">
								<span class="detail-label">Parent URL:</span>
								<code class="detail-value">{request.parent_url}</code>
							</div>
							{#if request.parent_uuid}
								<div class="detail-item">
									<span class="detail-label">Parent UUID:</span>
									<code class="detail-value">{request.parent_uuid}</code>
								</div>
							{/if}
						</div>

						{#if !request.completed}
							<div class="request-actions">
								<Button 
									href="/federation/adopt-status?request_id={request.request_id}&parent_url={encodeURIComponent(request.parent_url)}"
									variant="primary"
								>
									Check Status
								</Button>
							</div>
						{/if}
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<style>
	.my-requests-page {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 2rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 600;
	}

	.page-description {
		margin: 0;
		color: #666;
	}

	.requests-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.request-item {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.request-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.request-title {
		margin: 0 0 0.25rem 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.request-meta {
		margin: 0;
		font-size: 0.875rem;
		color: #666;
	}

	.request-badges {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.request-message {
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 0.5rem;
	}

	.request-message strong {
		display: block;
		margin-bottom: 0.5rem;
	}

	.request-message p {
		margin: 0;
		white-space: pre-wrap;
	}

	.request-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: #f9f9f9;
		border-radius: 0.5rem;
	}

	.detail-item {
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
	}

	.detail-label {
		font-weight: 600;
		color: #666;
		min-width: 100px;
	}

	.detail-value {
		font-family: monospace;
		font-size: 0.875rem;
		background: white;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		word-break: break-all;
	}

	.request-actions {
		display: flex;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #e0e0e0;
	}

	@media (max-width: 768px) {
		.my-requests-page {
			padding: 1rem;
		}

		.page-header {
			flex-direction: column;
		}

		.request-header {
			flex-direction: column;
		}
	}
</style>
