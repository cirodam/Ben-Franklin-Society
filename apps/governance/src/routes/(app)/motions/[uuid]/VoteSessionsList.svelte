<script lang="ts">
	import Badge from '@bfs/ui/src/Badge.svelte';

	type VoteSession = {
		uuid: string;
		status: string;
		outcome: string | null;
		opens_at: string;
		closes_at: string;
	};

	let {
		voteSessions = [],
		motionUuid,
		canCreateVoteSession = false
	}: {
		voteSessions?: VoteSession[];
		motionUuid: string;
		canCreateVoteSession?: boolean;
	} = $props();
</script>

<div class="paper-card">
	<div class="paper-card__header">
		<h3 class="paper-card__title">Vote Sessions</h3>
		{#if canCreateVoteSession}
			<a href="/vote-sessions/new?motion_uuid={motionUuid}" class="btn btn--secondary btn--sm">
				Schedule Vote Session
			</a>
		{/if}
	</div>

	{#if voteSessions && voteSessions.length > 0}
		<div class="vote-sessions-list">
			{#each voteSessions as session}
				<a href="/vote-sessions/{session.uuid}" class="vote-session-card">
					<div class="vote-session-card__header">
						<Badge variant={
							session.status === 'open' ? 'success'
							: session.status === 'finalized' ? 'neutral'
							: session.status === 'scheduled' ? 'accent'
							: 'warn'
						}>
							{session.status}
						</Badge>
						{#if session.outcome}
							<Badge variant={session.outcome === 'passed' ? 'success' : 'danger'}>
								{session.outcome}
							</Badge>
						{/if}
					</div>
					<div class="vote-session-card__time">
						Opens: {new Date(session.opens_at).toLocaleDateString()}
					</div>
					<div class="vote-session-card__time">
						Closes: {new Date(session.closes_at).toLocaleDateString()}
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<p class="empty-message">
			No vote sessions scheduled yet.
			{#if canCreateVoteSession}
				<a href="/vote-sessions/new?motion_uuid={motionUuid}">Schedule one now</a>
			{/if}
		</p>
	{/if}
</div>

<style>
	.paper-card {
		background: rgba(255, 255, 255, 0.9);
		border: 2px solid rgba(139, 115, 85, 0.3);
		border-radius: 4px;
		padding: var(--space-6);
		box-shadow: 0 2px 8px rgba(139, 115, 85, 0.1);
		margin-bottom: var(--space-4);
	}

	.paper-card__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.paper-card__title {
		margin: 0;
		color: #5a4a2a;
		font-family: 'Georgia', serif;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: var(--text-base);
	}

	.vote-sessions-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.vote-session-card {
		display: block;
		padding: var(--space-4);
		border: 1px solid rgba(139, 115, 85, 0.2);
		border-radius: 4px;
		background: rgba(250, 245, 235, 0.5);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.vote-session-card:hover {
		border-color: rgba(139, 115, 85, 0.4);
		background: rgba(250, 245, 235, 0.8);
		transform: translateX(4px);
	}

	.vote-session-card__header {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.vote-session-card__time {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: var(--space-1) 0;
	}

	.empty-message {
		text-align: center;
		padding: var(--space-6);
		color: var(--color-text-muted);
	}

	.empty-message a {
		color: var(--color-primary);
	}
</style>
