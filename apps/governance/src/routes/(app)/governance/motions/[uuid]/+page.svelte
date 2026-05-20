<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';
	import { Button, Card } from '@bfs/ui';
	
	// Components
	import MotionDocumentView from '../../../library/[slug]/views/MotionDocumentView.svelte';
	import MotionVoteTally from './MotionVoteTally.svelte';
	import VoteSessionControl from './VoteSessionControl.svelte';
	import VoteSessionsList from './VoteSessionsList.svelte';
	import MotionDiscussion from './MotionDiscussion.svelte';
	
	// Modals
	import ClerkNotesModal from './modals/ClerkNotesModal.svelte';
	import ParliamentarianNotesModal from './modals/ParliamentarianNotesModal.svelte';
	import RulesModal from './modals/RulesModal.svelte';
	import VoteSessionModal from './modals/VoteSessionModal.svelte';
	import ChangeStatusModal from './modals/ChangeStatusModal.svelte';
	import CastVoteModal from './modals/CastVoteModal.svelte';

	let { data }: { data: PageData } = $props();

	// motion is flattened in page.server.ts for backward compatibility
	const { motion, introducer, body, voteSessions, activeSession, tally, voteRules, currentRule, deliberationRules, currentDeliberationRule, comments, canAdvance, canCreateVoteSession, alreadyVoted, userCanVote, actingAs } = $derived(data);

	let showClerkModal = $state(false);
	let showParliamentarianModal = $state(false);
	let showRulesModal = $state(false);
	let showVoteSessionModal = $state(false);
	let showChangeStatusModal = $state(false);
	let showCastVoteModal = $state(false);
</script>

