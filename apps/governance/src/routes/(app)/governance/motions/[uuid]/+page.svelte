<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';
	import { Button, Modal, Parchment, Textarea, Select, Input } from '@bfs/ui';

	let { data }: { data: PageData } = $props();

	const { motion, introducer, body, voteSessions, activeSession, tally, voteRules, currentRule, deliberationRules, currentDeliberationRule, comments, canAdvance, canCreateVoteSession, alreadyVoted, actingAs } = $derived(data);

	let editingCommentUuid = $state<string | null>(null);
	let editingCommentBody = $state('');
	let showClerkModal = $state(false);
	let clerkNotesValue = $state('');
	let showParliamentarianModal = $state(false);
	let parliamentarianNotesValue = $state('');
	let showRulesModal = $state(false);
	let selectedVotingRuleUuid = $state<string>('');
	let selectedDeliberationRuleUuid = $state<string>('');
	let showVoteSessionModal = $state(false);
	let voteSessionOpensAt = $state('');
	let voteSessionClosesAt = $state('');
	let voteSessionPassingThreshold = $state('50');
	let voteSessionRequiresQuorum = $state(false);
	let voteSessionQuorumThreshold = $state('50');

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
		selectedVotingRuleUuid = motion.vote_rule_uuid || '';
		selectedDeliberationRuleUuid = motion.deliberation_rule_uuid || '';
		showRulesModal = true;
	}

	function openVoteSessionModal() {
		// Default to opening in 1 hour, closing in 7 days
		const now = new Date();
		const defaultOpens = new Date(now.getTime() + 60 * 60 * 1000);
		const defaultCloses = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
		
		voteSessionOpensAt = defaultOpens.toISOString().slice(0, 16);
		voteSessionClosesAt = defaultCloses.toISOString().slice(0, 16);
		voteSessionPassingThreshold = '50';
		voteSessionRequiresQuorum = false;
		voteSessionQuorumThreshold = '50';
		showVoteSessionModal = true;
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
</script>

<div class="page-wrapper">
	<div class="document-controls">
		<a href="/governance/motions" class="back">← Back to Motions</a>
		{#if canAdvance}
			<div class="admin-controls">
				<Button variant="ghost" size="sm" onclick={() => openRulesModal()}>
					{#snippet children()}
						⚖️ {currentRule || currentDeliberationRule ? 'Edit' : 'Set'} Rules
					{/snippet}
				</Button>
				<Button variant="ghost" size="sm" onclick={() => openClerkModal()}>
					{#snippet children()}
						{motion.clerk_notes ? '✏️ Edit' : '📝 Add'} Clerk's Notes
					{/snippet}
				</Button>
				<Button variant="ghost" size="sm" onclick={() => openParliamentarianModal()}>
					{#snippet children()}
						{motion.parliamentarian_notes ? '✏️ Edit' : '📝 Add'} Parliamentarian's Notes
					{/snippet}
				</Button>
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
		</div>
		<div class="lifecycle-connector {['deliberation', 'enacted', 'rejected'].includes(motion.status) ? 'active' : ''}"></div>
		<div class="lifecycle-step {motion.status === 'deliberation' ? 'active' : ['enacted', 'rejected'].includes(motion.status) ? 'completed' : ''}">
			<div class="lifecycle-step__icon">🗳️</div>
			<div class="lifecycle-step__label">Deliberation</div>
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
	<Parchment>
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
	</Parchment>

	<div class="interactive-section">
	<!-- Vote Tally (if voting) -->
	{#if tally}
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
	{/if}

	<!-- Vote Sessions -->
	{#if motion.status === 'deliberation' || voteSessions.length > 0}
		<div class="paper-card">
			<div class="paper-card__header">
				<h3 class="paper-card__title">Vote Sessions</h3>
				{#if canCreateVoteSession && motion.status === 'deliberation'}
					<Button variant="primary" size="sm" onclick={() => openVoteSessionModal()}>
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
										• Quorum: {(session.quorum_threshold * 100).toFixed(0)}%
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
			{:else if motion.status === 'deliberation'}
				<p class="empty-state">No vote sessions scheduled yet. Create one to allow voting on this motion.</p>
			{/if}
		</div>
	{/if}

	<!-- Actions -->
	{#if !['enacted','rejected','withdrawn'].includes(motion.status)}
		<div class="paper-card">
			<div class="paper-card__header">
				<h3 class="paper-card__title">Actions</h3>
			</div>
			<div class="action-row">
				{#if motion.status === 'draft' && canAdvance}
					<form method="POST" action="?/advance">
						<input type="hidden" name="to" value="introduced" />
						<button class="btn btn--primary">Introduce</button>
					</form>
				{/if}
				
				{#if motion.status === 'introduced'}
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
							<span class="rule-label">Deliberation Period: <strong>{currentDeliberationRule.name}</strong></span>
						</div>
					{/if}
					
					{#if activeSession}
						<!-- Active vote session - show voting interface -->
						{#if !alreadyVoted}
							<form method="POST" action="?/castVote" class="vote-form">
								<button class="btn btn--aye" name="choice" value="aye">Aye</button>
								<button class="btn btn--nay" name="choice" value="nay">Nay</button>
								<button class="btn btn--abstain" name="choice" value="abstain">Abstain</button>
							</form>
						{:else}
							<span class="vote-recorded">Your vote is recorded.</span>
						{/if}
						<div class="meeting-notice">
							<a href="/governance/vote-sessions/{activeSession.uuid}" class="meeting-link">
								🗳️ Vote session open - Closes {new Date(activeSession.closes_at).toLocaleString()}
							</a>
						</div>
					{:else}
						<!-- No active vote session -->
						<div class="meeting-notice meeting-notice--waiting">
							<span>Create a vote session to allow voting on this motion</span>
						</div>
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
	</div> <!-- End interactive-section -->

	<div class="discussion">
		<div class="paper-card__header">
			<h3 class="paper-card__title">Discussion</h3>
			<span class="paper-card__subtitle">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
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
	</div> <!-- End discussion -->

	<!-- Clerk Notes Modal -->
	<Modal open={showClerkModal} title="Clerk's Notes">
		<form id="clerk-notes-form" method="POST" action="?/setClerkNotes" use:enhance={() => {
			return ({ update }) => {
				update().then(() => {
					showClerkModal = false;
				});
			};
		}}>
			<p class="modal-hint">Administrative reminders for actions needed if this motion passes...</p>
			<Textarea 
				name="clerk_notes" 
				bind:value={clerkNotesValue}
				rows={8}
				placeholder="Enter clerk's notes here..."
				autofocus />
		</form>
		{#snippet footer()}
			<Button variant="secondary" onclick={() => showClerkModal = false}>
				{#snippet children()}Cancel{/snippet}
			</Button>
			<Button type="submit" form="clerk-notes-form">
				{#snippet children()}Save Notes{/snippet}
			</Button>
		{/snippet}
	</Modal>

	<!-- Parliamentarian Notes Modal -->
	<Modal open={showParliamentarianModal} title="Parliamentarian's Notes">
		<form id="parliamentarian-notes-form" method="POST" action="?/setParliamentarianNotes" use:enhance={() => {
			return ({ update }) => {
				update().then(() => {
					showParliamentarianModal = false;
				});
			};
		}}>
			<p class="modal-hint">Procedural notes, rule interpretations, precedent references...</p>
			<Textarea 
				name="parliamentarian_notes" 
				bind:value={parliamentarianNotesValue}
				rows={8}
				placeholder="Enter parliamentarian's notes here..."
				autofocus />
		</form>
		{#snippet footer()}
			<Button variant="secondary" onclick={() => showParliamentarianModal = false}>
				{#snippet children()}Cancel{/snippet}
			</Button>
			<Button type="submit" form="parliamentarian-notes-form">
				{#snippet children()}Save Notes{/snippet}
			</Button>
		{/snippet}
	</Modal>

	<!-- Rules Modal -->
	<Modal open={showRulesModal} title="Set Motion Rules">
		<form id="rules-form" method="POST" action="?/setMotionRules" use:enhance={() => {
			return async ({ update }) => {
				await update();
				showRulesModal = false;
			};
		}}>
			<p class="modal-hint">These rules determine how this motion will be voted on and how long the deliberation period lasts.</p>
			
			<Select 
				id="vote-rule" 
				name="vote_rule_uuid" 
				label="Voting Threshold:"
				bind:value={selectedVotingRuleUuid}
			>
				<option value="">Not set</option>
				{#each voteRules as rule}
					<option value={rule.uuid}>
						{rule.name} ({rule.numerator}/{rule.denominator})
					</option>
				{/each}
			</Select>
			
			<Select 
				id="deliberation-rule" 
				name="deliberation_rule_uuid" 
				label="Deliberation Period:"
				bind:value={selectedDeliberationRuleUuid}
			>
				<option value="">Not set</option>
				{#each deliberationRules as rule}
					<option value={rule.uuid}>
						{rule.name} ({rule.minimum_days} days)
					</option>
				{/each}
			</Select>
		</form>
		{#snippet footer()}
			<Button variant="secondary" onclick={() => showRulesModal = false}>
				{#snippet children()}Cancel{/snippet}
			</Button>
			<Button type="submit" form="rules-form">
				{#snippet children()}Save Changes{/snippet}
			</Button>
		{/snippet}
	</Modal>

	<!-- Vote Session Modal -->
	<Modal open={showVoteSessionModal} title="Create Vote Session">
		<form id="vote-session-form" method="POST" action="?/createVoteSession" use:enhance={() => {
			return async ({ update }) => {
				await update();
				showVoteSessionModal = false;
			};
		}}>
			<p class="modal-hint">Schedule a voting period for this motion. Members can vote during the open period.</p>
			
			<Input 
				type="datetime-local"
				name="opens_at" 
				label="Opens At:"
				bind:value={voteSessionOpensAt}
				required />
			
			<Input 
				type="datetime-local"
				name="closes_at" 
				label="Closes At:"
				bind:value={voteSessionClosesAt}
				required />
			
			<Input 
				type="number"
				name="passing_threshold" 
				label="Passing Threshold (%):"
				bind:value={voteSessionPassingThreshold}
				min="0"
				max="100"
				required />
			
			<label class="checkbox-label">
				<input 
					type="checkbox" 
					name="requires_quorum"
					bind:checked={voteSessionRequiresQuorum} />
				Requires Quorum
			</label>
			
			{#if voteSessionRequiresQuorum}
				<Input 
					type="number"
					name="quorum_threshold" 
					label="Quorum Threshold (%):"
					bind:value={voteSessionQuorumThreshold}
					min="0"
					max="100"
					required />
			{/if}
		</form>
		{#snippet footer()}
			<Button variant="secondary" onclick={() => showVoteSessionModal = false}>
				{#snippet children()}Cancel{/snippet}
			</Button>
			<Button type="submit" form="vote-session-form">
				{#snippet children()}Create Session{/snippet}
			</Button>
		{/snippet}
	</Modal>
</div> <!-- End page-wrapper -->

<style>
	/* ========================================
	   PAGE LAYOUT
	   ======================================== */
	.page-wrapper {
		min-height: 100vh;
		background: linear-gradient(to bottom, #f5f5f0 0%, #e8e8e0 100%);
		padding: var(--space-8) 0;
	}

	.document-controls {
		max-width: 1000px;
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

	/* ========================================
	   LIFECYCLE INDICATOR
	   ======================================== */
	.lifecycle-indicator {
		max-width: 1000px;
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

	.lifecycle-step.active { opacity: 1; }
	.lifecycle-step.completed { opacity: 0.7; }

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

	/* ========================================
	   PARCHMENT DOCUMENT STYLES
	   ======================================== */
	.motion-header {
		margin-bottom: var(--space-8);
		padding-bottom: var(--space-6);
		border-bottom: 2px solid rgba(139, 115, 85, 0.2);
	}

	.motion-letterhead {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-8);
		font-family: 'Georgia', serif;
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
	}

	.motion-title {
		font-family: 'Georgia', serif;
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
		font-family: 'Georgia', serif;
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

	.timer-display--expired,
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
		color: var(--color-text-muted);
		font-size: 0.9em;
	}

	/* Motion Body Content */
	.motion-body {
		font-family: 'Georgia', serif;
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

	/* Official Annotations */
	.clerk-annotation,
	.parliamentarian-annotation {
		margin-top: var(--space-10);
		position: relative;
		border: 2px solid;
		border-radius: 3px;
		padding: var(--space-6);
		background: rgba(255, 255, 255, 0.9);
	}

	.clerk-annotation {
		border-color: #5b8cb8;
		background-image: 
			linear-gradient(135deg, rgba(91, 140, 184, 0.05) 0%, rgba(91, 140, 184, 0.02) 100%);
	}

	.parliamentarian-annotation {
		border-color: #8b6cb8;
		background-image: 
			linear-gradient(135deg, rgba(139, 108, 184, 0.05) 0%, rgba(139, 108, 184, 0.02) 100%);
	}

	.annotation-stamp {
		position: absolute;
		top: -12px;
		left: var(--space-6);
		font-family: 'Georgia', serif;
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

	.annotation-heading {
		font-family: 'Georgia', serif;
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
		font-family: 'Georgia', serif;
		font-size: var(--text-sm);
		line-height: 1.7;
		color: #2c2416;
		white-space: pre-wrap;
	}

	/* ========================================
	   INTERACTIVE SECTION (VOTES & ACTIONS)
	   ======================================== */
	.interactive-section {
		max-width: 900px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		padding: 0 var(--space-4);
	}

	/* Unified Paper Card Style */
	.paper-card,
	.discussion {
		background: linear-gradient(to bottom, #fdfdf8 0%, #f9f9f4 100%);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 4px 12px rgba(0, 0, 0, 0.08);
		border: 1px solid rgba(139, 115, 85, 0.15);
		border-radius: 2px;
		padding: var(--space-6);
		position: relative;
	}

	/* Lined paper texture */
	.paper-card::before,
	.discussion::before {
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

	/* Card content above texture */
	.paper-card > *,
	.discussion > * {
		position: relative;
		z-index: 1;
	}

	/* Unified Card Header */
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

	.paper-card__subtitle {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
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

	/* Vote Statistics */
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

	/* Action Row */
	.action-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: center;
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
	}

	.readiness-badge {
		font-size: var(--text-xs);
		font-weight: 600;
		color: #5b8cb8;
		background: rgba(91, 140, 184, 0.1);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
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

	/* Deliberation States */
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

	/* ========================================
	   DISCUSSION SECTION
	   ======================================== */
	.discussion {
		max-width: 900px;
		margin: var(--space-6) auto var(--space-8);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.discussion__empty,
	.discussion__login {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		padding: var(--space-8) 0;
	}

	.discussion__login {
		padding: var(--space-4);
		background: rgba(255, 255, 255, 0.5);
		border-radius: var(--radius-md);
	}

	/* Comment Thread */
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
		border-radius: 50%;
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
	}

	.comment__handle,
	.comment__date,
	.comment__edited {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}

	.comment__edited {
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

	.comment__action:hover {
		color: var(--color-text);
	}

	.comment__action--danger:hover {
		color: #991b1b;
	}

	.comment__body {
		margin: 0;
		font-size: var(--text-sm);
		line-height: 1.7;
		white-space: pre-wrap;
	}

	.comment__edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.comment__edit-input,
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
		border-radius: 50%;
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

	/* ========================================
	   BUTTON VARIANTS
	   ======================================== */
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

	/* ========================================
	   MODAL STYLES
	   ======================================== */
	.modal-hint {
		margin: 0 0 var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-style: italic;
	}

	/* ========================================
	   RESPONSIVE STYLES
	   ======================================== */
	@media (max-width: 768px) {
		.page-wrapper {
			padding: var(--space-4) 0;
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

	/* Vote Sessions */
	.vote-sessions-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.vote-session-item {
		display: flex;
		gap: var(--space-4);
		align-items: center;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: white;
		transition: all 0.2s;
	}

	.vote-session-item.is-active {
		border-color: #10b981;
		background: rgba(16, 185, 129, 0.02);
	}

	.session-status {
		flex-shrink: 0;
	}

	.badge {
		display: inline-block;
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-full);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.badge--scheduled {
		background: rgba(59, 130, 246, 0.1);
		color: #1e40af;
	}

	.badge--open {
		background: rgba(16, 185, 129, 0.1);
		color: #047857;
	}

	.badge--closed {
		background: rgba(107, 114, 128, 0.1);
		color: #374151;
	}

	.badge--passed {
		background: rgba(16, 185, 129, 0.1);
		color: #047857;
	}

	.badge--failed {
		background: rgba(239, 68, 68, 0.1);
		color: #991b1b;
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
	}

	.empty-state {
		padding: var(--space-6);
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	@media print {
		.page-wrapper {
			background: white;
			padding: 0;
		}

		.document-controls,
		.interactive-section {
			display: none;
		}
	}

	/* Checkbox label styling for modals */
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text);
		cursor: pointer;
		margin: var(--space-4) 0;
	}

	.checkbox-label input[type="checkbox"] {
		cursor: pointer;
	}
</style>
