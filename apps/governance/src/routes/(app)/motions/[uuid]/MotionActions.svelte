<script lang="ts">
	import { enhance } from '$app/forms';

	type Motion = {
		uuid: string;
		status: string;
	};

	type DeliberationRule = {
		name: string;
		minimum_days: number;
	};

	type VoteTally = {
		aye_count: number;
		nay_count: number;
		abstain_count: number;
	};

	let {
		motion,
		canAdvance = false,
		currentDeliberationRule = null,
		activeMeetingUuid = null,
		alreadyVoted = false,
		tally = null
	}: {
		motion: Motion;
		canAdvance?: boolean;
		currentDeliberationRule?: DeliberationRule | null;
		activeMeetingUuid?: string | null;
		alreadyVoted?: boolean;
		tally?: VoteTally | null;
	} = $props();
</script>

{#if !['enacted','rejected','withdrawn'].includes(motion.status)}
	<div class="paper-card">
		<div class="paper-card__header">
			<h3 class="paper-card__title">Actions</h3>
		</div>
		<div class="action-row">
			{#if motion.status === 'draft' && canAdvance}
				<form method="POST" action="?/advance" use:enhance>
					<input type="hidden" name="to" value="introduced" />
					<button class="btn btn--primary">Introduce</button>
				</form>
			{/if}
			
			{#if motion.status === 'introduced'}
				{#if canAdvance}
					<form method="POST" action="?/advance" use:enhance>
						<input type="hidden" name="to" value="deliberation" />
						<button class="btn btn--primary">
							Begin Deliberation & Voting
						</button>
					</form>
				{/if}
			{/if}
			
			{#if motion.status === 'deliberation'}
				{#if currentDeliberationRule}
					<div class="deliberation-info">
						<span class="rule-label">Rule: <strong>{currentDeliberationRule.name}</strong></span>
					</div>
				{/if}
				
				{#if activeMeetingUuid}
					<!-- Voting is open during active meeting -->
					{#if !alreadyVoted}
						<form method="POST" action="?/castVote" class="vote-form" use:enhance>
							<button class="btn btn--aye" name="choice" value="aye">Aye</button>
							<button class="btn btn--nay" name="choice" value="nay">Nay</button>
							<button class="btn btn--abstain" name="choice" value="abstain">Abstain</button>
						</form>
					{:else}
						<span class="vote-recorded">Your vote is recorded.</span>
					{/if}
					<div class="meeting-notice">
						<a href="/general-assembly/meetings/{activeMeetingUuid}" class="meeting-link">
							🗳️ Voting is open - Meeting in progress
						</a>
					</div>
				{:else}
					<!-- No active meeting -->
					<div class="meeting-notice meeting-notice--waiting">
						<span>Voting will open when this motion is on the agenda of an active meeting</span>
					</div>
					{#if tally}
						<div class="vote-tally-preview">
							<h4>Current Vote Count</h4>
							<div class="tally-counts">
								<span class="tally-aye">Aye: {tally.aye_count}</span>
								<span class="tally-nay">Nay: {tally.nay_count}</span>
								<span class="tally-abstain">Abstain: {tally.abstain_count}</span>
							</div>
						</div>
					{/if}
				{/if}
			{/if}
			{#if canAdvance}
				<form method="POST" action="?/advance" use:enhance>
					<input type="hidden" name="to" value="withdrawn" />
					<button class="btn btn--danger">Withdraw</button>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style>
	.paper-card {
		background: linear-gradient(to bottom, #fdfdf8 0%, #f9f9f4 100%);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 4px 12px rgba(0, 0, 0, 0.08);
		border: 1px solid rgba(139, 115, 85, 0.15);
		border-radius: 2px;
		padding: var(--space-6);
		position: relative;
	}

	.paper-card::before {
		content: '';
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 1.5rem,
			rgba(139, 115, 85, 0.03) 1.5rem,
			rgba(139, 115, 85, 0.03) calc(1.5rem + 1px)
		);
		pointer-events: none;
		border-radius: 2px;
	}

	.paper-card > * {
		position: relative;
		z-index: 1;
	}

	.paper-card__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding-bottom: var(--space-4);
		border-bottom: 2px solid rgba(139, 115, 85, 0.2);
		margin-bottom: var(--space-4);
		flex-wrap: wrap;
	}

	.paper-card__title {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		color: #2c2416;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: var(--text-base);
	}

	.action-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: center;
	}

	.deliberation-info {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.rule-label {
		font-weight: 600;
		color: #7a5c1a;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.825em;
	}

	.vote-form {
		display: flex;
		gap: var(--space-2);
	}

	.vote-recorded {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.meeting-notice {
		margin-top: var(--space-3);
		padding: var(--space-3);
		background: rgba(91, 140, 184, 0.1);
		border: 1px solid rgba(91, 140, 184, 0.3);
		border-radius: var(--radius);
		text-align: center;
	}

	.meeting-notice--waiting {
		background: rgba(255, 193, 7, 0.1);
		border-color: rgba(255, 193, 7, 0.3);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.meeting-link {
		color: #5b8cb8;
		text-decoration: none;
		font-weight: var(--weight-medium);
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.meeting-link:hover {
		text-decoration: underline;
	}

	.vote-tally-preview {
		margin-top: var(--space-4);
		padding: var(--space-4);
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius);
	}

	.vote-tally-preview h4 {
		margin: 0 0 var(--space-3) 0;
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
	}

	.tally-counts {
		display: flex;
		gap: var(--space-4);
		justify-content: center;
	}

	.tally-counts span {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	.tally-aye {
		background: #e8f5e9;
		color: #2e7d32;
	}

	.tally-nay {
		background: #ffebee;
		color: #c62828;
	}

	.tally-abstain {
		background: #f5f5f5;
		color: #616161;
	}

	.btn--aye {
		background: #dcfce7;
		color: #166534;
	}

	.btn--nay {
		background: #fee2e2;
		color: #991b1b;
	}

	.btn--abstain {
		background: var(--color-bg, #f3f4f6);
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
	}

	.btn--danger {
		background: #fee2e2;
		color: #991b1b;
	}
</style>
