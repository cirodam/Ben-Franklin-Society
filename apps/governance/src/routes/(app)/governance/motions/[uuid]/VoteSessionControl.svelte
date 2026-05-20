<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Card } from '@bfs/ui';
	import { onMount } from 'svelte';

	type VoteSession = {
		uuid: string;
		status: string;
		outcome: string | null;
		opens_at: string;
		closes_at: string;
		passing_threshold: number;
		requires_quorum: number;
		quorum_threshold: number | null;
	};

	let {
		session,
		canControl = false,
		userCanVote = false,
		userHasVoted = false,
		motionTitle,
		onSessionChange,
		onOpenVoteModal
	}: {
		session: VoteSession;
		canControl?: boolean;
		userCanVote?: boolean;
		userHasVoted?: boolean;
		motionTitle: string;
		onSessionChange?: () => void;
		onOpenVoteModal?: () => void;
	} = $props();

	let timeRemaining = $state('');
	let intervalId: number | null = null;

	function updateTimeRemaining() {
		const now = new Date();
		const target = session.status === 'scheduled' 
			? new Date(session.opens_at) 
			: new Date(session.closes_at);
		
		const diff = target.getTime() - now.getTime();
		
		if (diff <= 0) {
			timeRemaining = session.status === 'scheduled' ? 'Ready to start' : 'Ended';
			if (intervalId) clearInterval(intervalId);
			return;
		}

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		if (days > 0) {
			timeRemaining = `${days}d ${hours}h ${minutes}m`;
		} else if (hours > 0) {
			timeRemaining = `${hours}h ${minutes}m ${seconds}s`;
		} else if (minutes > 0) {
			timeRemaining = `${minutes}m ${seconds}s`;
		} else {
			timeRemaining = `${seconds}s`;
		}
	}

	onMount(() => {
		updateTimeRemaining();
		intervalId = setInterval(updateTimeRemaining, 1000) as unknown as number;

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	});

	$effect(() => {
		updateTimeRemaining();
	});
</script>

