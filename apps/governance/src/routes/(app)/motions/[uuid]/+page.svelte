<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { motion, introducer, body, tally, voteRules, currentRule, deliberationRules, currentDeliberationRule, deliberationComplete, daysRemainingInDeliberation, comments, canAdvance, canCloseVote, alreadyVoted, hasMarkedMotionReady, readinessCount, readinessSigners, actingAs } = $derived(data);

	let editingCommentUuid = $state<string | null>(null);
	let editingCommentBody = $state('');
	let editingClerkNotes = $state(false);
	let clerkNotesValue = $state(motion.clerk_notes || '');
	let editingParliamentarianNotes = $state(false);
	let parliamentarianNotesValue = $state(motion.parliamentarian_notes || '');

	function startEditComment(uuid: string, currentBody: string) {
		editingCommentUuid = uuid;
		editingCommentBody = currentBody;
	}

	function startEditClerkNotes() {
		editingClerkNotes = true;
		clerkNotesValue = motion.clerk_notes || '';
	}

	function startEditParliamentarianNotes() {
		editingParliamentarianNotes = true;
		parliamentarianNotesValue = motion.parliamentarian_notes || '';
	}

	const statusVariant: Record<string, string> = {
		draft:        'status--draft',
		introduced:   'status--introduced',
		deliberation: 'status--deliberation',
		enacted:      'status--enacted',
		rejected:     'status--rejected',
		withdrawn:    'status--withdrawn',
	};

	const statusLabel: Record<string, string> = {
		draft:        'Draft',
		introduced:   'Introduced',
		deliberation: 'Deliberation & Voting',
		enacted:      'Enacted',
		rejected:     'Rejected',
		withdrawn:    'Withdrawn',
	};

	const ayePct = $derived(
		tally && tally.eligible_count > 0
			? Math.round((tally.aye_count / tally.eligible_count) * 100)
			: 0
	);
	const nayPct = $derived(
		tally && tally.eligible_count > 0
			? Math.round((tally.nay_count / tally.eligible_count) * 100)
			: 0
	);

	// Live countdown timer for deliberation
	let timeRemaining = $state<{ days: number; hours: number; minutes: number; seconds: number; expired: boolean } | null>(null);

	$effect(() => {
		if (motion.status !== 'deliberation' || !motion.deliberation_opened_at || !currentDeliberationRule) {
			timeRemaining = null;
			return;
		}

		function updateTimer() {
			if (!motion.deliberation_opened_at || !currentDeliberationRule) return;
			
			const openedAt = new Date(motion.deliberation_opened_at);
			const durationMs = currentDeliberationRule.minimum_days * 24 * 60 * 60 * 1000;
			const endTime = new Date(openedAt.getTime() + durationMs);
			const now = new Date();
			const diff = endTime.getTime() - now.getTime();

			if (diff <= 0) {
				timeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
			} else {
				const days = Math.floor(diff / (1000 * 60 * 60 * 24));
				const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
				const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
				const seconds = Math.floor((diff % (1000 * 60)) / 1000);
				timeRemaining = { days, hours, minutes, seconds, expired: false };
			}
		}

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	});
</script>

