<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';
	import { Button, Card, MotionDocument } from '@bfs/ui';
	
	// Components
	import MotionVoteTally from './MotionVoteTally.svelte';
	import VoteSessionControl from './VoteSessionControl.svelte';
	import VoteSessionsList from './VoteSessionsList.svelte';
	import MotionDiscussion from './MotionDiscussion.svelte';
	
	// Modals
	import ClerkNotesModal from './modals/ClerkNotesModal.svelte';
	import ParliamentarianNotesModal from './modals/ParliamentarianNotesModal.svelte';
	import RulesModal from './modals/RulesModal.svelte';
	import VoteSessionModal from './modals/VoteSessionModal.svelte';
	import CastVoteModal from './modals/CastVoteModal.svelte';

	let { data }: { data: PageData } = $props();

	// motion is flattened in page.server.ts for backward compatibility
	const { motion, introducer, body, voteSessions, activeSession, tally, voteRules, currentRule, deliberationRules, currentDeliberationRule, comments, canAdvance, canCreateVoteSession, alreadyVoted, userCanVote, actingAs, currentStatus, bodySlugForMove } = $derived(data);

	const backLink = $derived(
		body?.handle === 'general-assembly' ? '/governance/general-assembly' :
		body?.type === 'committee' ? `/organization/committees/${body.uuid}` :
		body?.type === 'service' ? `/organization/services/${body.uuid}` :
		body?.type ? `/organization/associations/${body.uuid}` :
		'/'
	);

	// Available statuses for motion folders
	const motionStatuses = ['inbox', 'queued', 'deliberating', 'rejected', 'adopted', 'enacted'];
	const statusLabels: Record<string, string> = {
		inbox: 'Inbox',
		queued: 'Queued',
		deliberating: 'Deliberating',
		rejected: 'Rejected',
		adopted: 'Adopted',
		enacted: 'Enacted'
	};

	let showClerkModal = $state(false);
	let showParliamentarianModal = $state(false);
	let showRulesModal = $state(false);
	let showVoteSessionModal = $state(false);
	let showCastVoteModal = $state(false);
	let isMoving = $state(false);
	
	// Tab navigation
	type Tab = 'motion' | 'discussion' | 'votes';
	let activeTab = $state<Tab>('motion');
</script>

