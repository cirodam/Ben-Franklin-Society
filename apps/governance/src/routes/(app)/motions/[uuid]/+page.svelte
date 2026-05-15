<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { motion, introducer, body, tally, voteRules, currentRule, deliberationRules, currentDeliberationRule, deliberationComplete, daysRemainingInDeliberation, comments, canAdvance, canCloseVote, alreadyVoted, hasMarkedMotionReady, readinessCount, readinessSigners, actingAs } = $derived(data);

	let editingCommentUuid = $state<string | null>(null);
	let editingCommentBody = $state('');
	let showClerkModal = $state(false);
	let clerkNotesValue = $state(motion.clerk_notes || '');
	let showParliamentarianModal = $state(false);
	let parliamentarianNotesValue = $state(motion.parliamentarian_notes || '');
	let showRulesModal = $state(false);
	let selectedVotingRuleUuid = $state<string | null>(null);
	let selectedDeliberationRuleUuid = $state<string | null>(null);

	function startEditComment(uuid: string, currentBody: string) {
		editingCommentUuid = uuid;
		editingCommentBody = currentBody;
	}

	function openClerkModal() {
		clerkNotesValue = motion.clerk_notes || '';
		showClerkModal = true;
	}

	function openParliamentarianModal() {
		parliamentarianNotesValue = motion.parliamentarian_notes || '';
		showParliamentarianModal = true;
	}

	function openRulesModal() {
		selectedVotingRuleUuid = motion.vote_rule_uuid || null;
		selectedDeliberationRuleUuid = motion.deliberation_rule_uuid || null;
		showRulesModal = true;
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

<div class="page-wrapper">
	<div class="document-controls">
		<a href="/motions" class="back">← Back to Motions</a>
		{#if canAdvance}
			<div class="admin-controls">
				<button type="button" class="btn btn--ghost btn--sm" onclick={openRulesModal}>
					⚖️ {currentRule || currentDeliberationRule ? 'Edit' : 'Set'} Rules
				</button>
				<button type="button" class="btn btn--ghost btn--sm" onclick={openClerkModal}>
					{motion.clerk_notes ? '✏️ Edit' : '📝 Add'} Clerk's Notes
				</button>
				<button type="button" class="btn btn--ghost btn--sm" onclick={openParliamentarianModal}>
					{motion.parliamentarian_notes ? '✏️ Edit' : '📝 Add'} Parliamentarian's Notes
				</button>
			</div>
		{/if}
	</div>

	<!-- Lifecycle Indicator -->
	<div class="lifecycle-indicator">
		<div class="lifecycle-step {motion.status === 'draft' ? 'active' : motion.status !== 'draft' ? 'completed' : ''}">
			<div class="lifecycle-step__icon">📝</div>
			<div class="lifecycle-step__label">Draft</div>
		</div>
		<div class="lifecycle-connector {['introduced', 'deliberation', 'enacted', 'rejected'].includes(motion.status) ? 'active' : ''}"></div>
		<div class="lifecycle-step {motion.status === 'introduced' ? 'active' : ['deliberation', 'enacted', 'rejected'].includes(motion.status) ? 'completed' : ''}">
			<div class="lifecycle-step__icon">📋</div>
			<div class="lifecycle-step__label">Introduced</div>
			{#if motion.status === 'introduced' && readinessCount > 0}
				<div class="lifecycle-step__detail">{readinessCount}/15 ready</div>
			{/if}
		</div>
		<div class="lifecycle-connector {['deliberation', 'enacted', 'rejected'].includes(motion.status) ? 'active' : ''}"></div>
		<div class="lifecycle-step {motion.status === 'deliberation' ? 'active' : ['enacted', 'rejected'].includes(motion.status) ? 'completed' : ''}">
			<div class="lifecycle-step__icon">🗳️</div>
			<div class="lifecycle-step__label">Deliberation</div>
			{#if motion.status === 'deliberation' && timeRemaining}
				<div class="lifecycle-step__detail">
					{#if timeRemaining.expired}
						Ready to close
					{:else if timeRemaining.days > 0}
						{timeRemaining.days}d remaining
					{:else}
						{timeRemaining.hours}h {timeRemaining.minutes}m
					{/if}
				</div>
			{/if}
		</div>
		<div class="lifecycle-connector {['enacted', 'rejected'].includes(motion.status) ? 'active' : ''}"></div>
		<div class="lifecycle-step {['enacted', 'rejected', 'withdrawn'].includes(motion.status) ? 'completed' : ''}">
			<div class="lifecycle-step__icon">
				{#if motion.status === 'enacted'}
					✅
				{:else if motion.status === 'rejected'}
					❌
				{:else if motion.status === 'withdrawn'}
					🚫
				{:else}
					🏁
				{/if}
			</div>
			<div class="lifecycle-step__label">
				{#if motion.status === 'enacted'}
					Enacted
				{:else if motion.status === 'rejected'}
					Rejected
				{:else if motion.status === 'withdrawn'}
					Withdrawn
				{:else}
					Final
				{/if}
			</div>
		</div>
	</div>

	<!-- Paper Document -->
	<div class="motion-paper">
		<div class="motion-header">
			<div class="motion-letterhead">
				<div class="letterhead-body">
					{#if body}
						{body.name}
					{:else}
						The Ben Franklin Society
					{/if}
				</div>
				<div class="letterhead-motion-number">
					{#if body?.abbreviation}
						{body.abbreviation} {motion.motion_number}
					{:else}
						Motion #{motion.motion_number}
					{/if}
				</div>
			</div>

			<h1 class="motion-title">{motion.title}</h1>

			<div class="motion-meta">
				<div class="meta-row">
					<span class="meta-label">Introduced by:</span>
					<span class="meta-value">
						{#if introducer}
							{introducer.given_name} {introducer.family_name}
						{:else}
							Unknown
						{/if}
					</span>
				</div>
				<div class="meta-row">
					<span class="meta-label">Date:</span>
					<span class="meta-value">{new Date(motion.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
				</div>
				<div class="meta-row">
					<span class="meta-label">Status:</span>
					<span class="motion-status {statusVariant[motion.status] ?? ''}">{statusLabel[motion.status] ?? motion.status}</span>
				</div>
				{#if timeRemaining}
					<div class="meta-row">
						<span class="meta-label">Time Remaining:</span>
						<span class="timer-display {timeRemaining.expired ? 'timer-display--expired' : ''}">
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

		<!-- Rules Display -->
		{#if currentRule || currentDeliberationRule}
			<div class="motion-rules">
				{#if currentRule}
					<div class="rule-item">
						<span class="rule-label">Voting Threshold:</span>
						<span class="rule-value">{currentRule.name}</span>
						<span class="rule-detail">({currentRule.numerator}/{currentRule.denominator})</span>
					</div>
				{/if}
				{#if currentDeliberationRule}
					<div class="rule-item">
						<span class="rule-label">Deliberation Period:</span>
						<span class="rule-value">{currentDeliberationRule.name}</span>
						<span class="rule-detail">({currentDeliberationRule.minimum_days} days)</span>
					</div>
				{/if}
			</div>
		{/if}
		</div>

		<div class="motion-body">
			<div class="body-section">
				<div class="body-text">{motion.body}</div>
			</div>

			{#if motion.reasoning}
				<div class="reasoning-section">
					<h2 class="section-heading">Reasoning</h2>
					<div class="section-text">{motion.reasoning}</div>
				</div>
			{/if}

			{#if motion.clerk_notes}
				<div class="clerk-annotation">
					<div class="annotation-stamp">Clerk</div>
					<div class="annotation-content">
						<div class="annotation-heading">Administrative Notes</div>
						<div class="annotation-text">{motion.clerk_notes}</div>
					</div>
				</div>
			{/if}

			{#if motion.parliamentarian_notes}
				<div class="parliamentarian-annotation">
					<div class="annotation-stamp">Parliamentarian</div>
					<div class="annotation-content">
						<div class="annotation-heading">Procedural Notes</div>
						<div class="annotation-text">{motion.parliamentarian_notes}</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="interactive-section">
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

	<!-- Actions -->
	{#if !['enacted','rejected','withdrawn'].includes(motion.status)}
		<div class="card">
			<div class="card__label">Actions</div>
			<div class="action-row">
				{#if motion.status === 'draft' && canAdvance}
					<form method="POST" action="?/advance">
						<input type="hidden" name="to" value="introduced" />
						<button class="btn btn--primary">Introduce</button>
					</form>
				{/if}
				
				{#if motion.status === 'introduced'}
					<!-- Readiness Section -->
					<div class="readiness-section">
						<div class="readiness-header">
							<span class="readiness-label">Motion Readiness</span>
							<span class="readiness-badge">{readinessCount} of 15</span>
						</div>
						<div class="readiness-progress">
							<div class="readiness-progress__bar">
								<div class="readiness-progress__fill" style="width: {Math.min((readinessCount / 15) * 100, 100)}%"></div>
							</div>
							<p class="readiness-progress__text">
								{#if readinessCount >= 15}
									✓ Ready to advance to deliberation
								{:else}
									{15 - readinessCount} more {15 - readinessCount === 1 ? 'member' : 'members'} needed
								{/if}
							</p>
						</div>

						{#if actingAs}
							{#if hasMarkedMotionReady}
								<form method="POST" action="?/unmarkReady" use:enhance>
									<button type="submit" class="btn btn--secondary btn--sm">
										✓ Marked Ready
									</button>
								</form>
							{:else}
								<form method="POST" action="?/markReady" use:enhance>
									<button type="submit" class="btn btn--primary btn--sm">
										Mark Ready to Advance
									</button>
								</form>
							{/if}
						{/if}

						{#if readinessSigners.length > 0}
							<details class="readiness-signers">
								<summary class="readiness-signers__summary">
									{readinessSigners.length} {readinessSigners.length === 1 ? 'member' : 'members'} marked ready
								</summary>
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
							</details>
						{/if}
					</div>

					{#if canAdvance}
						<form method="POST" action="?/advance">
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

	<!-- Clerk Notes Modal -->
	{#if showClerkModal}
		<div class="modal-backdrop" onclick={() => showClerkModal = false}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h3 class="modal-title">Clerk's Notes</h3>
					<button type="button" class="modal-close" onclick={() => showClerkModal = false}>×</button>
				</div>
				<form method="POST" action="?/setClerkNotes" use:enhance={() => {
					return ({ update }) => {
						update().then(() => {
							showClerkModal = false;
						});
					};
				}}>
					<div class="modal-body">
						<p class="modal-hint">Administrative reminders for actions needed if this motion passes...</p>
						<textarea 
							name="clerk_notes" 
							bind:value={clerkNotesValue}
							class="modal-textarea"
							rows="8"
							placeholder="Enter clerk's notes here..."
							autofocus></textarea>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn--secondary" onclick={() => showClerkModal = false}>Cancel</button>
						<button type="submit" class="btn btn--primary">Save Notes</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Parliamentarian Notes Modal -->
	{#if showParliamentarianModal}
		<div class="modal-backdrop" onclick={() => showParliamentarianModal = false}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h3 class="modal-title">Parliamentarian's Notes</h3>
					<button type="button" class="modal-close" onclick={() => showParliamentarianModal = false}>×</button>
				</div>
				<form method="POST" action="?/setParliamentarianNotes" use:enhance={() => {
					return ({ update }) => {
						update().then(() => {
							showParliamentarianModal = false;
						});
					};
				}}>
					<div class="modal-body">
						<p class="modal-hint">Procedural notes, rule interpretations, precedent references...</p>
						<textarea 
							name="parliamentarian_notes" 
							bind:value={parliamentarianNotesValue}
							class="modal-textarea"
							rows="8"
							placeholder="Enter parliamentarian's notes here..."
							autofocus></textarea>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn--secondary" onclick={() => showParliamentarianModal = false}>Cancel</button>
						<button type="submit" class="btn btn--primary">Save Notes</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>

	<!-- Rules Modal -->
	{#if showRulesModal}
		<div class="modal-backdrop" onclick={() => showRulesModal = false}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<form method="POST" action="?/setMotionRules" use:enhance={() => {
					return async ({ update }) => {
						await update();
						showRulesModal = false;
					};
				}}>
					<div class="modal-header">
						<h3 class="modal-title">Set Motion Rules</h3>
						<button type="button" class="modal-close" onclick={() => showRulesModal = false}>×</button>
					</div>
					<div class="modal-body">
						<p class="modal-hint">These rules determine how this motion will be voted on and how long the deliberation period lasts.</p>
						
						<div class="form-group">
							<label for="vote-rule">Voting Threshold:</label>
							<select 
								id="vote-rule" 
								name="vote_rule_uuid" 
								bind:value={selectedVotingRuleUuid}
								class="form-select"
							>
								<option value="">Not set</option>
								{#each voteRules as rule}
									<option value={rule.uuid}>
										{rule.name} ({rule.numerator}/{rule.denominator})
									</option>
								{/each}
							</select>
						</div>
						
						<div class="form-group">
							<label for="deliberation-rule">Deliberation Period:</label>
							<select 
								id="deliberation-rule" 
								name="deliberation_rule_uuid" 
								bind:value={selectedDeliberationRuleUuid}
								class="form-select"
							>
								<option value="">Not set</option>
								{#each deliberationRules as rule}
									<option value={rule.uuid}>
										{rule.name} ({rule.minimum_days} days)
									</option>
								{/each}
							</select>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn--secondary" onclick={() => showRulesModal = false}>Cancel</button>
						<button type="submit" class="btn btn--primary">Save Changes</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

<style>
	.page-wrapper {
		min-height: 100vh;
		background: linear-gradient(to bottom, #f5f5f0 0%, #e8e8e0 100%);
		padding: var(--space-8) 0;
	}

	.document-controls {
		max-width: 900px;
		margin: 0 auto var(--space-6);
		padding: 0 var(--space-4);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
	}

	.admin-controls {
		display: flex;
		gap: var(--space-2);
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius);
		transition: all 0.2s;
	}
	.back:hover {
		background: rgba(255, 255, 255, 0.9);
		color: var(--color-text);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	/* Lifecycle Indicator */
	.lifecycle-indicator {
		max-width: 900px;
		margin: 0 auto var(--space-6);
		padding: 0 var(--space-4);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0;
	}

	.lifecycle-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		min-width: 80px;
		padding: var(--space-2);
		opacity: 0.4;
		transition: opacity 0.3s;
	}

	.lifecycle-step.active {
		opacity: 1;
	}

	.lifecycle-step.completed {
		opacity: 0.7;
	}

	.lifecycle-step__icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.8);
		border: 2px solid rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		transition: all 0.3s;
	}

	.lifecycle-step.active .lifecycle-step__icon {
		background: white;
		border-color: #5b8cb8;
		box-shadow: 0 2px 8px rgba(91, 140, 184, 0.3);
		transform: scale(1.1);
	}

	.lifecycle-step.completed .lifecycle-step__icon {
		background: #e8f4ea;
		border-color: #28704a;
	}

	.lifecycle-step__label {
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--color-text-muted);
		text-align: center;
	}

	.lifecycle-step.active .lifecycle-step__label {
		color: var(--color-text);
	}

	.lifecycle-step__detail {
		font-size: 10px;
		color: var(--color-text-muted);
		text-align: center;
	}

	.lifecycle-connector {
		flex: 1;
		height: 2px;
		background: rgba(0, 0, 0, 0.1);
		max-width: 60px;
		transition: background 0.3s;
	}

	.lifecycle-connector.active {
		background: #28704a;
	}

	/* Motion Paper Document */
	.motion-paper {
		max-width: 900px;
		margin: 0 auto var(--space-8);
		background: linear-gradient(to bottom, #fdfdf8 0%, #f9f9f4 100%);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 4px 12px rgba(0, 0, 0, 0.08),
			0 8px 24px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(139, 115, 85, 0.15);
		border-radius: 2px;
		position: relative;
		padding: var(--space-12) var(--space-10);
		box-sizing: border-box;
	}

	.motion-paper::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: 
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 1.5rem,
				rgba(139, 115, 85, 0.03) 1.5rem,
				rgba(139, 115, 85, 0.03) calc(1.5rem + 1px)
			);
		pointer-events: none;
		border-radius: 2px;
	}

	.motion-header {
		position: relative;
		z-index: 1;
		margin-bottom: var(--space-8);
		padding-bottom: var(--space-6);
		border-bottom: 2px solid rgba(139, 115, 85, 0.2);
	}

	.motion-letterhead {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-8);
		font-family: 'Georgia', 'Times New Roman', serif;
	}

	.letterhead-body {
		font-size: var(--text-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: #7a5c1a;
	}

	.letterhead-motion-number {
		font-family: var(--font-mono, 'Courier New', monospace);
		font-size: var(--text-sm);
		color: #7a5c1a;
		font-weight: 600;
		font-variant-numeric: oldstyle-nums;
	}

	.motion-title {
		font-family: 'Georgia', 'Times New Roman', serif;
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.3;
		color: #2c2416;
		margin: 0 0 var(--space-6);
		text-align: center;
	}

	.motion-meta {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		font-family: 'Georgia', 'Times New Roman', serif;
		font-size: var(--text-sm);
	}

	.meta-row {
		display: flex;
		gap: var(--space-3);
		align-items: baseline;
	}

	.meta-label {
		font-weight: 600;
		color: #7a5c1a;
		min-width: 140px;
		font-style: italic;
	}

	.meta-value {
		color: #2c2416;
		font-variant-numeric: oldstyle-nums;
	}

	.motion-status {
		display: inline-block;
		font-size: var(--text-xs);
		padding: var(--space-1) var(--space-3);
		border-radius: 2px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		border: 1.5px solid;
	}
	.status--draft        { background: #f5f5f0; border-color: #a0a090; color: #5a5a50; }
	.status--introduced   { background: #e8f0f8; border-color: #5b8cb8; color: #1e3a5f; }
	.status--deliberation { background: #f0ebf8; border-color: #8b6cb8; color: #4a2870; }
	.status--enacted      { background: #e8f5eb; border-color: #6cb88b; color: #28704a; }
	.status--rejected     { background: #f8e8eb; border-color: #b86c6c; color: #702828; }
	.status--withdrawn    { background: #f5f5f0; border-color: #a0a090; color: #5a5a50; }

	.timer-display {
		font-family: var(--font-mono, 'Courier New', monospace);
		font-size: var(--text-sm);
		color: #7a5c1a;
		display: flex;
		gap: var(--space-2);
	}

	.timer-display--expired {
		color: #28704a;
		font-weight: 600;
	}

	.timer-ready {
		color: #28704a;
		font-weight: 600;
	}

	.timer-segment {
		font-weight: 600;
	}

	.timer-unit {
		font-size: 0.85em;
		opacity: 0.7;
		margin-left: 1px;
	}

	.timer-segment--seconds {
		opacity: 0.8;
	}

	/* Motion Rules Display */
	.motion-rules {
		margin-top: var(--space-6);
		padding: var(--space-4);
		background: rgba(255, 255, 255, 0.4);
		border: 1px solid rgba(139, 115, 85, 0.15);
		border-radius: 3px;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.rule-item {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		font-size: var(--text-sm);
	}

	.rule-label {
		font-weight: 600;
		color: #7a5c1a;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.825em;
	}

	.rule-value {
		font-weight: 500;
		color: #2c2416;
	}

	.rule-detail {

	.form-group {
		margin-bottom: var(--space-4);
	}

	.form-group label {
		display: block;
		font-weight: 600;
		margin-bottom: var(--space-2);
		color: var(--color-text);
		font-size: var(--text-sm);
	}

	.form-select {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: 1px solid rgba(0, 0, 0, 0.2);
		border-radius: var(--radius);
		background: white;
		font-size: var(--text-base);
		color: var(--color-text);
		cursor: pointer;
		transition: all 0.2s;
	}

	.form-select:hover {
		border-color: rgba(0, 0, 0, 0.3);
	}

	.form-select:focus {
		outline: none;

	.modal-hint {
		margin-bottom: var(--space-4);
		padding: var(--space-3);
		background: rgba(91, 140, 184, 0.08);
		border-left: 3px solid #5b8cb8;
		border-radius: 3px;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: 1.5;
	}
		border-color: #5b8cb8;
		box-shadow: 0 0 0 3px rgba(91, 140, 184, 0.1);
	}
		color: var(--color-text-muted);
		font-size: 0.9em;
	}

	.motion-body {
		position: relative;
		z-index: 1;
		font-family: 'Georgia', 'Times New Roman', serif;
	}

	.body-section {
		margin-bottom: var(--space-8);
	}

	.body-text {
		font-size: 1.0625rem;
		line-height: 1.75;
		color: #2c2416;
		white-space: pre-wrap;
		text-align: justify;
		hyphens: auto;
	}

	.reasoning-section {
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid rgba(139, 115, 85, 0.2);
	}

	.section-heading {
		font-size: var(--text-base);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #7a5c1a;
		margin: 0 0 var(--space-3);
	}

	.section-text {
		font-size: var(--text-base);
		line-height: 1.75;
		color: #3c2f16;
		white-space: pre-wrap;
		text-align: justify;
		hyphens: auto;
	}

	/* Official Annotations (Clerk & Parliamentarian) */
	.clerk-annotation,
	.parliamentarian-annotation {
		margin-top: var(--space-10);
		position: relative;
		border: 2px solid;
		border-radius: 3px;
		padding: var(--space-6);
		background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
		backdrop-filter: blur(2px);
	}

	.clerk-annotation {
		border-color: #5b8cb8;
		background-image: 
			linear-gradient(135deg, rgba(91, 140, 184, 0.05) 0%, rgba(91, 140, 184, 0.02) 100%),
			repeating-linear-gradient(
				45deg,
				transparent,
				transparent 10px,
				rgba(91, 140, 184, 0.02) 10px,
				rgba(91, 140, 184, 0.02) 20px
			);
	}

	.parliamentarian-annotation {
		border-color: #8b6cb8;
		background-image: 
			linear-gradient(135deg, rgba(139, 108, 184, 0.05) 0%, rgba(139, 108, 184, 0.02) 100%),
			repeating-linear-gradient(
				-45deg,
				transparent,
				transparent 10px,
				rgba(139, 108, 184, 0.02) 10px,
				rgba(139, 108, 184, 0.02) 20px
			);
	}

	.annotation-stamp {
		position: absolute;
		top: -12px;
		left: var(--space-6);
		font-family: 'Georgia', 'Times New Roman', serif;
		font-size: var(--text-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		padding: var(--space-1) var(--space-4);
		border-radius: 2px;
		border: 2px solid;
		background: #fdfdf8;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.clerk-annotation .annotation-stamp {
		border-color: #5b8cb8;
		color: #1e3a5f;
	}

	.parliamentarian-annotation .annotation-stamp {
		border-color: #8b6cb8;
		color: #4a2870;
	}

	.annotation-content {
		position: relative;
		z-index: 1;
	}

	.annotation-heading {
		font-family: 'Georgia', 'Times New Roman', serif;
		font-size: var(--text-sm);
		font-weight: 700;
		font-style: italic;
		margin-bottom: var(--space-3);
	}

	.clerk-annotation .annotation-heading {
		color: #1e3a5f;
	}

	.parliamentarian-annotation .annotation-heading {
		color: #4a2870;
	}

	.annotation-text {
		font-family: 'Georgia', 'Times New Roman', serif;
		font-size: var(--text-sm);
		line-height: 1.7;
		color: #2c2416;
		white-space: pre-wrap;
	}

	/* Interactive Section */
	.interactive-section {
		max-width: 900px;
		margin: 0 auto var(--space-8);
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	/* Vote Card */
	.vote-card {
		background: linear-gradient(to bottom, #fdfdf8 0%, #f9f9f4 100%);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 4px 12px rgba(0, 0, 0, 0.08),
			0 8px 24px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(139, 115, 85, 0.15);
		border-radius: 2px;
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		position: relative;
		box-sizing: border-box;
	}

	.vote-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: 
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 1.5rem,
				rgba(139, 115, 85, 0.03) 1.5rem,
				rgba(139, 115, 85, 0.03) calc(1.5rem + 1px)
			);
		pointer-events: none;
		border-radius: 2px;
	}

	.vote-card__header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
		position: relative;
		z-index: 1;
	}

	.vote-card__title {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #7a5c1a;
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
		position: relative;
		z-index: 1;
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
		border-radius: var(--radius-full, 9999px);
		overflow: hidden;
		display: flex;
		position: relative;
		z-index: 1;
	}
	.vote-bar__aye { background: #86efac; height: 100%; }
	.vote-bar__nay { background: #fca5a5; height: 100%; }

	.vote-caption {
		margin: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		position: relative;
		z-index: 1;
	}

	/* Cards (for actions, etc) */
	.card {
		background: linear-gradient(to bottom, #fdfdf8 0%, #f9f9f4 100%);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 4px 12px rgba(0, 0, 0, 0.08),
			0 8px 24px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(139, 115, 85, 0.15);
		border-radius: 2px;
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		position: relative;
		box-sizing: border-box;
	}

	.card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: 
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 1.5rem,
				rgba(139, 115, 85, 0.03) 1.5rem,
				rgba(139, 115, 85, 0.03) calc(1.5rem + 1px)
			);
		pointer-events: none;
		border-radius: 2px;
	}

	.card--compact {
		padding: var(--space-4);
		gap: var(--space-2);
	}

	.card__label {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #7a5c1a;
		font-weight: var(--weight-medium);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		position: relative;
		z-index: 1;
	}

	/* Actions */
	.action-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: center;
		position: relative;
		z-index: 1;
	}

	/* Readiness Section */
	.readiness-section {
		width: 100%;
		padding: var(--space-4);
		background: rgba(91, 140, 184, 0.05);
		border: 1px solid rgba(91, 140, 184, 0.15);
		border-radius: var(--radius);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.readiness-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.readiness-label {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text);
	}

	.readiness-badge {
		font-size: var(--text-xs);
		font-weight: 600;
		color: #5b8cb8;
		background: rgba(91, 140, 184, 0.1);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
	}

	.readiness-progress {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.readiness-progress__bar {
		height: 8px;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 4px;
		overflow: hidden;
	}

	.readiness-progress__fill {
		height: 100%;
		background: linear-gradient(to right, #5b8cb8, #28704a);
		transition: width 0.3s ease;
	}

	.readiness-progress__text {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		margin: 0;
	}

	.readiness-signers {
		margin-top: var(--space-2);
	}

	.readiness-signers__summary {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		cursor: pointer;
		padding: var(--space-2);
		border-radius: var(--radius-sm);
		transition: background 0.2s;
	}

	.readiness-signers__summary:hover {
		background: rgba(0, 0, 0, 0.03);
	}

	.readiness-signers__list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-top: var(--space-2);
		padding: var(--space-2);
	}

	.signer-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-2);
		background: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius);
		font-size: var(--text-xs);
	}

	.signer-badge__avatar {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #5b8cb8;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 9px;
		font-weight: 600;
	}

	.signer-badge__name {
		color: var(--color-text);
		font-weight: 500;
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

	.form-actions {
		display: flex;
		gap: var(--space-2);
	}

	.muted { color: var(--color-text-muted); }

	/* Discussion Thread */
	.discussion {
		max-width: 900px;
		margin: 0 auto var(--space-8);
		background: linear-gradient(to bottom, #fdfdf8 0%, #f9f9f4 100%);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 4px 12px rgba(0, 0, 0, 0.08),
			0 8px 24px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(139, 115, 85, 0.15);
		border-radius: 2px;
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		position: relative;
		box-sizing: border-box;
	}

	.discussion::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: 
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 1.5rem,
				rgba(139, 115, 85, 0.03) 1.5rem,
				rgba(139, 115, 85, 0.03) calc(1.5rem + 1px)
			);
		pointer-events: none;
		border-radius: 2px;
	}

	.discussion__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: var(--space-4);
		border-bottom: 2px solid rgba(139, 115, 85, 0.2);
		position: relative;
		z-index: 1;
	}

	.discussion__title {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		color: #2c2416;
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
		position: relative;
		z-index: 1;
	}

	.discussion__login {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		padding: var(--space-4);
		background: rgba(255, 255, 255, 0.5);
		border-radius: var(--radius-md);
		position: relative;
		z-index: 1;
	}

	.thread {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		position: relative;
		z-index: 1;
	}

	.comment {
		display: flex;
		gap: var(--space-3);
		align-items: flex-start;
		position: relative;
		z-index: 1;
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

	/* Responsive Styles */
	@media (max-width: 768px) {
		.page-wrapper {
			padding: var(--space-4) 0;
		}

		.motion-paper {
			border-left: none;
			border-right: none;
			border-radius: 0;
			padding: var(--space-8) var(--space-6);
		}

		.motion-paper::before {
			border-radius: 0;
		}

		.motion-letterhead {
			flex-direction: column;
			gap: var(--space-2);
		}

		.motion-title {
			font-size: 1.5rem;
		}

		.meta-row {
			flex-direction: column;
			gap: var(--space-1);
		}

		.meta-label {
			min-width: auto;
		}

		.body-text,
		.section-text {
			text-align: left;
		}

		.annotation-stamp {
			position: static;
			display: inline-block;
			margin-bottom: var(--space-2);
		}

		.clerk-annotation,
		.parliamentarian-annotation {
			padding: var(--space-4);
		}

		.interactive-section {
			padding: 0 var(--space-3) var(--space-6);
		}
	}

	/* Button Styles */
	.btn {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		border: 1px solid;
		transition: all 0.2s;
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.btn--primary {
		background: #5b8cb8;
		border-color: #4a7ba7;
		color: white;
	}

	.btn--primary:hover {
		background: #4a7ba7;
	}

	.btn--secondary {
		background: transparent;
		border-color: var(--color-border);
		color: var(--color-text);
	}

	.btn--secondary:hover {
		background: var(--color-surface);
	}

	.btn--ghost {
		background: rgba(255, 255, 255, 0.6);
		border-color: rgba(0, 0, 0, 0.1);
		color: var(--color-text-muted);
	}

	.btn--ghost:hover {
		background: rgba(255, 255, 255, 0.9);
		border-color: rgba(0, 0, 0, 0.2);
		color: var(--color-text);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.btn--sm {
		padding: var(--space-1) var(--space-3);
		font-size: var(--text-xs);
	}

	/* Modal Styles */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal {
		background: white;
		border-radius: var(--radius-lg);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.2s ease;
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-6);
		border-bottom: 1px solid var(--color-border);
	}

	.modal-title {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
		margin: 0;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 2rem;
		line-height: 1;
		color: var(--color-text-muted);
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius);
		transition: all 0.2s;
	}

	.modal-close:hover {
		background: var(--color-surface);
		color: var(--color-text);
	}

	.modal-body {
		padding: var(--space-6);
		overflow-y: auto;
	}

	.modal-hint {
		margin: 0 0 var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.modal-textarea {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-3);
		font-family: 'Georgia', 'Times New Roman', serif;
		font-size: var(--text-base);
		line-height: 1.6;
		resize: vertical;
		min-height: 200px;
	}

	.modal-textarea:focus {
		outline: none;
		border-color: #5b8cb8;
		box-shadow: 0 0 0 3px rgba(91, 140, 184, 0.1);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding: var(--space-6);
		border-top: 1px solid var(--color-border);
	}

	@media print {
		.page-wrapper {
			background: white;
			padding: 0;
		}

		.document-controls {
			display: none;
		}

		.interactive-section {
			display: none;
		}

		.motion-paper {
			box-shadow: none;
			border: none;
			padding: var(--space-8);
		}

		.motion-paper::before {
			display: none;
		}
	}
</style>
