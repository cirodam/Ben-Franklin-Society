<script lang="ts">
	type VoteRule = {
		uuid: string;
		name: string;
		numerator: number;
		denominator: number;
	};

	type VoteTally = {
		motion_uuid: string;
		eligible_count: number;
		aye_count: number;
		nay_count: number;
		abstain_count: number;
		opened_at: string;
		closed_at: string | null;
	};

	let {
		tally,
		currentRule = null
	}: {
		tally: VoteTally;
		currentRule?: VoteRule | null;
	} = $props();

	const ayePct = $derived(
		tally.eligible_count > 0
			? Math.round((tally.aye_count / tally.eligible_count) * 100)
			: 0
	);
	
	const nayPct = $derived(
		tally.eligible_count > 0
			? Math.round((tally.nay_count / tally.eligible_count) * 100)
			: 0
	);
</script>

<div class="paper-card">
	<div class="paper-card__header">
		<h3 class="paper-card__title">
			{tally.closed_at ? 'Vote Closed' : 'Vote in Progress'}
		</h3>
		<div class="paper-card__meta">
			{#if currentRule}
				<span class="paper-card__badge">{currentRule.name}</span>
			{/if}
			{#if tally.closed_at}
				<span class="paper-card__date">{new Date(tally.closed_at).toLocaleDateString()}</span>
			{/if}
		</div>
	</div>
	<div class="vote-stats">
		<div class="vote-stat vote-stat--aye">
			<span class="vote-stat__count">{tally.aye_count}</span>
			<span class="vote-stat__label">Aye</span>
		</div>
		<div class="vote-stat vote-stat--nay">
			<span class="vote-stat__count">{tally.nay_count}</span>
			<span class="vote-stat__label">Nay</span>
		</div>
		<div class="vote-stat">
			<span class="vote-stat__count">{tally.abstain_count}</span>
			<span class="vote-stat__label">Abstain</span>
		</div>
		<div class="vote-stat">
			<span class="vote-stat__count">{tally.eligible_count}</span>
			<span class="vote-stat__label">Eligible</span>
		</div>
	</div>
	<div class="vote-bar" title="{ayePct}% aye, {nayPct}% nay">
		<div class="vote-bar__aye" style="width: {ayePct}%"></div>
		<div class="vote-bar__nay" style="width: {nayPct}%"></div>
	</div>
	<p class="vote-caption">
		{tally.aye_count + tally.nay_count + tally.abstain_count} of {tally.eligible_count} voted
		({ayePct}% aye)
	</p>
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

	.paper-card__meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.paper-card__badge {
		font-size: var(--text-xs);
		background: rgba(139, 115, 85, 0.1);
		color: var(--color-text-muted);
		padding: 2px 8px;
		border-radius: var(--radius);
		font-weight: var(--weight-medium);
	}

	.paper-card__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.vote-stats {
		display: flex;
		gap: var(--space-6);
		margin: var(--space-4) 0;
	}

	.vote-stat {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.vote-stat__count {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
	}

	.vote-stat__label {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.vote-stat--aye .vote-stat__count { color: #065f46; }
	.vote-stat--nay .vote-stat__count { color: #991b1b; }

	.vote-bar {
		height: 8px;
		background: rgba(139, 115, 85, 0.1);
		border-radius: var(--radius-full);
		overflow: hidden;
		display: flex;
		margin: var(--space-3) 0;
	}

	.vote-bar__aye { background: #86efac; height: 100%; }
	.vote-bar__nay { background: #fca5a5; height: 100%; }

	.vote-caption {
		margin: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
</style>
