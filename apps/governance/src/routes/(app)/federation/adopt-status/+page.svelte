<script lang="ts">
	import { Alert, Badge, Button, Card, PageHeader } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);

	function truncateUuid(uuid: string): string {
		return uuid.substring(0, 8) + '...' + uuid.substring(uuid.length - 8);
	}

	function formatDate(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function refreshPage() {
		window.location.reload();
	}
</script>

<div class="page">
	<PageHeader 
		title="Adoption Request Status" 
		description="Check the status of your adoption request"
	>
		{#snippet actions()}
			<Button variant="secondary" href="/federation">
				Back to Federation
			</Button>
		{/snippet}
	</PageHeader>

	{#if form?.success === false && form?.error}
		<Alert variant="danger" title="Error">
			{form.error}
		</Alert>
	{/if}

	{#if data.error}
		<Alert variant="danger" title="Connection Error">
			{data.error}
		</Alert>
	{/if}

	<!-- Status: Approved -->
	{#if data.status === 'approved' && data.founding_record}
		<Alert variant="success" title="Adoption Approved! 🎉">
			Your adoption request has been approved. Review the founding record below and complete the adoption.
		</Alert>

		<Card>
			<div class="founding-record">
				<div class="record-header">
					<h3>Founding Record</h3>
					<Badge variant="success" label="Approved" />
				</div>

				<div class="record-section">
					<h4>Parent Society</h4>
					<div class="record-details">
						<div class="detail-row">
							<span class="detail-label">Handle:</span>
							<span class="detail-value">@{data.founding_record.parent.handle}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">UUID:</span>
							<code class="detail-value">{truncateUuid(data.founding_record.parent.uuid)}</code>
						</div>
					</div>
				</div>

				<div class="record-section">
					<h4>Child Society (You)</h4>
					<div class="record-details">
						<div class="detail-row">
							<span class="detail-label">Handle:</span>
							<span class="detail-value">@{data.founding_record.child.handle}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">UUID:</span>
							<code class="detail-value">{truncateUuid(data.founding_record.child.uuid)}</code>
						</div>
					</div>
				</div>

				<div class="record-section">
					<h4>Attestation</h4>
					<div class="attestation">
						{data.founding_record.parent_attestation}
					</div>
					<div class="founded-date">
						Founded: {formatDate(data.founding_record.founded_at)}
					</div>
				</div>

				{#if data.response_message}
					<div class="record-section">
						<h4>Message from Parent</h4>
						<div class="response-message">
							{data.response_message}
						</div>
					</div>
				{/if}

				<div class="record-section">
					<h4>Signature Verification</h4>
					<div class="signature-info">
						<Badge variant="success" label="✓ Valid Signature" />
						<p class="signature-note">
							This founding record is cryptographically signed by the parent society,
							establishing an immutable trust chain in the BFS network.
						</p>
					</div>
				</div>

				<div class="record-actions">
					<form 
						method="POST" 
						action="?/complete"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								await update();
								submitting = false;
							};
						}}
					>
						<input type="hidden" name="request_id" value={data.request_id} />
						<input type="hidden" name="parent_url" value={data.parent_url} />
						<Button 
							type="submit" 
							variant="primary" 
							size="large"
							disabled={submitting}
						>
							{submitting ? 'Completing Adoption...' : 'Complete Adoption'}
						</Button>
					</form>
					<p class="action-note">
						This will update your society identity to officially recognize 
						<strong>@{data.founding_record.parent.handle}</strong> as your parent.
					</p>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Status: Pending -->
	{#if data.status === 'pending'}
		<Alert variant="warning" title="Request Pending">
			Your adoption request is still pending review by the parent society.
		</Alert>

		<Card>
			<div class="pending-info">
				<h3>Waiting for Approval</h3>
				<p>
					The parent society needs to review and approve your request. This typically involves
					governance review and may take some time.
				</p>
				
				<div class="pending-details">
					<div class="detail-row">
						<span class="detail-label">Request ID:</span>
						<code class="detail-value">{truncateUuid(data.request_id)}</code>
					</div>
					<div class="detail-row">
						<span class="detail-label">Parent URL:</span>
						<code class="detail-value">{data.parent_url}</code>
					</div>
				</div>

				<div class="pending-actions">
					<Button variant="secondary" onclick={refreshPage}>
						Refresh Status
					</Button>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Status: Rejected -->
	{#if data.status === 'rejected'}
		<Alert variant="danger" title="Request Rejected">
			Your adoption request was not approved by the parent society.
		</Alert>

		<Card>
			<div class="rejected-info">
				<h3>Adoption Request Rejected</h3>
				
				{#if data.response_message}
					<div class="rejection-message">
						<strong>Reason:</strong>
						<p>{data.response_message}</p>
					</div>
				{:else}
					<p>The parent society has declined your adoption request.</p>
				{/if}

				<div class="next-steps">
					<h4>What's Next?</h4>
					<ul>
						<li>You can request adoption from a different society</li>
						<li>You can continue operating as an independent root society</li>
						<li>Consider reaching out to the parent society for more information</li>
					</ul>
				</div>

				<div class="rejected-actions">
					<Button variant="primary" href="/federation/adopt-request">
						Request Adoption from Another Society
					</Button>
					<Button variant="secondary" href="/federation">
						Back to Federation
					</Button>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Status: Not Found -->
	{#if data.status === 'not_found'}
		<Alert variant="danger" title="Request Not Found">
			Could not find or access the adoption request.
		</Alert>

		<Card>
			<div class="not-found-info">
				<h3>Unable to Find Request</h3>
				<p>
					The adoption request could not be found. This could mean:
				</p>
				<ul>
					<li>The request ID is incorrect</li>
					<li>The parent society URL is incorrect or unreachable</li>
					<li>The request may have been deleted</li>
				</ul>

				<div class="not-found-actions">
					<Button variant="primary" href="/federation/adopt-request">
						Submit a New Request
					</Button>
					<Button variant="secondary" href="/federation">
						Back to Federation
					</Button>
				</div>
			</div>
		</Card>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.founding-record,
	.pending-info,
	.rejected-info,
	.not-found-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.record-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--color-border);
	}

	.record-header h3 {
		margin: 0;
		font-size: 1.25rem;
	}

	.record-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-surface-secondary);
		border-radius: var(--radius-md);
	}

	.record-section h4 {
		margin: 0;
		font-size: 1rem;
		color: var(--color-text-secondary);
	}

	.record-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.detail-row {
		display: flex;
		gap: var(--space-2);
		align-items: baseline;
	}

	.detail-label {
		font-weight: 500;
		color: var(--color-text-secondary);
		min-width: 5rem;
	}

	.detail-value {
		color: var(--color-text-primary);
	}

	.attestation {
		padding: var(--space-3);
		background: var(--color-surface-tertiary);
		border-radius: var(--radius-sm);
		font-style: italic;
		line-height: 1.6;
	}

	.founded-date {
		font-size: 0.875rem;
		color: var(--color-text-tertiary);
	}

	.response-message,
	.rejection-message p {
		padding: var(--space-3);
		background: var(--color-surface-tertiary);
		border-radius: var(--radius-sm);
		line-height: 1.6;
	}

	.signature-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.signature-note {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
	}

	.record-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border);
	}

	.action-note {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
	}

	.pending-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		background: var(--color-surface-secondary);
		border-radius: var(--radius-sm);
	}

	.pending-actions,
	.rejected-actions,
	.not-found-actions {
		display: flex;
		gap: var(--space-3);
		padding-top: var(--space-3);
	}

	.next-steps {
		padding: var(--space-3);
		background: var(--color-surface-secondary);
		border-radius: var(--radius-sm);
	}

	.next-steps h4 {
		margin: 0 0 var(--space-2) 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.next-steps ul {
		margin: 0;
		padding-left: var(--space-4);
	}

	.next-steps li {
		margin: var(--space-1) 0;
		color: var(--color-text-secondary);
	}

	.pending-info h3,
	.rejected-info h3,
	.not-found-info h3 {
		margin: 0;
		font-size: 1.125rem;
	}

	.rejected-info > p,
	.not-found-info > p {
		margin: 0;
		color: var(--color-text-secondary);
		line-height: 1.6;
	}

	.not-found-info ul {
		margin: 0;
		padding-left: var(--space-4);
		color: var(--color-text-secondary);
	}

	.not-found-info li {
		margin: var(--space-1) 0;
	}

	@media (max-width: 768px) {
		.pending-actions,
		.rejected-actions,
		.not-found-actions {
			flex-direction: column;
		}
	}
</style>
