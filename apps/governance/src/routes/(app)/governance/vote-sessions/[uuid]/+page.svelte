<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Badge from '@bfs/ui/src/Badge.svelte';
	import { Button, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const statusVariant = (s: string) =>
		s === 'open' ? 'success'
		: s === 'finalized' ? 'neutral'
		: s === 'scheduled' ? 'accent'
		: 'warn'; // closed

	const outcomeVariant = (o: string | null) =>
		o === 'passed' ? 'success' : o === 'failed' ? 'danger' : 'neutral';

	function formatDateTime(dt: string | null): string {
		if (!dt) return '—';
		const d = new Date(dt);
		return d.toLocaleString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function formatPercentage(val: number): string {
		return `${(val * 100).toFixed(1)}%`;
	}

	let selectedVote = $state<'aye' | 'nay' | 'abstain' | null>(null);
	let submitting = $state(false);
</script>

<div class="page">
	<div class="breadcrumb">
		<a href="/governance/vote-sessions">← Vote Sessions</a>
	</div>

	<PageHeader 
		title="Vote Session"
		description={data.motion.title}
	>
		<div class="header-meta">
			<Badge variant={statusVariant(data.session.status)}>{data.session.status}</Badge>
			{#if data.session.outcome}
				<Badge variant={outcomeVariant(data.session.outcome)}>{data.session.outcome}</Badge>
			{/if}
		</div>
	</PageHeader>

	<div class="content-layout">
		<!-- Main Column: Voting Interface or Results -->
		<div class="main-column">
			<!-- Voting Booth (if can vote) -->
			{#if data.session.status === 'open' && data.userCanVote && !data.userHasVoted}
				<section class="card voting-booth">
					<h2>Cast Your Vote</h2>
					<p class="voting-instructions">
						Your vote is <strong>secret</strong>. Only the tally is recorded, not individual votes.
					</p>

					<form method="POST" action="?/vote" use:enhance={() => {
						submitting = true;
						return async ({ result, update }) => {
							submitting = false;
							if (result.type === 'success') {
								await update();
							}
						};
					}}>
						<div class="vote-choices">
							<label class="vote-choice" class:selected={selectedVote === 'aye'}>
								<input 
									type="radio" 
									name="choice" 
									value="aye" 
									bind:group={selectedVote}
									required
								/>
								<span class="choice-label aye">Aye</span>
								<span class="choice-desc">Support the motion</span>
							</label>

							<label class="vote-choice" class:selected={selectedVote === 'nay'}>
								<input 
									type="radio" 
									name="choice" 
									value="nay" 
									bind:group={selectedVote}
									required
								/>
								<span class="choice-label nay">Nay</span>
								<span class="choice-desc">Oppose the motion</span>
							</label>

							<label class="vote-choice" class:selected={selectedVote === 'abstain'}>
								<input 
									type="radio" 
									name="choice" 
									value="abstain" 
									bind:group={selectedVote}
									required
								/>
								<span class="choice-label abstain">Abstain</span>
								<span class="choice-desc">No position</span>
							</label>
						</div>

						<Button 
							type="submit" 
							variant="primary" 
							disabled={!selectedVote || submitting}
							fullWidth
						>
							{submitting ? 'Submitting...' : 'Submit Vote'}
						</Button>
					</form>
				</section>
			{:else if data.session.status === 'open' && data.userHasVoted}
				<section class="card">
					<div class="vote-confirmation">
						<span class="check-icon">✓</span>
						<h2>Vote Recorded</h2>
						<p>Your vote has been securely recorded. You cannot change your vote.</p>
					</div>
				</section>
			{:else if data.session.status === 'scheduled'}
				<section class="card">
					<div class="status-message">
						<h2>Voting Not Yet Open</h2>
						<p>This vote session opens on <strong>{formatDateTime(data.session.opens_at)}</strong></p>
					</div>
				</section>
			{:else if data.session.status === 'closed'}
				<section class="card">
					<div class="status-message">
						<h2>Voting Closed</h2>
						<p>This vote session closed on <strong>{formatDateTime(data.session.closed_at)}</strong></p>
						<p class="muted">Awaiting finalization to determine outcome.</p>
					</div>
				</section>
			{/if}

			<!-- Tally Results (for closed/finalized) -->
			{#if (data.session.status === 'closed' || data.session.status === 'finalized') && data.tally}
				<section class="card tally-card">
					<h2>Vote Tally</h2>
					
					<div class="tally-grid">
						<div class="tally-item aye">
							<span class="tally-label">Aye</span>
							<span class="tally-value">{data.tally.aye_count}</span>
						</div>
						<div class="tally-item nay">
							<span class="tally-label">Nay</span>
							<span class="tally-value">{data.tally.nay_count}</span>
						</div>
						<div class="tally-item abstain">
							<span class="tally-label">Abstain</span>
							<span class="tally-value">{data.tally.abstain_count}</span>
						</div>
					</div>

					<div class="tally-stats">
						<div class="stat">
							<span class="stat-label">Total Votes</span>
							<span class="stat-value">{data.tally.total_votes}</span>
						</div>
						<div class="stat">
							<span class="stat-label">Eligible Voters</span>
							<span class="stat-value">{data.tally.eligible_count}</span>
						</div>
						<div class="stat">
							<span class="stat-label">Participation</span>
							<span class="stat-value">{formatPercentage(data.tally.participation_rate)}</span>
						</div>
					</div>

					{#if data.session.outcome}
						<div class="outcome-box {data.session.outcome}">
							<strong>Outcome:</strong> {data.session.outcome.toUpperCase()}
						</div>
					{/if}
				</section>
			{/if}

			<!-- Admin Actions -->
			{#if data.session.status === 'open' && data.canClose}
				<section class="card admin-actions">
					<h3>Session Management</h3>
					<form method="POST" action="?/close" use:enhance>
						<Button type="submit" variant="warn">Close Voting</Button>
					</form>
				</section>
			{/if}

			{#if data.session.status === 'closed' && data.canFinalize}
				<section class="card admin-actions">
					<h3>Session Management</h3>
					<form method="POST" action="?/finalize" use:enhance>
						<Button type="submit" variant="primary">Finalize and Determine Outcome</Button>
					</form>
				</section>
			{/if}
		</div>

		<!-- Sidebar: Session Details -->
		<aside class="sidebar">
			<section class="card info-card">
				<h3>Session Information</h3>
				
				<div class="info-grid">
					<div class="info-item">
						<span class="info-label">Motion</span>
						<a href="/governance/motions/{data.motion.slug}" class="info-value link">
							{data.motion.title}
						</a>
					</div>

					<div class="info-item">
						<span class="info-label">Body</span>
						<span class="info-value">{data.body?.name ?? 'Unknown'}</span>
					</div>

					<div class="info-item">
						<span class="info-label">Opened By</span>
						<span class="info-value">
							{#if data.opener}
								<a href="/organization/people/{data.session.opened_by}" class="link">
									{data.opener.given_name} {data.opener.family_name}
								</a>
							{:else}
								Unknown
							{/if}
						</span>
					</div>

					<div class="info-item">
						<span class="info-label">Opens At</span>
						<span class="info-value">{formatDateTime(data.session.opens_at)}</span>
					</div>

					<div class="info-item">
						<span class="info-label">Closes At</span>
						<span class="info-value">{formatDateTime(data.session.closes_at)}</span>
					</div>

					{#if data.session.closed_at}
						<div class="info-item">
							<span class="info-label">Closed At</span>
							<span class="info-value">{formatDateTime(data.session.closed_at)}</span>
						</div>
					{/if}

					{#if data.session.finalized_at}
						<div class="info-item">
							<span class="info-label">Finalized At</span>
							<span class="info-value">{formatDateTime(data.session.finalized_at)}</span>
						</div>
					{/if}
				</div>
			</section>

			<section class="card info-card">
				<h3>Voting Rules</h3>
				
				<div class="info-grid">
					<div class="info-item">
						<span class="info-label">Passing Threshold</span>
						<span class="info-value">{formatPercentage(data.session.passing_threshold)}</span>
					</div>

					<div class="info-item">
						<span class="info-label">Quorum Required</span>
						<span class="info-value">{data.session.requires_quorum ? 'Yes' : 'No'}</span>
					</div>

					{#if data.session.requires_quorum && data.session.quorum_threshold !== null}
						<div class="info-item">
							<span class="info-label">Quorum Threshold</span>
							<span class="info-value">{formatPercentage(data.session.quorum_threshold)}</span>
						</div>
					{/if}
				</div>
			</section>
		</aside>
	</div>
</div>

<style>
	.page {
		max-width: 1400px;
		margin: 0 auto;
		padding: var(--space-6);
	}

	.breadcrumb {
		margin-bottom: var(--space-4);
	}

	.breadcrumb a {
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.breadcrumb a:hover {
		color: var(--color-text);
	}

	.header-meta {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}

	.content-layout {
		display: grid;
		grid-template-columns: 1fr 350px;
		gap: var(--space-4);
		align-items: start;
	}

	.main-column {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-5);
	}

	.card h2 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-xl);
	}

	.card h3 {
		margin: 0 0 var(--space-3) 0;
		font-size: var(--text-lg);
	}

	.voting-booth {
		border: 2px solid var(--color-primary);
	}

	.voting-instructions {
		color: var(--color-text-muted);
		margin-bottom: var(--space-5);
	}

	.vote-choices {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.vote-choice {
		display: flex;
		flex-direction: column;
		padding: var(--space-4);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s;
	}

	.vote-choice:hover {
		border-color: var(--color-primary);
		background: var(--color-primary-bg);
	}

	.vote-choice.selected {
		border-color: var(--color-primary);
		background: var(--color-primary-bg);
	}

	.vote-choice input[type="radio"] {
		position: absolute;
		opacity: 0;
	}

	.choice-label {
		font-weight: 600;
		font-size: var(--text-lg);
		margin-bottom: var(--space-1);
	}

	.choice-label.aye { color: var(--color-success); }
	.choice-label.nay { color: var(--color-danger); }
	.choice-label.abstain { color: var(--color-text-muted); }

	.choice-desc {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.vote-confirmation {
		text-align: center;
		padding: var(--space-6);
	}

	.check-icon {
		display: inline-block;
		width: 60px;
		height: 60px;
		line-height: 60px;
		font-size: 36px;
		color: var(--color-success);
		background: var(--color-success-bg);
		border-radius: 50%;
		margin-bottom: var(--space-4);
	}

	.status-message {
		text-align: center;
		padding: var(--space-4);
	}

	.status-message .muted {
		color: var(--color-text-muted);
		margin-top: var(--space-2);
	}

	.tally-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
		margin-bottom: var(--space-5);
	}

	.tally-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-4);
		border-radius: var(--radius-md);
		border: 2px solid;
	}

	.tally-item.aye {
		border-color: var(--color-success);
		background: var(--color-success-bg);
	}

	.tally-item.nay {
		border-color: var(--color-danger);
		background: var(--color-danger-bg);
	}

	.tally-item.abstain {
		border-color: var(--color-border);
		background: var(--color-surface-alt);
	}

	.tally-label {
		font-weight: 600;
		text-transform: uppercase;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.tally-value {
		font-size: var(--text-3xl);
		font-weight: 700;
		margin-top: var(--space-2);
	}

	.tally-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-surface-alt);
		border-radius: var(--radius-md);
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--space-1);
	}

	.stat-value {
		font-size: var(--text-xl);
		font-weight: 600;
	}

	.outcome-box {
		margin-top: var(--space-4);
		padding: var(--space-4);
		border-radius: var(--radius-md);
		text-align: center;
		font-size: var(--text-lg);
	}

	.outcome-box.passed {
		background: var(--color-success-bg);
		color: var(--color-success);
		border: 2px solid var(--color-success);
	}

	.outcome-box.failed {
		background: var(--color-danger-bg);
		color: var(--color-danger);
		border: 2px solid var(--color-danger);
	}

	.admin-actions {
		background: var(--color-surface-alt);
	}

	.info-card {
		background: var(--color-surface);
	}

	.info-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.info-label {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.info-value {
		font-size: var(--text-base);
	}

	.link {
		color: var(--color-primary);
		text-decoration: none;
	}

	.link:hover {
		text-decoration: underline;
	}

	@media (max-width: 900px) {
		.content-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
