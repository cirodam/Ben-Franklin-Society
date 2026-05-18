<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';
	import { Button, Modal, Select, Input, Textarea } from '@bfs/ui';

	let { data }: { data: PageData } = $props();

	const { meeting, availableMotions, canManage, actingAs } = $derived(data);

	let showAddMotionModal = $state(false);
	let selectedMotionUuid = $state('');
	let agendaNotes = $state('');

	let showOutcomeModal = $state(false);
	let outcomeMotionUuid = $state('');
	let outcomeAction = $state<string>('vote_held');
	let outcomeAye = $state('');
	let outcomeNay = $state('');
	let outcomeAbstain = $state('');
	let outcomeNotes = $state('');

	// Get committee uuid from meeting.body_uuid
	const committeeUuid = $derived(meeting.body_uuid);

	function openAddMotionModal() {
		selectedMotionUuid = '';
		agendaNotes = '';
		showAddMotionModal = true;
	}

	function openOutcomeModal(motionUuid: string) {
		outcomeMotionUuid = motionUuid;
		outcomeAction = 'vote_held';
		outcomeAye = '';
		outcomeNay = '';
		outcomeAbstain = '';
		outcomeNotes = '';
		showOutcomeModal = true;
	}

	function formatDateTime(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	}

	const statusLabel: Record<string, string> = {
		scheduled: 'Scheduled',
		in_progress: 'In Progress',
		completed: 'Completed',
		cancelled: 'Cancelled',
	};

	const statusVariant: Record<string, string> = {
		scheduled: 'status--introduced',
		in_progress: 'status--deliberation',
		completed: 'status--enacted',
		cancelled: 'status--rejected',
	};

	const actionOptions = [
		{ value: 'vote_held', label: 'Vote Held' },
		{ value: 'tabled', label: 'Tabled' },
		{ value: 'withdrawn', label: 'Withdrawn' },
		{ value: 'amended', label: 'Amended' },
		{ value: 'referred', label: 'Referred to Committee' },
	];
</script>

