<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Badge, Button, Card, Textarea } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { contract, parties, milestones, events, actingAs, isParty, myParty, hasAcknowledged } =
		$derived(data);

	let showDisputeForm = $state(false);
	let showTerminateForm = $state(false);

	const statusColors: Record<string, 'neutral' | 'success' | 'warn' | 'danger'> = {
		draft: 'neutral',
		active: 'success',
		completed: 'success',
		disputed: 'warn',
		terminated: 'danger',
	};

	const allPartiesAcknowledged = $derived(parties.every((p) => p.signed_at !== null));
</script>

<div class="page">
	<div class="page-header">
		<a href="/contracts" class="back">← Contracts</a>
		<div class="header-row">
			<h1>{contract.title}</h1>
			<Badge label={contract.status} variant={statusColors[contract.status]} />
		</div>
	</div>

	<!-- Acknowledgment prompt -->
	{#if contract.status === 'draft' && isParty && !hasAcknowledged}
		<Alert variant="info">
			<p><strong>Acknowledgment Required</strong></p>
			<p>You are a party to this contract. Please review the agreement and acknowledge it below.</p>
			<form method="POST" action="?/acknowledge" use:enhance>
				<Button type="submit">I Acknowledge This Contract</Button>
			</form>
		</Alert>
	{/if}

	{#if contract.status === 'draft' && isParty && hasAcknowledged && !allPartiesAcknowledged}
		<Alert variant="success">
			<p>You have acknowledged this contract. Waiting for the other party to acknowledge.</p>
		</Alert>
	{/if}

	<!-- Contract Body -->
	<Card>
		<h2 class="card__title">Agreement</h2>
		<div class="contract-body">
			{contract.body}
		</div>

		<div class="contract-meta">
			{#if contract.effective_date}
				<div class="meta-item">
					<span class="meta-label">Effective Date:</span>
					<span class="meta-value">{contract.effective_date}</span>
				</div>
			{/if}
			{#if contract.expiry_date}
				<div class="meta-item">
					<span class="meta-label">Expiry Date:</span>
					<span class="meta-value">{contract.expiry_date}</span>
				</div>
			{/if}
			<div class="meta-item">
				<span class="meta-label">Created:</span>
				<span class="meta-value">{new Date(contract.created_at).toLocaleString()}</span>
			</div>
			{#if contract.activated_at}
				<div class="meta-item">
					<span class="meta-label">Activated:</span>
					<span class="meta-value">{new Date(contract.activated_at).toLocaleString()}</span>
				</div>
			{/if}
		</div>
	</Card>

	<!-- Parties -->
	<Card>
		<h2 class="card__title">Parties</h2>
		<div class="parties-list">
			{#each parties as party}
				<div class="party">
					<div class="party-info">
						<span class="party-name">{party.principal_name}</span>
						<span class="party-handle">@{party.principal_handle_display}</span>
						<span class="party-role">{party.role}</span>
					</div>
					<div class="party-status">
						{#if party.signed_at}
							<span class="acknowledged">✓ Acknowledged {new Date(party.signed_at).toLocaleDateString()}</span>
						{:else}
							<span class="pending">⏳ Pending acknowledgment</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</Card>

	<!-- Milestones -->
	{#if milestones.length > 0}
		<Card>
			<h2 class="card__title">Milestones</h2>
			<div class="milestones-list">
				{#each milestones as milestone}
					<div class="milestone milestone--{milestone.status}">
						<div class="milestone-header">
							<span class="milestone-status-icon">
								{#if milestone.status === 'attested'}
									✓
								{:else if milestone.status === 'skipped'}
									–
								{:else}
									○
								{/if}
							</span>
							<div class="milestone-info">
								<h3 class="milestone-title">{milestone.title}</h3>
								{#if milestone.description}
									<p class="milestone-description">{milestone.description}</p>
								{/if}
							</div>
							{#if milestone.due_date}
								<span class="milestone-due">Due: {milestone.due_date}</span>
							{/if}
						</div>

						{#if milestone.status === 'pending' && contract.status === 'active' && isParty}
							<div class="milestone-actions">
								<form method="POST" action="?/attestMilestone" use:enhance>
									<input type="hidden" name="milestone_uuid" value={milestone.uuid} />
									<button type="submit" class="btn btn--sm btn--success">Mark Complete</button>
								</form>
								<form method="POST" action="?/skipMilestone" use:enhance>
									<input type="hidden" name="milestone_uuid" value={milestone.uuid} />
									<button type="submit" class="btn btn--sm btn--secondary">Skip</button>
								</form>
							</div>
						{/if}

						{#if milestone.status === 'attested' && milestone.attested_at}
							<div class="milestone-attestation">
								Attested on {new Date(milestone.attested_at).toLocaleDateString()}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</Card>
	{/if}

	<!-- Actions -->
	{#if isParty && contract.status === 'active'}
		<Card>
			<h2 class="card__title">Actions</h2>
			<div class="actions-section">
				{#if !showDisputeForm}
					<button type="button" class="btn btn--warning" onclick={() => (showDisputeForm = true)}>
						Declare Dispute
					</button>
				{:else}
					<form method="POST" action="?/declareDispute" use:enhance class="dispute-form">
						<div class="field">
							<label for="reason">Dispute Reason</label>
							<textarea id="reason" name="reason" rows="4" required placeholder="Describe the issue..."></textarea>
						</div>
						<div class="form-actions">
							<button type="submit" class="btn btn--warning">Submit Dispute</button>
							<button type="button" class="btn btn--secondary" onclick={() => (showDisputeForm = false)}>Cancel</button>
						</div>
					</form>
				{/if}

				{#if !showTerminateForm}
					<button type="button" class="btn btn--danger" onclick={() => (showTerminateForm = true)}>
						Terminate Contract
					</button>
				{:else}
					<form method="POST" action="?/terminate" use:enhance class="terminate-form">
						<div class="field">
							<label for="terminate_reason">Termination Reason</label>
							<textarea id="terminate_reason" name="reason" rows="4" required placeholder="Reason for termination..."></textarea>
						</div>
						<div class="form-actions">
							<button type="submit" class="btn btn--danger">Terminate Contract</button>
							<button type="button" class="btn btn--secondary" onclick={() => (showTerminateForm = false)}>Cancel</button>
						</div>
					</form>
				{/if}
			</div>
		</Card>
	{/if}

	<!-- Event Log -->
	{#if events.length > 0}
		<Card>
			<h2 class="card__title">History</h2>
			<div class="events-list">
				{#each events as event}
					<div class="event">
						<span class="event-time">{new Date(event.recorded_at).toLocaleString()}</span>
						<span class="event-type">{event.event_type.replace(/_/g, ' ')}</span>
						{#if event.detail}
							<span class="event-detail">{event.detail}</span>
						{/if}
					</div>
				{/each}
			</div>
		</Card>
	{/if}
</div>

<style>
	.page {
		max-width: 900px;
		margin: 0 auto;
		padding: var(--space-6);
	}

	.page-header {
		margin-bottom: var(--space-6);
	}

	.back {
		display: inline-block;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		margin-bottom: var(--space-2);
	}

	.back:hover {
		color: var(--color-text);
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.header-row h1 {
		margin: 0;
		flex: 1;
	}

	.status-badge {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius);
		white-space: nowrap;
	}

	.alert {
		padding: var(--space-4);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-4);
		border: 1px solid;
	}

	.alert--info {
		background: #eff6ff;
		border-color: #93c5fd;
		color: #1e40af;
	}

	.alert--success {
		background: #dcfce7;
		border-color: #86efac;
		color: #166534;
	}

	.alert p {
		margin: 0 0 var(--space-2) 0;
	}

	.alert p:last-child {
		margin-bottom: 0;
	}

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
		margin-bottom: var(--space-4);
	}

	.card__title {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	.contract-body {
		white-space: pre-wrap;
		line-height: 1.8;
		font-family: Georgia, serif;
		padding: var(--space-4);
		background: var(--color-bg);
		border-radius: var(--radius);
		border: 1px solid var(--color-border);
	}

	.contract-meta {
		margin-top: var(--space-4);
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		font-size: var(--text-sm);
	}

	.meta-item {
		display: flex;
		gap: var(--space-1);
	}

	.meta-label {
		color: var(--color-text-muted);
	}

	.meta-value {
		font-weight: var(--weight-medium);
	}

	.parties-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.party {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.party-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.party-name {
		font-weight: var(--weight-semibold);
	}

	.party-handle {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.party-role {
		font-size: var(--text-sm);
		font-style: italic;
		color: var(--color-text-muted);
	}

	.party-status {
		font-size: var(--text-sm);
	}

	.acknowledged {
		color: #10b981;
		font-weight: var(--weight-medium);
	}

	.pending {
		color: var(--color-text-muted);
	}

	.milestones-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.milestone {
		padding: var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.milestone--attested {
		border-color: #10b981;
		background: #ecfdf5;
	}

	.milestone--skipped {
		border-color: var(--color-text-muted);
		background: #f9fafb;
		opacity: 0.7;
	}

	.milestone-header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.milestone-status-icon {
		font-size: var(--text-xl);
		flex-shrink: 0;
	}

	.milestone-info {
		flex: 1;
	}

	.milestone-title {
		margin: 0 0 var(--space-1) 0;
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
	}

	.milestone-description {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.milestone-due {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.milestone-actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-2);
		padding-top: var(--space-2);
		border-top: 1px solid var(--color-border);
	}

	.milestone-attestation {
		margin-top: var(--space-2);
		padding-top: var(--space-2);
		border-top: 1px solid var(--color-border);
		font-size: var(--text-sm);
		color: #10b981;
		font-weight: var(--weight-medium);
	}

	.actions-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.dispute-form,
	.terminate-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	textarea {
		padding: var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-family: inherit;
		font-size: var(--text-sm);
		resize: vertical;
	}

	textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.form-actions {
		display: flex;
		gap: var(--space-2);
	}

	.events-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.event {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-2);
		background: var(--color-bg);
		border-radius: var(--radius);
		font-size: var(--text-sm);
	}

	.event-time {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}

	.event-type {
		font-weight: var(--weight-medium);
		text-transform: capitalize;
	}

	.event-detail {
		color: var(--color-text-muted);
	}

	.btn {
		padding: var(--space-2) var(--space-4);
		border: none;
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		text-decoration: none;
		display: inline-block;
		text-align: center;
	}

	.btn--sm {
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-xs);
	}

	.btn--primary {
		background: var(--color-primary);
		color: white;
	}

	.btn--primary:hover {
		background: var(--color-primary-dark);
	}

	.btn--secondary {
		background: var(--color-surface-raised);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn--secondary:hover {
		background: var(--color-surface);
	}

	.btn--success {
		background: #10b981;
		color: white;
	}

	.btn--success:hover {
		background: #059669;
	}

	.btn--warning {
		background: #f59e0b;
		color: white;
	}

	.btn--warning:hover {
		background: #d97706;
	}

	.btn--danger {
		background: #ef4444;
		color: white;
	}

	.btn--danger:hover {
		background: #dc2626;
	}
</style>