<div class="page">
	<!-- Header with back button -->
	<div class="page-header">
		<a href={backLink} class="back-link">← Back to {body?.name ?? 'Body'}</a>
		
		<div class="status-indicator">
			<span class="status-label">Status:</span>
			<span class="status-value">{statusLabels[currentStatus] || currentStatus}</span>
		</div>
	</div>

	<!-- Page Title -->
	<h1 class="motion-page-title">Motion Deliberation</h1>

	<!-- ACTIONS BAR - Only visible to those with permissions -->
	{#if canAdvance && !['enacted', 'rejected'].includes(currentStatus)}
		<div class="actions-bar">
			<Card padding="lg">
			<div class="card-header">
				<h3 class="card-title">Actions</h3>
				
				{#if bodySlugForMove}
					<form 
						method="POST" 
						action="?/moveDocument"
						class="move-form"
						use:enhance={() => {
							isMoving = true;
							return async ({ update }) => {
								await update();
								isMoving = false;
								window.location.reload();
							};
						}}
					>
						<input type="hidden" name="bodySlug" value={bodySlugForMove} />
						
						<label for="toStatus" class="move-label">Move to:</label>
						<select 
							id="toStatus" 
							name="toStatus" 
							class="move-select"
							disabled={isMoving}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							<option value="">--</option>
							{#each motionStatuses as s}
								{#if s !== currentStatus}
									<option value={s}>{statusLabels[s] || s}</option>
								{/if}
							{/each}
						</select>
					</form>
				{/if}
			</div>
			<div class="action-row">
				<div class="admin-actions">
					{#if !['adopted', 'rejected', 'enacted'].includes(currentStatus)}
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

				{#if currentStatus === 'inbox'}
					<form method="POST" action="?/advance" use:enhance>
						<input type="hidden" name="to" value="deliberation" />
						<Button variant="primary" type="submit">
							{#snippet children()}Start Discussion{/snippet}
						</Button>
					</form>
				{/if}
				
				{#if currentStatus === 'deliberating'}
					{#if currentDeliberationRule}
						<div class="deliberation-info">
							<span class="rule-label">Discussion Period: <strong>{currentDeliberationRule.name}</strong></span>
						</div>
					{/if}
					
					{#if !activeSession && canCreateVoteSession}
						<Button variant="primary" onclick={() => showVoteSessionModal = true}>
							{#snippet children()}🗳️ Create Vote Session{/snippet}
						</Button>
					{/if}
				{/if}

				{#if currentStatus === 'adopted'}
					<div class="adopted-notice">
						<div class="notice-content">
							<strong>Motion Adopted</strong>
							<p>This motion has been approved by vote. The clerk should implement the required actions and then mark it as enacted.</p>
						</div>
					</div>
					<form method="POST" action="?/advance" use:enhance>
						<input type="hidden" name="to" value="enacted" />
						<Button variant="primary" type="submit">
							{#snippet children()}Mark as Enacted{/snippet}
						</Button>
					</form>
				{/if}

				{#if currentStatus === 'rejected'}
					<div class="rejected-notice">
						<div class="notice-content">
							<strong>Motion Rejected</strong>
							<p>This motion did not pass the vote. No further action is required.</p>
						</div>
					</div>
				{/if}

				{#if !['adopted', 'rejected', 'enacted'].includes(currentStatus)}
					<form method="POST" action="?/advance" use:enhance>
						<input type="hidden" name="to" value="withdrawn" />
						<Button variant="danger" type="submit">
							{#snippet children()}Withdraw{/snippet}
						</Button>
					</form>
				{/if}
			</div>
		</Card>
		</div>
	{/if}

	<!-- TAB NAVIGATION -->
	<div class="tabs">
		<button 
			class="tab" 
			class:active={activeTab === 'motion'}
			onclick={() => activeTab = 'motion'}
		>
			Motion
		</button>
		{#if currentStatus === 'deliberating'}
			<button 
				class="tab" 
				class:active={activeTab === 'discussion'}
				onclick={() => activeTab = 'discussion'}
			>
				Discussion
			</button>
		{/if}
		<button 
			class="tab" 
			class:active={activeTab === 'votes'}
			onclick={() => activeTab = 'votes'}
		>
			Votes
		</button>
	</div>

	<!-- TAB CONTENT -->
	<div class="tab-content">
		{#if activeTab === 'motion'}
			<div class="tab-panel">
				<MotionDocument motion={motion as any} mode="view" />
			</div>
		{/if}

		{#if activeTab === 'discussion'}
			<div class="tab-panel">
				<MotionDiscussion {comments} {actingAs} />
			</div>
		{/if}

		{#if activeTab === 'votes'}
			<div class="tab-panel">
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

				<!-- Historical Vote Sessions -->
				{#if voteSessions.length > 1 || (voteSessions.length === 1 && !activeSession)}
					<VoteSessionsList 
						voteSessions={voteSessions.filter(s => !activeSession || s.uuid !== activeSession.uuid)} 
					/>
				{:else if !activeSession && voteSessions.length === 0}
					<div class="no-votes">
						<p>No vote sessions yet.</p>
						{#if canCreateVoteSession && currentStatus === 'deliberating'}
							<p>Create a vote session from the Actions section above when ready.</p>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Modals -->
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

	.status-indicator {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: var(--paper);
		border: 1px solid var(--border);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
	}

	.status-label {
		font-weight: 600;
		color: var(--ink-mid);
	}

	.status-value {
		color: var(--ink);
		text-transform: capitalize;
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

	/* Actions bar spacing */
	.actions-bar {
		margin-bottom: var(--space-6);
	}

	/* Override Card component to match classical aesthetic */
	:global(.card) {
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
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
	}

	.card-title {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0;
	}

	/* Move form styles */
	.move-form {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.move-label {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		color: var(--ink-mid);
		text-transform: uppercase;
	}

	.move-select {
		padding: var(--space-2) var(--space-3);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		border: 1px solid var(--border);
		background: var(--paper);
		color: var(--ink);
		border-radius: 2px;
		cursor: pointer;
		transition: border-color 0.2s;
		min-width: 150px;
	}

	.move-select:hover:not(:disabled) {
		border-color: var(--gold);
	}

	.move-select:focus {
		outline: none;
		border-color: var(--gold);
	}

	.move-select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	.rule-label {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #374340;
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

	/* Tab navigation */
	.tabs {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-6);
		border-bottom: 2px solid rgba(45, 90, 79, 0.2);
	}

	.tab {
		padding: var(--space-3) var(--space-6);
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		background: transparent;
		border: none;
		border-bottom: 3px solid transparent;
		color: var(--ink-mid);
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		bottom: -2px;
	}

	.tab:hover {
		color: var(--ink);
		background: rgba(45, 90, 79, 0.05);
	}

	.tab.active {
		color: var(--gold);
		border-bottom-color: var(--gold);
		background: rgba(191, 152, 74, 0.05);
	}

	/* Tab content */
	.tab-content {
		min-height: 400px;
	}

	.tab-panel {
		animation: fadeIn 0.2s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.no-votes {
		padding: var(--space-8);
		text-align: center;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: var(--ink-mid);
		font-style: italic;
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
	}

	.no-votes p {
		margin: var(--space-2) 0;
	}
</style>
