<script lang="ts">
	import { Alert, Badge, Button, Card, EmptyState, PageHeader, Textarea } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submittingId = $state<string | null>(null);
	let expandedId = $state<string | null>(null);
	let responseMessages = $state<Record<string, string>>({});

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function truncateUuid(uuid: string): string {
		return uuid.substring(0, 8) + '...' + uuid.substring(uuid.length - 8);
	}

	function toggleExpand(requestId: string) {
		expandedId = expandedId === requestId ? null : requestId;
	}

	const pendingRequests = $derived(data.requests.filter((r) => r.status === 'pending'));
	const historicalRequests = $derived(data.requests.filter((r) => r.status !== 'pending'));
</script>

<div class="page">
	<PageHeader 
		title="Adoption Requests" 
		description="Manage societies requesting to be adopted"
	>
		{#snippet actions()}
			<Button variant="secondary" href="/federation">
				Back to Federation
			</Button>
		{/snippet}
	</PageHeader>

	{#if form?.success}
		<Alert variant="success" title="Success">
			{form.action === 'approve' ? 'Adoption approved!' : 'Adoption rejected'}
		</Alert>
	{/if}

	{#if form?.error}
		<Alert variant="danger" title="Error">
			{form.error}
		</Alert>
	{/if}

	<!-- Pending Requests -->
	{#if pendingRequests.length > 0}
		<div class="section">
			<h2 class="section-title">Pending Requests</h2>
			
			<div class="requests-list">
				{#each pendingRequests as request}
					<Card>
						<div class="request-card">
							<div class="request-header">
								<div class="request-info">
									<h3 class="request-society">@{request.child_handle}</h3>
									<code class="request-uuid">{truncateUuid(request.child_uuid)}</code>
								</div>
								<div class="request-meta">
									<Badge variant="warning" label="Pending" />
									<span class="request-date">{formatDate(request.requested_at)}</span>
								</div>
							</div>

							{#if request.message}
								<div class="request-message">
									<strong>Message:</strong>
									<p>{request.message}</p>
								</div>
							{/if}

							{#if request.child_bfs_url || request.child_endpoint}
								<div class="request-connectivity">
									<strong>Connectivity:</strong>
									{#if request.child_bfs_url}
										<div><code>{request.child_bfs_url}</code></div>
									{/if}
									{#if request.child_endpoint}
										<div><code>{request.child_endpoint}</code></div>
									{/if}
								</div>
							{/if}

							<div class="request-actions">
								<Button 
									variant="ghost"
									onclick={() => toggleExpand(request.request_id)}
								>
									{expandedId === request.request_id ? 'Hide' : 'Show'} Actions
								</Button>
							</div>

							{#if expandedId === request.request_id}
								<div class="action-forms">
									<!-- Approve Form -->
									<form 
										method="POST" 
										action="?/approve"
										use:enhance={() => {
											submittingId = request.request_id;
											return async ({ update }) => {
												await update();
												submittingId = null;
												expandedId = null;
											};
										}}
									>
										<input type="hidden" name="request_id" value={request.request_id} />
										
										<div class="action-form">
											<h4>Approve Adoption</h4>
											<Textarea
												name="response_message"
												placeholder="Optional message to the child society..."
												rows={2}
												bind:value={responseMessages[request.request_id]}
											/>
											<Button 
												type="submit" 
												variant="primary"
												disabled={submittingId === request.request_id}
											>
												{submittingId === request.request_id ? 'Approving...' : 'Approve'}
											</Button>
										</div>
									</form>

									<!-- Reject Form -->
									<form 
										method="POST" 
										action="?/reject"
										use:enhance={() => {
											submittingId = request.request_id;
											return async ({ update }) => {
												await update();
												submittingId = null;
												expandedId = null;
											};
										}}
									>
										<input type="hidden" name="request_id" value={request.request_id} />
										
										<div class="action-form">
											<h4>Reject Adoption</h4>
											<Textarea
												name="response_message"
												placeholder="Optional reason for rejection..."
												rows={2}
											/>
											<Button 
												type="submit" 
												variant="danger"
												disabled={submittingId === request.request_id}
											>
												{submittingId === request.request_id ? 'Rejecting...' : 'Reject'}
											</Button>
										</div>
									</form>
								</div>
							{/if}
						</div>
					</Card>
				{/each}
			</div>
		</div>
	{:else}
		<EmptyState
			icon="📬"
			title="No Pending Requests"
			description="No societies have requested adoption."
		/>
	{/if}

	<!-- Historical Requests -->
	{#if historicalRequests.length > 0}
		<div class="section">
			<h2 class="section-title">History</h2>
			
			<div class="requests-list">
				{#each historicalRequests as request}
					<Card>
						<div class="request-card">
							<div class="request-header">
								<div class="request-info">
									<h3 class="request-society">@{request.child_handle}</h3>
									<code class="request-uuid">{truncateUuid(request.child_uuid)}</code>
								</div>
								<div class="request-meta">
									<Badge 
										variant={request.status === 'approved' ? 'success' : 'danger'} 
										label={request.status === 'approved' ? 'Approved' : 'Rejected'} 
									/>
									<span class="request-date">
										{request.responded_at ? formatDate(request.responded_at) : 'No response date'}
									</span>
								</div>
							</div>

							{#if request.response_message}
								<div class="request-message">
									<strong>Response:</strong>
									<p>{request.response_message}</p>
								</div>
							{/if}
						</div>
					</Card>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.section {
		margin-bottom: 2rem;
	}

	.section-title {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.requests-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.request-card {
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

	.request-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.request-society {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.request-uuid {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.request-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
	}

	.request-date {
		font-size: 0.875rem;
		color: var(--color-text-tertiary);
	}

	.request-message {
		padding: 0.75rem;
		background: var(--color-surface-secondary);
		border-radius: 0.5rem;
	}

	.request-message strong {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.request-message p {
		margin: 0;
		line-height: 1.5;
	}

	.request-connectivity {
		padding: 0.75rem;
		background: var(--color-surface-tertiary);
		border-radius: 0.5rem;
		font-size: 0.875rem;
	}

	.request-connectivity strong {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--color-text-secondary);
	}

	.request-connectivity code {
		display: block;
		padding: 0.25rem 0;
		color: var(--color-text-primary);
	}

	.request-actions {
		display: flex;
		justify-content: flex-end;
	}

	.action-forms {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.action-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-surface-secondary);
		border-radius: 0.5rem;
	}

	.action-form h4 {
		margin: 0;
		font-size: 1rem;
	}

	@media (max-width: 768px) {
		.request-header {
			flex-direction: column;
		}

		.request-meta {
			align-items: flex-start;
		}

		.action-forms {
			grid-template-columns: 1fr;
		}
	}
</style>
