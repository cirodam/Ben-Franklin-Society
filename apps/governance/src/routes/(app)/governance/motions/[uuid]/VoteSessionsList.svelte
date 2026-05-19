<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Card } from '@bfs/ui';
	import Badge from '@bfs/ui/src/Badge.svelte';

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
		voteSessions = [],
		canCreateVoteSession = false,
		canAdvance = false,
		motionStatus,
		onCreateSession
	}: {
		voteSessions?: VoteSession[];
		canCreateVoteSession?: boolean;
		canAdvance?: boolean;
		motionStatus: string;
		onCreateSession?: () => void;
	} = $props();
</script>

<Card padding="lg">
	<div class="card-header">
		<h3 class="card-title">Vote Sessions</h3>
		{#if canCreateVoteSession && motionStatus === 'deliberation'}
			<Button variant="primary" size="sm" onclick={onCreateSession}>
				{#snippet children()}+ Create Vote Session{/snippet}
			</Button>
		{/if}
	</div>

	{#if voteSessions.length > 0}
		<div class="vote-sessions-list">
			{#each voteSessions as session}
				<div class="vote-session-item" class:is-active={session.status === 'open'}>
					<div class="session-status">
						{#if session.status === 'scheduled'}
							<span class="badge badge--scheduled">📅 Scheduled</span>
						{:else if session.status === 'open'}
							<span class="badge badge--open">🗳️ Open</span>
						{:else if session.status === 'closed'}
							<span class="badge badge--closed">🔒 Closed</span>
						{:else if session.status === 'finalized'}
							{#if session.outcome === 'passed'}
								<span class="badge badge--passed">✅ Passed</span>
							{:else}
								<span class="badge badge--failed">❌ Failed</span>
							{/if}
						{/if}
					</div>
					
					<div class="session-info">
						<div class="session-dates">
							<span class="session-date">Opens: {new Date(session.opens_at).toLocaleString()}</span>
							<span class="session-date">Closes: {new Date(session.closes_at).toLocaleString()}</span>
						</div>
						<div class="session-threshold">
							Passing: {(session.passing_threshold * 100).toFixed(0)}%
							{#if session.requires_quorum}
								• Quorum: {(session.quorum_threshold! * 100).toFixed(0)}%
							{/if}
						</div>
					</div>
					
					{#if canAdvance}
						<div class="session-actions">
							{#if session.status === 'scheduled'}
								<form method="POST" action="?/openVoteSession" use:enhance>
									<input type="hidden" name="session_uuid" value={session.uuid} />
									<Button variant="primary" size="sm" type="submit">
										{#snippet children()}Open Now{/snippet}
									</Button>
								</form>
							{:else if session.status === 'open'}
								<form method="POST" action="?/closeVoteSession" use:enhance>
									<input type="hidden" name="session_uuid" value={session.uuid} />
									<Button variant="secondary" size="sm" type="submit">
										{#snippet children()}Close Session{/snippet}
									</Button>
								</form>
							{:else if session.status === 'closed'}
								<form method="POST" action="?/finalizeVoteSession" use:enhance>
									<input type="hidden" name="session_uuid" value={session.uuid} />
									<Button variant="primary" size="sm" type="submit">
										{#snippet children()}Finalize{/snippet}
									</Button>
								</form>
							{/if}
							<Button variant="ghost" size="sm" onclick={() => window.location.href = `/governance/vote-sessions/${session.uuid}`}>
								{#snippet children()}View Details{/snippet}
							</Button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else if motionStatus === 'deliberation'}
		<p class="empty-state">No vote sessions scheduled yet. Create one to allow voting on this motion.</p>
	{/if}
</Card>

<style>
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-5);
	}

	.card-title {
		font-size: var(--text-xl);
		font-weight: 600;
		margin: 0;
	}

	.vote-sessions-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.vote-session-item {
		display: flex;
		gap: var(--space-4);
		padding: var(--space-4);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.vote-session-item.is-active {
		border-color: var(--color-accent);
		background: rgba(var(--color-accent-rgb), 0.05);
	}

	.session-status {
		flex-shrink: 0;
	}

	.badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: var(--text-xs);
		font-weight: 600;
	}

	.badge--scheduled {
		background: #e3f2fd;
		color: #1565c0;
	}

	.badge--open {
		background: #fff3e0;
		color: #e65100;
	}

	.badge--closed {
		background: #f5f5f5;
		color: #616161;
	}

	.badge--passed {
		background: #e8f5e9;
		color: #2e7d32;
	}

	.badge--failed {
		background: #ffebee;
		color: #c62828;
	}

	.session-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.session-dates {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.session-date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.session-threshold {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.session-actions {
		display: flex;
		gap: var(--space-2);
		flex-shrink: 0;
		align-items: center;
	}

	.empty-state {
		padding: var(--space-6);
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
</style>