<div class="page">
	<header class="header">
		<div class="header__content">
			<a href="/committees/{committeeUuid}/meetings" class="back-link">← Back to Meetings</a>
			<h1 class="header__title">{meeting.title}</h1>
			<div class="header__meta">
				<span class="meeting-status {statusVariant[meeting.status] ?? ''}">
					{statusLabel[meeting.status] ?? meeting.status}
				</span>
				<span class="header__date">📅 {formatDateTime(meeting.scheduled_at)}</span>
				{#if meeting.location}
					<span class="header__location">📍 {meeting.location}</span>
				{/if}
			</div>
			{#if meeting.notes}
				<p class="header__notes">{meeting.notes}</p>
			{/if}
		</div>

		{#if canManage && meeting.status === 'scheduled'}
			<div class="header__actions">
				<form method="POST" action="?/startMeeting" use:enhance>
					<Button type="submit" variant="primary">▶️ Start Meeting</Button>
				</form>
			</div>
		{/if}

		{#if canManage && meeting.status === 'in_progress'}
			<div class="header__actions">
				<form method="POST" action="?/completeMeeting" use:enhance>
					<Button type="submit" variant="primary">✓ Complete Meeting</Button>
				</form>
			</div>
		{/if}
	</header>

	<div class="content">
		<!-- Agenda -->
		<section class="section">
			<div class="section__header">
				<h2 class="section__heading">Meeting Agenda</h2>
				{#if canManage && (meeting.status === 'scheduled' || meeting.status === 'in_progress')}
					<Button variant="secondary" size="sm" onclick={openAddMotionModal}>
						+ Add Motion
					</Button>
				{/if}
			</div>

			{#if meeting.agenda_items.length === 0}
				<div class="empty-state">
					<div class="empty-state__icon">📋</div>
					<p class="empty-state__message">No items on the agenda yet</p>
					{#if canManage}
						<Button variant="primary" onclick={openAddMotionModal}>Add First Item</Button>
					{/if}
				</div>
			{:else}
				<div class="agenda-list">
					{#each meeting.agenda_items as item, index}
						<div class="agenda-item">
							<div class="agenda-item__number">{index + 1}</div>
							<div class="agenda-item__content">
								<div class="agenda-item__header">
									<a href="/motions/{item.motion_uuid}" class="agenda-item__title">
										{item.motion_title}
										<span class="agenda-item__motion-number">
											{item.motion_number ? `#${item.motion_number}` : ''}
										</span>
									</a>
									<span class="motion-status status--{item.motion_status}">
										{item.motion_status}
									</span>
								</div>

								{#if item.notes}
									<p class="agenda-item__notes">{item.notes}</p>
								{/if}

								{#if item.outcome}
									<div class="outcome">
										<div class="outcome__header">
											<strong>Outcome:</strong> {item.outcome.action_taken.replace('_', ' ')}
										</div>
										{#if item.outcome.action_taken === 'vote_held'}
											<div class="outcome__votes">
												<span class="vote vote--aye">Aye: {item.outcome.vote_aye}</span>
												<span class="vote vote--nay">Nay: {item.outcome.vote_nay}</span>
												<span class="vote vote--abstain">Abstain: {item.outcome.vote_abstain}</span>
											</div>
										{/if}
										{#if item.outcome.notes}
											<p class="outcome__notes">{item.outcome.notes}</p>
										{/if}
									</div>
								{:else if canManage && meeting.status === 'in_progress'}
									<div class="agenda-item__actions">
										<Button 
											variant="primary" 
											size="sm" 
											onclick={() => openOutcomeModal(item.motion_uuid)}
										>
											Record Outcome
										</Button>
									</div>
								{/if}
							</div>

							{#if canManage && !item.outcome && meeting.status === 'scheduled'}
								<form method="POST" action="?/removeFromAgenda" use:enhance>
									<input type="hidden" name="agenda_item_uuid" value={item.uuid} />
									<button type="submit" class="remove-button" title="Remove from agenda">✕</button>
								</form>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>

<!-- Add Motion Modal -->
<Modal bind:open={showAddMotionModal} title="Add Motion to Agenda">
	<form method="POST" action="?/addToAgenda" use:enhance={() => {
		return ({ update }) => {
			update();
			showAddMotionModal = false;
		};
	}}>
		<div class="form-group">
			<label for="motion_uuid">Select Motion</label>
			<Select id="motion_uuid" name="motion_uuid" bind:value={selectedMotionUuid} required>
				<option value="">-- Select a motion --</option>
				{#each availableMotions as motion}
					<option value={motion.uuid}>
						#{motion.motion_number} - {motion.title} ({motion.status})
					</option>
				{/each}
			</Select>
		</div>

		<div class="form-group">
			<label for="notes">Notes (Optional)</label>
			<Textarea id="notes" name="notes" bind:value={agendaNotes} placeholder="Additional context for this agenda item..." />
		</div>

		<div class="modal-actions">
			<Button type="button" variant="ghost" onclick={() => (showAddMotionModal = false)}>
				Cancel
			</Button>
			<Button type="submit" variant="primary">Add to Agenda</Button>
		</div>
	</form>
</Modal>

<!-- Record Outcome Modal -->
<Modal bind:open={showOutcomeModal} title="Record Meeting Outcome">
	<form method="POST" action="?/recordOutcome" use:enhance={() => {
		return ({ update }) => {
			update();
			showOutcomeModal = false;
		};
	}}>
		<input type="hidden" name="motion_uuid" value={outcomeMotionUuid} />

		<div class="form-group">
			<label for="action_taken">Action Taken</label>
			<Select id="action_taken" name="action_taken" bind:value={outcomeAction} required>
				{#each actionOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</Select>
		</div>

		{#if outcomeAction === 'vote_held'}
			<div class="vote-counts">
				<div class="form-group">
					<label for="vote_aye">Aye Votes</label>
					<Input id="vote_aye" name="vote_aye" type="number" min="0" bind:value={outcomeAye} required />
				</div>

				<div class="form-group">
					<label for="vote_nay">Nay Votes</label>
					<Input id="vote_nay" name="vote_nay" type="number" min="0" bind:value={outcomeNay} required />
				</div>

				<div class="form-group">
					<label for="vote_abstain">Abstain</label>
					<Input id="vote_abstain" name="vote_abstain" type="number" min="0" bind:value={outcomeAbstain} required />
				</div>
			</div>
		{/if}

		<div class="form-group">
			<label for="outcome_notes">Notes (Optional)</label>
			<Textarea id="outcome_notes" name="notes" bind:value={outcomeNotes} placeholder="Additional notes about this outcome..." />
		</div>

		<div class="modal-actions">
			<Button type="button" variant="ghost" onclick={() => (showOutcomeModal = false)}>
				Cancel
			</Button>
			<Button type="submit" variant="primary">Record Outcome</Button>
		</div>
	</form>
</Modal>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--color-border);
	}

	.back-link {
		display: inline-block;
		color: var(--color-primary);
		text-decoration: none;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.header__title {
		font-size: 2rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
	}

	.header__meta {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.header__date,
	.header__location {
		color: var(--color-text-secondary);
	}

	.header__notes {
		color: var(--color-text-secondary);
		line-height: 1.6;
	}

	.header__actions {
		margin-top: 1rem;
	}

	.meeting-status {
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.section {
		margin-bottom: 3rem;
	}

	.section__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.section__heading {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: var(--color-bg-secondary);
		border-radius: 8px;
	}

	.empty-state__icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state__message {
		font-size: 1.125rem;
		color: var(--color-text-secondary);
		margin-bottom: 1.5rem;
	}

	.agenda-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.agenda-item {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		position: relative;
	}

	.agenda-item__number {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-primary-light);
		color: var(--color-primary);
		font-weight: 700;
		border-radius: 50%;
	}

	.agenda-item__content {
		flex: 1;
		min-width: 0;
	}

	.agenda-item__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.agenda-item__title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}

	.agenda-item__title:hover {
		text-decoration: underline;
	}

	.agenda-item__motion-number {
		color: var(--color-text-secondary);
		font-weight: 400;
		font-size: 0.875rem;
	}

	.agenda-item__notes {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0.5rem 0;
	}

	.agenda-item__actions {
		margin-top: 1rem;
	}

	.remove-button {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		font-size: 1.25rem;
		line-height: 1;
	}

	.remove-button:hover {
		color: var(--color-danger);
	}

	.outcome {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--color-bg-secondary);
		border-radius: 4px;
	}

	.outcome__header {
		margin-bottom: 0.5rem;
		text-transform: capitalize;
	}

	.outcome__votes {
		display: flex;
		gap: 1rem;
		margin: 0.5rem 0;
	}

	.vote {
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.vote--aye {
		background: #e8f5e9;
		color: #388e3c;
	}

	.vote--nay {
		background: #ffebee;
		color: #d32f2f;
	}

	.vote--abstain {
		background: #f5f5f5;
		color: #757575;
	}

	.outcome__notes {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0.5rem 0 0 0;
	}

	.motion-status {
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.vote-counts {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
	}

	/* Status colors */
	.status--introduced {
		background: #e3f2fd;
		color: #1976d2;
	}

	.status--deliberation {
		background: #fff3e0;
		color: #f57c00;
	}

	.status--enacted {
		background: #e8f5e9;
		color: #388e3c;
	}

	.status--rejected {
		background: #ffebee;
		color: #d32f2f;
	}

	.status--draft {
		background: #f5f5f5;
		color: #757575;
	}

	.status--withdrawn {
		background: #fafafa;
		color: #9e9e9e;
	}
</style>
