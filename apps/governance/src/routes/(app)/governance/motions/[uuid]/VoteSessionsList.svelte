<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@bfs/ui';
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

<div class="paper-card">
	<div class="paper-card__header">
		<h3 class="paper-card__title">Vote Sessions</h3>
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
									<button class="btn btn--sm btn--primary" type="submit">Open Now</button>
								</form>
							{:else if session.status === 'open'}
								<form method="POST" action="?/closeVoteSession" use:enhance>
									<input type="hidden" name="session_uuid" value={session.uuid} />
									<button class="btn btn--sm btn--secondary" type="submit">Close Session</button>
								</form>
							{:else if session.status === 'closed'}
								<form method="POST" action="?/finalizeVoteSession" use:enhance>
									<input type="hidden" name="session_uuid" value={session.uuid} />
									<button class="btn btn--sm btn--primary" type="submit">Finalize</button>
								</form>
							{/if}
							<a href="/governance/vote-sessions/{session.uuid}" class="btn btn--sm btn--ghost">
								View Details
							</a>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else if motionStatus === 'deliberation'}
		<p class="empty-state">No vote sessions scheduled yet. Create one to allow voting on this motion.</p>
	{/if}
</div>

<style>
	.paper-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}

	.paper-card__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-5);
	}

	.paper-card__title {
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

	.btn {
		display: inline-flex;
		align-items: center;
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-xs);
		font-weight: 500;
		border-radius: var(--radius);
		border: 1px solid transparent;
		cursor: pointer;
		text-decoration: none;
		transition: all 120ms;
	}

	.btn--sm {
		padding: 2px 8px;
	}

	.btn--primary {
		background: var(--color-accent);
		color: #fff;
	}

	.btn--primary:hover {
		background: var(--color-accent-hover);
	}

	.btn--secondary {
		background: var(--color-surface);
		color: var(--color-text);
		border-color: var(--color-border);
	}

	.btn--secondary:hover {
		background: var(--color-bg);
	}

	.btn--ghost {
		background: transparent;
		color: var(--color-accent);
	}

	.btn--ghost:hover {
		background: rgba(var(--color-accent-rgb), 0.1);
	}
</style>
