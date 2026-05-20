<script lang="ts">
	import { Button, Card } from '@bfs/ui';

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
		voteSessions = []
	}: {
		voteSessions?: VoteSession[];
	} = $props();
</script>

<Card padding="lg">
	<div class="card-header">
		<h3 class="card-title">Vote History</h3>
	</div>

	{#if voteSessions.length > 0}
		<div class="vote-sessions-list">
			{#each voteSessions as session}
				<div class="vote-session-item">
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
							<span class="session-date">Opened: {new Date(session.opens_at).toLocaleString()}</span>
							<span class="session-date">Closed: {new Date(session.closes_at).toLocaleString()}</span>
						</div>
						<div class="session-threshold">
							Passing: {(session.passing_threshold * 100).toFixed(0)}%
							{#if session.requires_quorum}
								• Quorum: {(session.quorum_threshold! * 100).toFixed(0)}%
							{/if}
						</div>
					</div>
					
					<div class="session-actions">
						<Button variant="ghost" size="sm" onclick={() => window.location.href = `/governance/vote-sessions/${session.uuid}`}>
							{#snippet children()}View Details{/snippet}
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="empty-state">No previous vote sessions.</p>
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