<Card padding="lg" variant="accent">
	<div class="vote-control">
		{#if session.status === 'scheduled'}
			<div class="status-section">
				<div class="status-badge scheduled">
					<span class="badge-icon">📅</span>
					<div>
						<div class="badge-title">Vote Scheduled</div>
						<div class="badge-subtitle">Opens in {timeRemaining}</div>
					</div>
				</div>
				<div class="session-details">
					<div class="detail-item">Starts: {new Date(session.opens_at).toLocaleString()}</div>
					<div class="detail-item">Ends: {new Date(session.closes_at).toLocaleString()}</div>
					<div class="detail-item">
						Passing: {(session.passing_threshold * 100).toFixed(0)}%
						{#if session.requires_quorum}
							• Quorum: {(session.quorum_threshold! * 100).toFixed(0)}%
						{/if}
					</div>
				</div>
			</div>

			{#if canControl}
				<div class="control-actions">
					<form method="POST" action="?/openVoteSession" use:enhance={() => {
						return async ({ update }) => {
							await update();
							onSessionChange?.();
						};
					}}>
						<input type="hidden" name="session_uuid" value={session.uuid} />
						<Button variant="primary" type="submit">
							{#snippet children()}🗳️ Start Voting Now{/snippet}
						</Button>
					</form>
				</div>
			{/if}

		{:else if session.status === 'open'}
			<div class="status-section">
				<div class="status-badge open">
					<span class="badge-icon">🗳️</span>
					<div>
						<div class="badge-title">Vote Open</div>
						<div class="badge-subtitle">Closes in {timeRemaining}</div>
					</div>
				</div>
				<div class="session-details">
					<div class="detail-item">Started: {new Date(session.opens_at).toLocaleString()}</div>
					<div class="detail-item">Closes: {new Date(session.closes_at).toLocaleString()}</div>
					<div class="detail-item">
						Passing: {(session.passing_threshold * 100).toFixed(0)}%
						{#if session.requires_quorum}
							• Quorum: {(session.quorum_threshold! * 100).toFixed(0)}%
						{/if}
					</div>
				</div>
			</div>

			<div class="control-actions">
				{#if userHasVoted}
					<div class="vote-confirmation">
						<span class="check-icon">✓</span>
						<span>Your vote has been recorded</span>
					</div>
				{:else if userCanVote}
					<Button variant="primary" size="lg" onclick={onOpenVoteModal}>
						{#snippet children()}🗳️ Cast Your Vote{/snippet}
					</Button>
				{:else}
					<div class="cannot-vote-notice">
						You are not eligible to vote in this session
					</div>
				{/if}
				{#if canControl}
					<form method="POST" action="?/closeVoteSession" use:enhance={() => {
						return async ({ update }) => {
							await update();
							onSessionChange?.();
						};
					}}>
						<input type="hidden" name="session_uuid" value={session.uuid} />
						<Button variant="secondary" type="submit">
							{#snippet children()}End Vote & Count Ballots{/snippet}
						</Button>
					</form>
				{/if}
			</div>

		{:else if session.status === 'closed'}
			<div class="status-section">
				<div class="status-badge closed">
					<span class="badge-icon">🔒</span>
					<div>
						<div class="badge-title">Vote Closed</div>
						<div class="badge-subtitle">Ready to finalize</div>
					</div>
				</div>
				<div class="session-details">
					<div class="detail-item">Closed: {new Date(session.closes_at).toLocaleString()}</div>
				</div>
			</div>

			{#if canControl}
				<div class="control-actions">
					<form method="POST" action="?/finalizeVoteSession" use:enhance={() => {
						return async ({ update }) => {
							await update();
							onSessionChange?.();
						};
					}}>
						<input type="hidden" name="session_uuid" value={session.uuid} />
						<Button variant="primary" type="submit">
							{#snippet children()}Finalize Results{/snippet}
						</Button>
					</form>
				</div>
			{/if}

		{:else if session.status === 'finalized'}
			<div class="status-section">
				<div class="status-badge {session.outcome === 'passed' ? 'passed' : 'failed'}">
					<span class="badge-icon">{session.outcome === 'passed' ? '✅' : '❌'}</span>
					<div>
						<div class="badge-title">
							{#if session.outcome === 'passed'}
								Motion Adopted
							{:else}
								Motion Rejected
							{/if}
						</div>
						<div class="badge-subtitle">Vote finalized</div>
					</div>
				</div>
				<div class="session-details">
					<div class="detail-item">Closed: {new Date(session.closes_at).toLocaleString()}</div>
					<div class="detail-item">
						{#if session.outcome === 'passed'}
							✓ The motion has passed and is now adopted
						{:else}
							✗ The motion did not pass the vote
						{/if}
					</div>
				</div>
			</div>

			<div class="control-actions">
				<a href="/governance/vote-sessions/{session.uuid}">
					<Button variant="ghost">
						{#snippet children()}View Full Results{/snippet}
					</Button>
				</a>
			</div>
		{/if}
	</div>
</Card>

<style>
	.vote-control {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.status-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.status-badge {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: var(--radius);
		font-weight: 600;
	}

	.status-badge.scheduled {
		background: #e3f2fd;
		border: 2px solid #1565c0;
	}

	.status-badge.open {
		background: #fff3e0;
		border: 2px solid #e65100;
		animation: pulse 2s ease-in-out infinite;
	}

	.status-badge.closed {
		background: #f5f5f5;
		border: 2px solid #616161;
	}

	.status-badge.passed {
		background: #e8f5e9;
		border: 2px solid #2e7d32;
	}

	.status-badge.failed {
		background: #ffebee;
		border: 2px solid #c62828;
	}

	.badge-icon {
		font-size: 2rem;
		line-height: 1;
	}

	.badge-title {
		font-size: var(--text-lg);
		margin-bottom: 2px;
	}

	.badge-subtitle {
		font-size: var(--text-sm);
		font-weight: 500;
		opacity: 0.8;
	}

	.session-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.detail-item {
		display: flex;
		align-items: center;
	}

	.control-actions {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.vote-confirmation {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background: #e8f5e9;
		border: 2px solid #2e7d32;
		border-radius: var(--radius);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-weight: 600;
		color: #2e7d32;
	}

	.check-icon {
		font-size: 1.25rem;
		font-weight: bold;
	}

	.cannot-vote-notice {
		padding: var(--space-3) var(--space-4);
		background: #f5f5f5;
		border: 2px solid #9e9e9e;
		border-radius: var(--radius);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.vote-link {
		text-decoration: none;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.85;
		}
	}
</style>