<div class="page">
	<a href="/motions" class="back">← Motions</a>

	<!-- Paper Document -->
	<div class="paper">
		<div class="paper__header">
			<div class="paper__letterhead">
				{#if body}
					{body.name}
				{:else}
					The Ben Franklin Society
				{/if}
			</div>
			<div class="paper__motion-number">
				{#if body?.abbreviation}
					{body.abbreviation} {motion.motion_number}
				{:else}
					Motion #{motion.motion_number}
				{/if}
			</div>
		</div>

		<div class="paper__title">
			{motion.title}
		</div>

		<div class="paper__meta">
			<div class="paper__meta-row">
				<span class="paper__meta-label">Introduced by:</span>
				<span class="paper__meta-value">
					{#if introducer}
						{introducer.given_name} {introducer.family_name}
					{:else}
						Unknown
					{/if}
				</span>
			</div>
			<div class="paper__meta-row">
				<span class="paper__meta-label">Date:</span>
				<span class="paper__meta-value">{new Date(motion.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
			</div>
			<div class="paper__meta-row">
				<span class="paper__meta-label">Status:</span>
				<span class="paper__status {statusVariant[motion.status] ?? ''}">{statusLabel[motion.status] ?? motion.status}</span>
			</div>
			{#if timeRemaining}
				<div class="paper__meta-row">
					<span class="paper__meta-label">Time Remaining:</span>
					<span class="paper__timer {timeRemaining.expired ? 'paper__timer--expired' : ''}">
						{#if timeRemaining.expired}
							<span class="timer-ready">✓ Ready to Close</span>
						{:else}
							<span class="timer-segment">{timeRemaining.days}<span class="timer-unit">d</span></span>
							<span class="timer-segment">{timeRemaining.hours.toString().padStart(2, '0')}<span class="timer-unit">h</span></span>
							<span class="timer-segment">{timeRemaining.minutes.toString().padStart(2, '0')}<span class="timer-unit">m</span></span>
							<span class="timer-segment timer-segment--seconds">{timeRemaining.seconds.toString().padStart(2, '0')}<span class="timer-unit">s</span></span>
						{/if}
					</span>
				</div>
			{/if}
		</div>

		<div class="paper__divider"></div>

		<div class="paper__body">
			{motion.body}
		</div>

		{#if motion.reasoning}
			<div class="paper__section">
				<div class="paper__section-title">Reasoning</div>
				<div class="paper__section-body">
					{motion.reasoning}
				</div>
			</div>
		{/if}

		{#if motion.clerk_notes}
			<div class="paper__section">
				<div class="paper__section-title">Clerk's Notes</div>
				<div class="paper__section-body">
					{motion.clerk_notes}
				</div>
			</div>
		{/if}

		{#if motion.parliamentarian_notes}
			<div class="paper__section">
				<div class="paper__section-title">Parliamentarian's Notes</div>
				<div class="paper__section-body">
					{motion.parliamentarian_notes}
				</div>
			</div>
		{/if}
	</div>

	<!-- Readiness Indicator (for introduced motions) -->
	{#if motion.status === 'introduced'}
		<div class="card readiness-card">
			<div class="card__header">
				<h3 class="card__title">Motion Readiness</h3>
				<span class="readiness-badge">
					{readinessCount} of 15
				</span>
			</div>
			
			<div class="readiness-progress">
				<div class="readiness-progress__bar">
					<div class="readiness-progress__fill" style="width: {Math.min((readinessCount / 15) * 100, 100)}%"></div>
				</div>
				<p class="readiness-progress__text">
					{#if readinessCount >= 15}
						✓ Ready to advance to deliberation
					{:else}
						{15 - readinessCount} more {15 - readinessCount === 1 ? 'member' : 'members'} needed to advance
					{/if}
				</p>
			</div>

			{#if actingAs}
				<div class="readiness-actions">
					{#if hasMarkedMotionReady}
						<form method="POST" action="?/unmarkReady" use:enhance>
							<button type="submit" class="btn btn--secondary btn--sm">
								✓ Marked Ready
							</button>
						</form>
						<p class="muted" style="font-size: var(--text-xs);">You've indicated this motion is ready to advance</p>
					{:else}
						<form method="POST" action="?/markReady" use:enhance>
							<button type="submit" class="btn btn--primary btn--sm">
								Mark Ready to Advance
							</button>
						</form>
						<p class="muted" style="font-size: var(--text-xs);">Signal that you're ready for this motion to enter deliberation</p>
					{/if}
				</div>
			{/if}

			{#if readinessSigners.length > 0}
				<div class="readiness-signers">
					<h4 class="readiness-signers__title">Members Ready ({readinessSigners.length})</h4>
					<div class="readiness-signers__list">
						{#each readinessSigners as signer}
							<div class="signer-badge">
								<span class="signer-badge__avatar">
									{signer.given_name[0]}{signer.family_name[0]}
								</span>
								<span class="signer-badge__name">
									{signer.given_name} {signer.family_name}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Vote Tally (if voting) -->
	{#if tally}
		<div class="vote-card">
			<div class="vote-card__header">
				<span class="vote-card__title">
					{tally.closed_at ? `Vote Closed` : 'Vote in Progress'}
				</span>
				{#if currentRule}
					<span class="vote-card__rule">{currentRule.name}</span>
				{/if}
				{#if tally.closed_at}
					<span class="vote-card__date">{new Date(tally.closed_at).toLocaleDateString()}</span>
				{/if}
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
	{/if}

	<!-- Administrative Cards -->
	{#if (motion.clerk_notes || canAdvance) && !motion.clerk_notes}
		<div class="card">
			<div class="card__label">
				Clerk's Notes
				{#if canAdvance && !editingClerkNotes}
					<button type="button" class="btn-inline" onclick={startEditClerkNotes}>Add Notes</button>
				{/if}
			</div>
			{#if editingClerkNotes}
				<form method="POST" action="?/setClerkNotes" use:enhance={() => {
					return ({ update }) => {
						update().then(() => {
							editingClerkNotes = false;
						});
					};
				}}>
					<textarea 
						name="clerk_notes" 
						bind:value={clerkNotesValue}
						class="clerk-notes-input"
						rows="4"
						placeholder="Administrative reminders for actions needed if this motion passes..."></textarea>
					<div class="form-actions">
						<button type="submit" class="btn btn--primary btn--sm">Save</button>
						<button type="button" class="btn btn--secondary btn--sm" onclick={() => editingClerkNotes = false}>Cancel</button>
					</div>
				</form>
			{:else}
				<p class="muted">No notes yet</p>
			{/if}
		</div>
	{/if}

	{#if (motion.parliamentarian_notes || canAdvance) && !motion.parliamentarian_notes}
		<div class="card">
			<div class="card__label">
				Parliamentarian's Notes
				{#if canAdvance && !editingParliamentarianNotes}
					<button type="button" class="btn-inline" onclick={startEditParliamentarianNotes}>Add Notes</button>
				{/if}
			</div>
			{#if editingParliamentarianNotes}
				<form method="POST" action="?/setParliamentarianNotes" use:enhance={() => {
					return ({ update }) => {
						update().then(() => {
							editingParliamentarianNotes = false;
						});
					};
				}}>
					<textarea 
						name="parliamentarian_notes" 
						bind:value={parliamentarianNotesValue}
						class="clerk-notes-input"
						rows="4"
						placeholder="Procedural notes, rule interpretations, precedent references..."></textarea>
					<div class="form-actions">
						<button type="submit" class="btn btn--primary btn--sm">Save</button>
						<button type="button" class="btn btn--secondary btn--sm" onclick={() => editingParliamentarianNotes = false}>Cancel</button>
					</div>
				</form>
			{:else}
				<p class="muted">No notes yet</p>
			{/if}
		</div>
	{/if}

	<!-- Edit Notes (if notes exist) -->
	{#if canAdvance && (motion.clerk_notes || motion.parliamentarian_notes)}
		<div class="card card--compact">
			<div class="card__label">Administrative Actions</div>
			<div class="admin-actions">
				{#if motion.clerk_notes && !editingClerkNotes}
					<button type="button" class="btn btn--sm btn--secondary" onclick={startEditClerkNotes}>
						Edit Clerk's Notes
					</button>
				{/if}
				{#if motion.parliamentarian_notes && !editingParliamentarianNotes}
					<button type="button" class="btn btn--sm btn--secondary" onclick={startEditParliamentarianNotes}>
						Edit Parliamentarian's Notes
					</button>
				{/if}
			</div>
			{#if editingClerkNotes}
				<form method="POST" action="?/setClerkNotes" use:enhance={() => {
					return ({ update }) => {
						update().then(() => {
							editingClerkNotes = false;
						});
					};
				}} class="edit-form">
					<textarea 
						name="clerk_notes" 
						bind:value={clerkNotesValue}
						class="clerk-notes-input"
						rows="4"></textarea>
					<div class="form-actions">
						<button type="submit" class="btn btn--primary btn--sm">Save</button>
						<button type="button" class="btn btn--secondary btn--sm" onclick={() => editingClerkNotes = false}>Cancel</button>
					</div>
				</form>
			{/if}
			{#if editingParliamentarianNotes}
				<form method="POST" action="?/setParliamentarianNotes" use:enhance={() => {
					return ({ update }) => {
						update().then(() => {
							editingParliamentarianNotes = false;
						});
					};
				}} class="edit-form">
					<textarea 
						name="parliamentarian_notes" 
						bind:value={parliamentarianNotesValue}
						class="clerk-notes-input"
						rows="4"></textarea>
					<div class="form-actions">
						<button type="submit" class="btn btn--primary btn--sm">Save</button>
						<button type="button" class="btn btn--secondary btn--sm" onclick={() => editingParliamentarianNotes = false}>Cancel</button>
					</div>
				</form>
			{/if}
		</div>
	{/if}

	<!-- Actions -->
	{#if !['enacted','rejected','withdrawn'].includes(motion.status)}
		<div class="card">
			<div class="card__label">Actions</div>
			<div class="action-row">
				{#if canAdvance && deliberationRules.length > 0 && motion.status === 'introduced'}
					<form method="POST" action="?/setDeliberationRule" use:enhance class="rule-form">
						<select name="deliberation_rule_uuid" class="rule-select">
							<option value="">{currentDeliberationRule ? '— clear rule —' : '— no deliberation rule —'}</option>
							{#each deliberationRules as r}
								<option value={r.uuid} selected={r.uuid === motion.deliberation_rule_uuid}>{r.name}</option>
							{/each}
						</select>
						<button type="submit" class="btn btn--secondary btn--sm">Set Deliberation Rule</button>
					</form>
				{:else if currentDeliberationRule && motion.status === 'introduced'}
					<span class="rule-label">Deliberation rule: <strong>{currentDeliberationRule.name}</strong></span>
				{/if}
				{#if canAdvance && voteRules.length > 0 && motion.status === 'introduced'}
					<form method="POST" action="?/setVoteRule" use:enhance class="rule-form">
						<select name="vote_rule_uuid" class="rule-select">
							<option value="">{currentRule ? '— clear rule —' : '— no vote rule —'}</option>
							{#each voteRules as r}
								<option value={r.uuid} selected={r.uuid === motion.vote_rule_uuid}>{r.name}</option>
							{/each}
						</select>
						<button type="submit" class="btn btn--secondary btn--sm">Set Vote Rule</button>
					</form>
				{:else if currentRule && motion.status === 'introduced'}
					<span class="rule-label">Vote rule: <strong>{currentRule.name}</strong></span>
				{/if}
				{#if motion.status === 'draft' && canAdvance}
					<form method="POST" action="?/advance">
						<input type="hidden" name="to" value="introduced" />
						<button class="btn btn--primary">Introduce</button>
					</form>
				{/if}
				{#if motion.status === 'introduced' && canAdvance}
					<form method="POST" action="?/advance">
						<input type="hidden" name="to" value="deliberation" />
						<button class="btn btn--primary">
							Begin Deliberation & Voting
						</button>
					</form>
				{/if}
				{#if motion.status === 'deliberation'}
					{#if currentDeliberationRule}
						<div class="deliberation-info">
							<span class="rule-label">Rule: <strong>{currentDeliberationRule.name}</strong></span>
							{#if !deliberationComplete}
								<span class="deliberation-waiting">
									{daysRemainingInDeliberation} day(s) remaining
								</span>
							{:else}
								<span class="deliberation-ready">Ready to close</span>
							{/if}
						</div>
					{/if}
					{#if !alreadyVoted}
						<form method="POST" action="?/castVote" class="vote-form">
							<button class="btn btn--aye" name="choice" value="aye">Aye</button>
							<button class="btn btn--nay" name="choice" value="nay">Nay</button>
							<button class="btn btn--abstain" name="choice" value="abstain">Abstain</button>
						</form>
					{:else}
						<span class="vote-recorded">Your vote is recorded.</span>
					{/if}
					{#if canCloseVote}
						<form method="POST" action="?/closeVote">
							<button class="btn btn--secondary" disabled={!deliberationComplete}>
								{#if deliberationComplete}
									Close Vote & Finalize
								{:else}
									Close Vote ({daysRemainingInDeliberation} days remaining)
								{/if}
							</button>
						</form>
					{/if}
				{/if}
				{#if canAdvance}
					<form method="POST" action="?/advance">
						<input type="hidden" name="to" value="withdrawn" />
						<button class="btn btn--danger">Withdraw</button>
					</form>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Discussion Thread -->
	<div class="discussion">
		<div class="discussion__header">
			<h2 class="discussion__title">Discussion</h2>
			<span class="discussion__count">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
		</div>

		{#if comments.length > 0}
			<div class="thread">
				{#each comments as c}
					<div class="comment">
						<div class="comment__avatar">
							{c.given_name[0]}{c.family_name[0]}
						</div>
						<div class="comment__content">
							<div class="comment__header">
								<strong class="comment__author">{c.given_name} {c.family_name}</strong>
								<span class="comment__handle">@{c.handle}</span>
								<span class="comment__date">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
								{#if c.edited_at}<span class="comment__edited">(edited)</span>{/if}
								{#if c.author_uuid === actingAs}
									<div class="comment__actions">
										<button class="comment__action" onclick={() => startEditComment(c.uuid, c.body)}>Edit</button>
										<form method="POST" action="?/deleteComment" use:enhance style="display: inline;">
											<input type="hidden" name="comment_uuid" value={c.uuid} />
											<button class="comment__action comment__action--danger" type="submit">Delete</button>
										</form>
									</div>
								{/if}
							</div>
							{#if editingCommentUuid === c.uuid}
								<form method="POST" action="?/editComment" use:enhance={() => {
									return ({ result, update }) => {
										if (result.type === 'success') editingCommentUuid = null;
										update();
									};
								}} class="comment__edit-form">
									<input type="hidden" name="comment_uuid" value={c.uuid} />
									<textarea class="comment__edit-input" name="body" rows="3" bind:value={editingCommentBody} required></textarea>
									<div class="comment__edit-actions">
										<button type="submit" class="btn btn--sm btn--primary">Save</button>
										<button type="button" class="btn btn--sm btn--secondary" onclick={() => editingCommentUuid = null}>Cancel</button>
									</div>
								</form>
							{:else}
								<p class="comment__body">{c.body}</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p class="discussion__empty">No comments yet. Be the first to share your thoughts.</p>
		{/if}

		{#if actingAs}
			<form method="POST" action="?/comment" use:enhance class="comment-form">
				<div class="comment-form__avatar">
					You
				</div>
				<div class="comment-form__input-wrapper">
					<textarea class="comment-form__input" name="body" rows="3" placeholder="Add to the discussion…" required></textarea>
					<button type="submit" class="btn btn--primary btn--sm">Post Comment</button>
				</div>
			</form>
		{:else}
			<p class="discussion__login">Please log in to comment.</p>
		{/if}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		max-width: 900px;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
	}

	.back {
		display: inline-block;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		transition: color 0.2s;
	}
	.back:hover { color: var(--color-text); }

	/* Paper Document */
	.paper {
		background: #fefefe;
		background-image:
			linear-gradient(to bottom, transparent 0%, transparent 98%, rgba(0,0,0,0.02) 98%, rgba(0,0,0,0.02) 100%);
		background-size: 100% 24px;
		box-shadow:
			0 1px 2px rgba(0,0,0,0.05),
			0 4px 8px rgba(0,0,0,0.08),
			0 8px 16px rgba(0,0,0,0.06),
			inset 0 0 0 1px rgba(0,0,0,0.03);
		border-radius: 2px;
		padding: var(--space-12) var(--space-10);
		position: relative;
		margin: var(--space-6) 0;
	}

	.paper::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: 
			repeating-linear-gradient(
				90deg,
				transparent,
				transparent 1px,
				rgba(0,0,0,0.005) 1px,
				rgba(0,0,0,0.005) 2px
			);
		pointer-events: none;
		border-radius: 2px;
	}

	.paper__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-8);
		padding-bottom: var(--space-4);
		border-bottom: 2px solid #e5e7eb;
	}

	.paper__letterhead {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #6b7280;
	}

	.paper__motion-number {
		font-family: var(--font-mono, 'Courier New', monospace);
		font-size: var(--text-sm);
		color: #6b7280;
		font-weight: var(--weight-semibold);
	}

	.paper__title {
		font-size: var(--text-3xl, 2rem);
		font-weight: var(--weight-bold);
		line-height: 1.3;
		margin-bottom: var(--space-6);
		color: #111827;
	}

	.paper__meta {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-8);
		font-size: var(--text-sm);
	}

	.paper__meta-row {
		display: flex;
		gap: var(--space-2);
	}

	.paper__meta-label {
		font-weight: var(--weight-medium);
		color: #6b7280;
		min-width: 120px;
	}

	.paper__meta-value {
		color: #111827;
	}

	.paper__status {
		display: inline-block;
		font-size: var(--text-xs);
		padding: 2px 8px;
		border-radius: 3px;
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.status--draft        { background: #f3f4f6; color: #6b7280; }
	.status--introduced   { background: #dbeafe; color: #1e40af; }
	.status--deliberation { background: #f3e8ff; color: #6b21a8; }
	.status--vote         { background: #f1fae5; color: #065f46; }
	.status--rejected     { background: #fee2e2; color: #991b1b; }
	.status--withdrawn    { background: #f3f4f6; color: #6b7280; }

	.paper__divider {
		height: 1px;
		background: #e5e7eb;
		margin: var(--space-6) 0;
	}

	.paper__body {
		font-size: var(--text-base);
		line-height: 1.9;
		color: #1f2937;
		white-space: pre-wrap;
		margin-bottom: var(--space-6);
		font-family: 'Georgia', 'Times New Roman', serif;
	}

	.paper__section {
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid #e5e7eb;
	}

	.paper__section-title {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		margin-bottom: var(--space-3);
	}

	.paper__section-body {
		font-size: var(--text-sm);
		line-height: 1.8;
		color: #4b5563;
		white-space: pre-wrap;
		font-family: 'Georgia', 'Times New Roman', serif;
	}

	/* Vote Card */
	.vote-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.vote-card__header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.vote-card__title {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.vote-card__rule {
		font-size: var(--text-xs);
		background: var(--color-surface-raised);
		color: var(--color-text-muted);
		padding: 2px 8px;
		border-radius: 999px;
		font-weight: var(--weight-medium);
	}

	.vote-card__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		margin-left: auto;
	}

	.vote-stats {
		display: flex;
		gap: var(--space-6);
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
		background: var(--color-border);
		border-radius: var(--radius-full, 9999px);
		overflow: hidden;
		display: flex;
	}
	.vote-bar__aye { background: #86efac; height: 100%; }
	.vote-bar__nay { background: #fca5a5; height: 100%; }

	.vote-caption {
		margin: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	/* Cards (for actions, etc) */
	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.card--compact {
		padding: var(--space-4);
		gap: var(--space-2);
	}

	.card__label {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		font-weight: var(--weight-medium);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.admin-actions {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}

	/* Actions */
	.action-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: center;
	}
	
	.rule-form {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	
	.rule-select {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg, #fff);
		font-size: var(--text-sm);
	}
	
	.rule-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
	
	.deliberation-info {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.deliberation-waiting {
		font-size: var(--text-xs);
		color: #92400e;
		background: #fef3c7;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		border: 1px solid #fcd34d;
		font-weight: var(--weight-medium);
	}

	.deliberation-ready {
		font-size: var(--text-xs);
		color: #065f46;
		background: #d1fae5;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		border: 1px solid #86efac;
		font-weight: var(--weight-medium);
	}
	
	.vote-form {
		display: flex;
		gap: var(--space-2);
	}
	.vote-recorded {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.btn {
		padding: var(--space-2) var(--space-4);
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn--sm {
		padding: var(--space-1) var(--space-3);
		font-size: var(--text-xs);
	}
	.btn--primary   { background: var(--color-primary, #2563eb); color: #fff; }
	.btn--secondary { background: var(--color-bg, #f3f4f6); color: var(--color-text); border: 1px solid var(--color-border); }
	.btn--danger    { background: #fee2e2; color: #991b1b; }
	.btn--aye       { background: #dcfce7; color: #166534; }
	.btn--nay       { background: #fee2e2; color: #991b1b; }
	.btn--abstain   { background: var(--color-bg, #f3f4f6); color: var(--color-text-muted); border: 1px solid var(--color-border); }

	.btn-inline {
		background: none;
		border: none;
		padding: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		cursor: pointer;
		text-decoration: underline;
	}
	.btn-inline:hover { color: var(--color-text); }

	.clerk-notes-input {
		width: 100%;
		box-sizing: border-box;
		padding: var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-family: inherit;
		font-size: var(--text-sm);
		line-height: 1.6;
		resize: vertical;
		background: var(--color-background, #fff);
	}

	.form-actions {
		display: flex;
		gap: var(--space-2);
	}

	.muted { color: var(--color-text-muted); }

	/* Discussion Thread */
	.discussion {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.discussion__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: var(--space-4);
		border-bottom: 2px solid var(--color-border);
	}

	.discussion__title {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.discussion__count {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.discussion__empty {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		padding: var(--space-8) 0;
	}

	.discussion__login {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		padding: var(--space-4);
		background: var(--color-bg);
		border-radius: var(--radius-md);
	}

	.thread {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.comment {
		display: flex;
		gap: var(--space-3);
		align-items: flex-start;
	}

	.comment__avatar {
		width: 40px;
		height: 40px;
		border-radius: var(--radius-full, 50%);
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		flex-shrink: 0;
	}

	.comment__content {
		flex: 1;
		min-width: 0;
	}

	.comment__header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
		flex-wrap: wrap;
		font-size: var(--text-sm);
	}

	.comment__author {
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.comment__handle {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}

	.comment__date {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}

	.comment__edited {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-style: italic;
	}

	.comment__actions {
		margin-left: auto;
		display: flex;
		gap: var(--space-2);
	}

	.comment__action {
		background: none;
		border: none;
		padding: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		cursor: pointer;
		text-decoration: underline;
	}
	.comment__action:hover { color: var(--color-text); }
	.comment__action--danger:hover { color: #991b1b; }

	.comment__body {
		margin: 0;
		font-size: var(--text-sm);
		line-height: 1.7;
		color: var(--color-text);
		white-space: pre-wrap;
	}

	.comment__edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.comment__edit-input {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-family: inherit;
		background: var(--color-bg);
		color: var(--color-text);
		resize: vertical;
		line-height: 1.6;
	}

	.comment__edit-actions {
		display: flex;
		gap: var(--space-2);
	}

	.comment-form {
		display: flex;
		gap: var(--space-3);
		align-items: flex-start;
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
	}

	.comment-form__avatar {
		width: 40px;
		height: 40px;
		border-radius: var(--radius-full, 50%);
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		flex-shrink: 0;
	}

	.comment-form__input-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.comment-form__input {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-family: inherit;
		background: var(--color-bg);
		color: var(--color-text);
		resize: vertical;
		line-height: 1.6;
	}

	.comment-form__input:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	/* Countdown Timer */
	.paper__timer {
		font-family: 'Courier New', monospace;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		color: #2563eb;
		display: flex;
		gap: var(--space-2);
		align-items: baseline;
	}

	.paper__timer--expired {
		color: #059669;
	}

	.timer-segment {
		display: inline-flex;
		align-items: baseline;
		gap: 1px;
	}

	.timer-unit {
		font-size: var(--text-xs);
		font-weight: var(--weight-normal);
		opacity: 0.7;
		margin-left: 1px;
	}

	.timer-segment--seconds {
		opacity: 0.8;
	}

	.timer-ready {
		color: #059669;
		font-weight: var(--weight-bold);
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	/* Readiness Card */
	.readiness-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		box-shadow: var(--shadow-sm);
	}

	.readiness-badge {
		background: #dbeafe;
		color: #1e40af;
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}

	.readiness-progress {
		margin: var(--space-4) 0;
	}

	.readiness-progress__bar {
		height: 12px;
		background: var(--color-border-light, #e5e7eb);
		border-radius: var(--radius-full);
		overflow: hidden;
		margin-bottom: var(--space-2);
	}

	.readiness-progress__fill {
		height: 100%;
		background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
		transition: width 0.3s ease;
	}

	.readiness-progress__text {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		text-align: center;
		margin: 0;
	}

	.readiness-actions {
		margin-top: var(--space-4);
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.readiness-signers {
		margin-top: var(--space-6);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-border);
	}

	.readiness-signers__title {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text-secondary);
		margin: 0 0 var(--space-3) 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.readiness-signers__list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.signer-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		background: #f3f4f6;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
	}

	.signer-badge__avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: var(--weight-bold);
		flex-shrink: 0;
	}

	.signer-badge__name {
		color: var(--color-text);
		font-weight: var(--weight-medium);
	}
</style>
