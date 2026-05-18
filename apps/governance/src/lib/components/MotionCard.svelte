<script lang="ts">
	interface Motion {
		uuid: string;
		motion_number: number;
		title: string;
		status: string;
		created_at: string;
		vote_opened_at?: string | null;
		enacted_at?: string | null;
		rejected_at?: string | null;
	}

	interface Comment {
		uuid: string;
	}

	interface Tally {
		eligible: number;
		voted: number;
		aye: number;
		nay: number;
		abstain: number;
	}

	let { 
		motion, 
		bodyAbbreviation = null,
		comments = [], 
		tally = null,
		variant = 'default'
	}: { 
		motion: Motion; 
		bodyAbbreviation?: string | null;
		comments?: Comment[]; 
		tally?: Tally | null;
		variant?: 'default' | 'vote' | 'deliberation';
	} = $props();

	const motionId = $derived(() => {
		if (bodyAbbreviation) {
			return `${bodyAbbreviation} ${motion.motion_number}`;
		}
		return `#${motion.motion_number}`;
	});

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'draft': return 'badge-draft';
			case 'introduced': return 'badge-introduced';
			case 'deliberation': return 'badge-deliberation';
			case 'enacted': return 'badge-enacted';
			case 'rejected': return 'badge-rejected';
			case 'withdrawn': return 'badge-withdrawn';
			default: return '';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'draft': return 'Draft';
			case 'introduced': return 'Introduced';
			case 'deliberation': return 'Deliberation & Voting';
			case 'enacted': return 'Enacted';
			case 'rejected': return 'Rejected';
			case 'withdrawn': return 'Withdrawn';
			default: return status;
		}
	}

	function formatDate(isoString: string): string {
		const date = new Date(isoString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) return 'today';
		if (diffDays === 1) return 'yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		return date.toLocaleDateString();
	}

	function getVotePercentage(t: Tally): number {
		if (t.eligible === 0) return 0;
		return Math.round((t.voted / t.eligible) * 100);
	}

	const cardClass = $derived(() => {
		if (variant === 'vote') return 'card card--vote';
		if (variant === 'deliberation') return 'card card--deliberation';
		return 'card';
	});
</script>

<a href="/governance/motions/{motion.uuid}" class={cardClass()}>
	<div class="card__header">
		<div class="card__title-row">
			<span class="motion-id">{motionId()}</span>
			<h3 class="card__title">{motion.title}</h3>
		</div>
		<span class="badge {getStatusBadgeClass(motion.status)}">{getStatusLabel(motion.status)}</span>
	</div>
	
	{#if tally && variant === 'vote'}
		<div class="vote-progress">
			<div class="vote-progress__bar">
				<div class="vote-progress__fill" style="width: {getVotePercentage(tally)}%"></div>
			</div>
			<div class="vote-stats">
				<span>{tally.voted} of {tally.eligible} voted ({getVotePercentage(tally)}%)</span>
				<span class="vote-stats__breakdown">
					{tally.aye} aye · {tally.nay} nay · {tally.abstain} abstain
				</span>
			</div>
		</div>
	{/if}
	
	<div class="card__meta">
		<span>
			{#if variant === 'vote' && motion.vote_opened_at}
				Opened {formatDate(motion.vote_opened_at)}
			{:else if motion.enacted_at}
				Enacted {formatDate(motion.enacted_at)}
			{:else if motion.rejected_at}
				Rejected {formatDate(motion.rejected_at)}
			{:else}
				Introduced {formatDate(motion.created_at)}
			{/if}
		</span>
		<span>{comments.length} comments</span>
	</div>
</a>

<style>
	.card {
		display: block;
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.card:hover {
		border-color: var(--color-accent);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		text-decoration: none;
	}

	.card--vote {
		border-left: 4px solid #f59e0b;
		background: linear-gradient(to right, #fef3c7 0%, var(--color-surface) 10%);
	}

	.card--deliberation {
		border-left: 4px solid #8b5cf6;
		background: linear-gradient(to right, #ede9fe 0%, var(--color-surface) 10%);
	}

	.card__header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.card__title-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		flex: 1;
	}

	.motion-id {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.card__title {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 0;
		flex: 1;
	}

	.card__meta {
		display: flex;
		gap: var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.vote-progress {
		margin: var(--space-4) 0;
	}

	.vote-progress__bar {
		height: 8px;
		background: var(--color-border-faint);
		border-radius: var(--radius);
		overflow: hidden;
		margin-bottom: var(--space-2);
	}

	.vote-progress__fill {
		height: 100%;
		background: var(--color-accent);
		transition: width 0.3s;
	}

	.vote-stats {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.vote-stats__breakdown {
		font-weight: var(--weight-medium);
	}

	.badge {
		display: inline-block;
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		border-radius: var(--radius);
		white-space: nowrap;
	}

	.badge-draft { background: #f3f4f6; color: #6b7280; }
	.badge-introduced { background: #dbeafe; color: #1e40af; }
	.badge-deliberation { background: #ede9fe; color: #6b21a8; }
	.badge-vote { background: #fef3c7; color: #92400e; }
	.badge-enacted { background: #d1fae5; color: #065f46; }
	.badge-rejected { background: #fee2e2; color: #991b1b; }
	.badge-withdrawn { background: #f3f4f6; color: #6b7280; }
</style>