<div class="page">
	<!-- Header with back button -->
	<div class="page-header">
		<a href="/governance/motions" class="back-link">← Back to Motions</a>
	</div>

	<!-- Page Title -->
	<h1 class="motion-page-title">Motion Deliberation</h1>

	<!-- SECTION 1: MOTION DOCUMENT -->
	<div class="section document-section">
		<MotionDocumentView document={motion} />
	</div>

	<!-- SECTION 2: ACTIONS -->
	<div class="section actions-section">
		<!-- Active Vote Session Control -->
		{#if activeSession}
			<VoteSessionControl 
				session={activeSession} 
				canControl={canAdvance}
				userCanVote={userCanVote}
				userHasVoted={alreadyVoted}
				motionTitle={motion.title}
				onSessionChange={() => window.location.reload()}
				onOpenVoteModal={() => showCastVoteModal = true}
			/>
		{/if}

		<!-- Vote Tally -->
		{#if tally}
			<MotionVoteTally {tally} {currentRule} />
		{/if}

		<!-- Historical Vote Sessions - Only show if there are past sessions -->
		{#if voteSessions.length > 1 || (voteSessions.length === 1 && !activeSession)}
			<VoteSessionsList 
				voteSessions={voteSessions.filter(s => !activeSession || s.uuid !== activeSession.uuid)} 
			/>
		{/if}

		<!-- Lifecycle Actions -->
		{#if !['enacted','rejected','withdrawn'].includes(motion.status)}
			<Card padding="lg">
				<div class="card-header">
					<h3 class="card-title">Actions</h3>
				</div>
				<div class="action-row">
					{#if canAdvance}
						<div class="admin-actions">
							<Button variant="ghost" size="sm" onclick={() => showChangeStatusModal = true}>
								{#snippet children()}
									Change Status
								{/snippet}
							</Button>
							{#if !['voting', 'deliberation', 'enacted', 'rejected', 'withdrawn'].includes(motion.status)}
								<Button variant="ghost" size="sm" onclick={() => showRulesModal = true}>
									{#snippet children()}
										{currentRule || currentDeliberationRule ? 'Edit' : 'Set'} Rules
									{/snippet}
								</Button>
							{/if}
							<Button variant="ghost" size="sm" onclick={() => showClerkModal = true}>
								{#snippet children()}
									{motion.clerk_notes ? 'Edit' : 'Add'} Clerk's Notes
								{/snippet}
							</Button>
							<Button variant="ghost" size="sm" onclick={() => showParliamentarianModal = true}>
								{#snippet children()}
									{motion.parliamentarian_notes ? 'Edit' : 'Add'} Parliamentarian's Notes
								{/snippet}
							</Button>
						</div>
					{/if}

					{#if motion.status === 'draft' && canAdvance}
						<form method="POST" action="?/advance" use:enhance>
							<input type="hidden" name="to" value="introduced" />
							<Button variant="primary" type="submit">
								{#snippet children()}Introduce{/snippet}
							</Button>
						</form>
					{/if}
					
					{#if motion.status === 'introduced' && canAdvance}
						<form method="POST" action="?/advance" use:enhance>
							<input type="hidden" name="to" value="deliberation" />
							<Button variant="primary" type="submit">
								{#snippet children()}Begin Deliberation{/snippet}
							</Button>
						</form>
					{/if}
					
					{#if motion.status === 'deliberation'}
						{#if currentDeliberationRule}
							<div class="deliberation-info">
								<span class="rule-label">Deliberation Period: <strong>{currentDeliberationRule.name}</strong></span>
							</div>
						{/if}
						
						{#if !activeSession && canCreateVoteSession}
							<div class="create-vote-prompt">
								<p>This motion is open for discussion.</p>
								<Button variant="primary" onclick={() => showVoteSessionModal = true}>
									{#snippet children()}🗳️ Create Vote Session{/snippet}
								</Button>
							</div>
						{/if}
					{/if}
					
					{#if motion.status === 'voting' && !activeSession}
						<div class="meeting-notice meeting-notice--waiting">
							<span>Voting phase - waiting for vote session</span>
							{#if canCreateVoteSession}
								<Button variant="primary" size="sm" onclick={() => showVoteSessionModal = true}>
									{#snippet children()}Create Vote Session{/snippet}
								</Button>
							{/if}
						</div>
					{/if}

					{#if motion.status === 'adopted'}
						<div class="adopted-notice">
							<div class="notice-content">
								<strong>Motion Adopted</strong>
								<p>This motion has been approved by vote. The clerk should implement the required actions and then mark it as enacted.</p>
							</div>
						</div>
						{#if canAdvance}
							<form method="POST" action="?/advance" use:enhance>
								<input type="hidden" name="to" value="enacted" />
								<Button variant="primary" type="submit">
									{#snippet children()}Mark as Enacted{/snippet}
								</Button>
							</form>
						{/if}
					{/if}

					{#if motion.status === 'rejected'}
						<div class="rejected-notice">
							<div class="notice-content">
								<strong>Motion Rejected</strong>
								<p>This motion did not pass the vote. No further action is required.</p>
							</div>
						</div>
					{/if}

					{#if canAdvance && !['adopted', 'rejected', 'enacted', 'withdrawn'].includes(motion.status)}
						<form method="POST" action="?/advance" use:enhance>
							<input type="hidden" name="to" value="withdrawn" />
							<Button variant="danger" type="submit">
								{#snippet children()}Withdraw{/snippet}
							</Button>
						</form>
					{/if}
				</div>
			</Card>
		{/if}
	</div>

	<!-- 3. DISCUSSION THREAD - Only show during deliberation and voting -->
	{#if ['deliberation', 'voting'].includes(motion.status)}
		<div class="section deliberation-section">
			<MotionDiscussion {comments} {actingAs} />
		</div>
	{/if}
</div>

<!-- Modals -->
<ChangeStatusModal bind:open={showChangeStatusModal} currentStatus={motion.status} />
<ClerkNotesModal bind:open={showClerkModal} clerkNotes={motion.clerk_notes} />
<ParliamentarianNotesModal bind:open={showParliamentarianModal} parliamentarianNotes={motion.parliamentarian_notes} />
<RulesModal 
	bind:open={showRulesModal} 
	voteRuleUuid={motion.vote_rule_uuid} 
	deliberationRuleUuid={motion.deliberation_rule_uuid}
	{voteRules}
	{deliberationRules}
/>
<VoteSessionModal bind:open={showVoteSessionModal} />
{#if activeSession}
	<CastVoteModal 
		bind:open={showCastVoteModal} 
		sessionUuid={activeSession.uuid}
		motionTitle={motion.title}
	/>
{/if}

<style>
	.page {
		max-width: 1000px;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-6);
	}

	.back-link {
		color: var(--color-accent);
		text-decoration: none;
		font-size: var(--text-sm);
		font-weight: 500;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.motion-page-title {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-4xl);
		font-weight: 400;
		color: #151c1a;
		text-align: center;
		margin: 0 0 var(--space-8) 0;
		line-height: 1.2;
	}

	.section {
		margin-bottom: var(--space-10);
	}

	.actions-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	/* Override Card component to match classical aesthetic */
	.actions-section :global(.card) {
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		border-radius: 0;
		box-shadow: 
			0 2px 4px rgba(0,0,0,0.06),
			0 8px 24px rgba(0,0,0,0.10);
	}

	/* Action row styles */
	.card-header {
		margin-bottom: var(--space-4);
	}

	.card-title {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0;
	}

	.action-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.admin-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		padding-bottom: var(--space-4);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.deliberation-info {
		padding: var(--space-3);
		background: rgba(250, 250, 247, 0.5);
		border: 1px solid rgba(45, 90, 79, 0.2);
	}

	.create-vote-prompt {
		padding: var(--space-5);
		background: rgba(250, 250, 247, 0.8);
		border: 2px dashed rgba(45, 90, 79, 0.3);
		border-radius: var(--radius);
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
	}

	.create-vote-prompt p {
		margin: 0;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: #374340;
	}

	.rule-label {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #374340;
	}

	.meeting-notice {
		padding: var(--space-4);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		background: rgba(250, 250, 247, 0.5);
		border: 1px solid rgba(45, 90, 79, 0.2);
	}

	.meeting-notice--waiting {
		background: #fff3e0;
		border-color: #ffb74d;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
	}

	.adopted-notice {
		padding: var(--space-4);
		background: #f0f9f4;
		border: 1px solid #86c392;
	}

	.adopted-notice .notice-content {
		flex: 1;
	}

	.adopted-notice .notice-content strong {
		display: block;
		font-family: 'IM Fell English SC', serif;
		letter-spacing: 0.1em;
		color: #2d5f3d;
		margin-bottom: var(--space-1);
	}

	.adopted-notice .notice-content p {
		margin: 0;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #3d6f4d;
	}

	.rejected-notice {
		padding: var(--space-4);
		background: #ffebee;
		border: 1px solid #ef9a9a;
	}

	.rejected-notice .notice-content {
		flex: 1;
	}

	.rejected-notice .notice-content strong {
		display: block;
		font-family: 'IM Fell English SC', serif;
		letter-spacing: 0.1em;
		color: #c62828;
		margin-bottom: var(--space-1);
	}

	.rejected-notice .notice-content p {
		margin: 0;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #8b3a3a;
	}
</style>
