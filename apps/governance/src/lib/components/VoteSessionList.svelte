<script lang="ts">
	import { Badge } from '@bfs/ui';

	interface VoteSession {
		uuid: string;
		motion_uuid: string;
		motion_title: string;
		status: string;
		outcome: string | null;
		opens_at: string;
		closes_at: string;
		tally?: {
			aye_count: number;
			nay_count: number;
			abstain_count: number;
			participation_rate: number;
		} | null;
	}

	interface Props {
		sessions: VoteSession[];
	}

	let { sessions }: Props = $props();

	const sessionStatusVariant = (status: string): 'success' | 'warning' | 'neutral' | 'info' => {
		switch (status) {
			case 'open': return 'warning';
			case 'finalized': return 'neutral';
			case 'closed': return 'info';
			default: return 'neutral';
		}
	};

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

{#if sessions.length > 0}
	<div class="list">
		{#each sessions as session}
			<a href="/governance/motions/{session.motion_uuid}" class="list-item">
				<div class="list-item__header">
					<Badge label={session.status} variant={sessionStatusVariant(session.status)} />
					{#if session.outcome}
						<Badge 
							label={session.outcome} 
							variant={session.outcome === 'passed' ? 'success' : 'danger'} 
						/>
					{/if}
				</div>
				<h3 class="list-item__title">{session.motion_title}</h3>
				<div class="list-item__meta">
					<span>Opens: {formatDate(session.opens_at)}</span>
					<span>·</span>
					<span>Closes: {formatDate(session.closes_at)}</span>
					{#if session.tally}
						<span>·</span>
						<span>
							{session.tally.aye_count} aye, 
							{session.tally.nay_count} nay, 
							{session.tally.abstain_count} abstain
							({Math.round(session.tally.participation_rate * 100)}% turnout)
						</span>
					{/if}
				</div>
			</a>
		{/each}
	</div>
{:else}
	<div class="empty-state">
		<p>🗳️</p>
		<p class="empty-state__message">No vote sessions yet</p>
	</div>
{/if}

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.list-item {
		display: block;
		padding: var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.list-item:hover {
		border-color: var(--color-accent);
		box-shadow: var(--shadow-sm);
		text-decoration: none;
	}

	.list-item__header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.list-item__title {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-2) 0;
		line-height: 1.3;
	}

	.list-item__meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.empty-state {
		padding: var(--space-12) var(--space-6);
		text-align: center;
	}

	.empty-state p:first-child {
		font-size: 4rem;
		margin: 0 0 var(--space-4) 0;
	}

	.empty-state__message {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-4) 0;
	}

	@media (max-width: 768px) {
		.list-item__title {
			font-size: var(--text-base);
		}
	}
</style>
