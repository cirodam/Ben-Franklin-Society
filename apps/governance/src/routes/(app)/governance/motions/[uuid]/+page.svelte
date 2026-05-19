<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';
	import { Button, Card } from '@bfs/ui';
	
	// Components
	import MotionLifecycle from './MotionLifecycle.svelte';
	import MotionDocument from './MotionDocument.svelte';
	import MotionVoteTally from './MotionVoteTally.svelte';
	import VoteSessionsList from './VoteSessionsList.svelte';
	import MotionDiscussion from './MotionDiscussion.svelte';
	
	// Modals
	import ClerkNotesModal from './modals/ClerkNotesModal.svelte';
	import ParliamentarianNotesModal from './modals/ParliamentarianNotesModal.svelte';
	import RulesModal from './modals/RulesModal.svelte';
	import VoteSessionModal from './modals/VoteSessionModal.svelte';
	import ChangeStatusModal from './modals/ChangeStatusModal.svelte';

	let { data }: { data: PageData } = $props();

	// motion is flattened in page.server.ts for backward compatibility
	const { motion, introducer, body, voteSessions, activeSession, tally, voteRules, currentRule, deliberationRules, currentDeliberationRule, comments, canAdvance, canCreateVoteSession, alreadyVoted, actingAs } = $derived(data);

	let showClerkModal = $state(false);
	let showParliamentarianModal = $state(false);
	let showRulesModal = $state(false);
	let showVoteSessionModal = $state(false);
	let showChangeStatusModal = $state(false);
</script>

<div class="page">
	<!-- Header with back button and admin controls -->
	<div class="page-header">
		<a href="/governance/motions" class="back-link">← Back to Motions</a>
		{#if canAdvance}
			<div class="admin-controls">
				<Button variant="ghost" size="sm" onclick={() => showChangeStatusModal = true}>
					{#snippet children()}
						🔄 Change Status
					{/snippet}
				</Button>
				<Button variant="ghost" size="sm" onclick={() => showRulesModal = true}>
					{#snippet children()}
						⚖️ {currentRule || currentDeliberationRule ? 'Edit' : 'Set'} Rules
					{/snippet}
				</Button>
				<Button variant="ghost" size="sm" onclick={() => showClerkModal = true}>
					{#snippet children()}
						{motion.clerk_notes ? '✏️ Edit' : '📝 Add'} Clerk's Notes
					{/snippet}
				</Button>
				<Button variant="ghost" size="sm" onclick={() => showParliamentarianModal = true}>
					{#snippet children()}
						{motion.parliamentarian_notes ? '✏️ Edit' : '📝 Add'} Parliamentarian's Notes
					{/snippet}
				</Button>
			</div>
		{/if}
	</div>

	<!-- Lifecycle visual -->
	<MotionLifecycle {motion} />

	<!-- 1. MOTION DOCUMENT -->
	<div class="section">
		<MotionDocument {motion} {body} {introducer} {currentRule} {currentDeliberationRule} />
	</div>

	<!-- 2. ACTIONS AREA -->
	<div class="section actions-section">
		<!-- Vote Tally -->
		{#if tally}
			<MotionVoteTally {tally} {currentRule} />
		{/if}

		<!-- Vote Sessions -->
		{#if motion.status === 'deliberation' || voteSessions.length > 0}
			<VoteSessionsList 
				{voteSessions} 
				{canCreateVoteSession} 
				{canAdvance}
				motionStatus={motion.status}
				onCreateSession={() => showVoteSessionModal = true}
			/>
		{/if}

		<!-- Lifecycle Actions -->
		{#if !['enacted','rejected','withdrawn'].includes(motion.status)}
			<Card padding="lg">
				<div class="card-header">
					<h3 class="card-title">Actions</h3>
				</div>
				<div class="action-row">
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
								{#snippet children()}Begin Deliberation & Voting{/snippet}
							</Button>
						</form>
					{/if}
					
					{#if motion.status === 'deliberation'}
						{#if currentDeliberationRule}
							<div class="deliberation-info">
								<span class="rule-label">Deliberation Period: <strong>{currentDeliberationRule.name}</strong></span>
							</div>
						{/if}
						
						{#if activeSession}
							<div class="meeting-notice">
								<a href="/governance/vote-sessions/{activeSession.uuid}" class="meeting-link">
									🗳️ Vote session open - Click to vote - Closes {new Date(activeSession.closes_at).toLocaleString()}
								</a>
							</div>
						{:else}
							<div class="meeting-notice meeting-notice--waiting">
								<span>Create a vote session to allow voting on this motion</span>
							</div>
						{/if}
					{/if}

					{#if motion.status === 'adopted'}
						<div class="adopted-notice">
							<div class="notice-icon">✅</div>
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

					{#if canAdvance}
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

	<!-- 3. COMMENT THREAD -->
	<div class="section">
		<MotionDiscussion {comments} {actingAs} />
	</div>
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

<style>
	.page {
		max-width: 1200px;
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

	.admin-controls {
		display: flex;
		gap: var(--space-2);
	}

	.section {
		margin-bottom: var(--space-8);
	}

	.actions-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	/* Action row styles */
	.card-header {
		margin-bottom: var(--space-4);
	}

	.card-title {
		font-size: var(--text-xl);
		font-weight: 600;
		margin: 0;
	}

	.action-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.deliberation-info {
		padding: var(--space-3);
		background: var(--color-bg);
		border-radius: var(--radius);
	}

	.rule-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.meeting-notice {
		padding: var(--space-4);
		background: var(--color-bg);
		border-radius: var(--radius);
		border: 1px solid var(--color-border);
	}

	.meeting-notice--waiting {
		background: #fff3e0;
		border-color: #ffb74d;
	}

	.meeting-link {
		color: var(--color-accent);
		text-decoration: none;
		font-weight: 500;
	}

	.meeting-link:hover {
		text-decoration: underline;
	}

	.adopted-notice {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-4);
		background: #f0f9f4;
		border: 1px solid #86c392;
		border-radius: var(--radius);
	}

	.adopted-notice .notice-icon {
		font-size: var(--text-2xl);
		flex-shrink: 0;
	}

	.adopted-notice .notice-content {
		flex: 1;
	}

	.adopted-notice .notice-content strong {
		display: block;
		color: #2d5f3d;
		margin-bottom: var(--space-1);
	}

	.adopted-notice .notice-content p {
		margin: 0;
		font-size: var(--text-sm);
		color: #3d6f4d;
	}
</style>
