<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';
	import { Button, Modal, Input, Textarea } from '@bfs/ui';

	let { data }: { data: PageData } = $props();

	const { association, upcomingMeetings, pastMeetings, canManage } = $derived(data);

	let showCreateModal = $state(false);
	let createTitle = $state('');
	let createScheduledAt = $state('');
	let createLocation = $state('');
	let createNotes = $state('');

	function openCreateModal() {
		createTitle = '';
		createScheduledAt = '';
		createLocation = '';
		createNotes = '';
		showCreateModal = true;
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

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
		});
	}

	function formatTime(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleTimeString('en-US', {
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
</script>

<div class="page">
	<header class="header">
		<div class="header__content">
			<h1 class="header__title">Assembly Meetings</h1>
			<p class="header__subtitle">
				Schedule and manage town hall meetings for {association.name}
			</p>
		</div>
		{#if canManage}
			<div class="header__actions">
				<Button variant="primary" onclick={openCreateModal}>
					📅 Schedule Meeting
				</Button>
			</div>
		{/if}
	</header>

	<div class="content">
		<!-- Upcoming Meetings -->
		<section class="section">
			<h2 class="section__heading">Upcoming Meetings</h2>
			{#if upcomingMeetings.length === 0}
				<div class="empty-state">
					<div class="empty-state__icon">📅</div>
					<p class="empty-state__message">No upcoming meetings scheduled</p>
					{#if canManage}
						<Button variant="primary" onclick={openCreateModal}>
							Schedule a Meeting
						</Button>
					{/if}
				</div>
			{:else}
				<div class="meeting-list">
					{#each upcomingMeetings as meeting}
						<a href="/governance/general-assembly/meetings/{meeting.uuid}" class="meeting-card">
							<div class="meeting-card__date">
								<div class="meeting-card__date-day">{formatDate(meeting.scheduled_at).split(',')[1].trim().split(' ')[1]}</div>
								<div class="meeting-card__date-month">{formatDate(meeting.scheduled_at).split(' ')[0]}</div>
							</div>
							<div class="meeting-card__content">
								<div class="meeting-card__header">
									<h3 class="meeting-card__title">{meeting.title}</h3>
									<span class="meeting-status {statusVariant[meeting.status] ?? ''}">
										{statusLabel[meeting.status] ?? meeting.status}
									</span>
								</div>
								<div class="meeting-card__meta">
									<span class="meeting-card__time">🕐 {formatTime(meeting.scheduled_at)}</span>
									{#if meeting.location}
										<span class="meeting-card__location">📍 {meeting.location}</span>
									{/if}
								</div>
								{#if meeting.notes}
									<p class="meeting-card__notes">{meeting.notes}</p>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Past Meetings -->
		{#if pastMeetings.length > 0}
			<section class="section">
				<h2 class="section__heading">Recent Past Meetings</h2>
				<div class="meeting-list meeting-list--compact">
					{#each pastMeetings as meeting}
						<a href="/governance/general-assembly/meetings/{meeting.uuid}" class="meeting-card meeting-card--compact">
							<div class="meeting-card__date">
								<div class="meeting-card__date-day">{formatDate(meeting.scheduled_at).split(',')[1].trim().split(' ')[1]}</div>
								<div class="meeting-card__date-month">{formatDate(meeting.scheduled_at).split(' ')[0]}</div>
							</div>
							<div class="meeting-card__content">
								<div class="meeting-card__header">
									<h3 class="meeting-card__title">{meeting.title}</h3>
									<span class="meeting-status {statusVariant[meeting.status] ?? ''}">
										{statusLabel[meeting.status] ?? meeting.status}
									</span>
								</div>
								<div class="meeting-card__meta">
									<span class="meeting-card__time">{formatDateTime(meeting.scheduled_at)}</span>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	</div>
</div>

<!-- Create Meeting Modal -->
<Modal bind:open={showCreateModal} title="Schedule New Meeting">
	<form method="POST" action="?/create" use:enhance>
		<div class="form-group">
			<label for="title">Meeting Title</label>
			<Input id="title" name="title" bind:value={createTitle} required placeholder="Weekly Town Hall" />
		</div>

		<div class="form-group">
			<label for="scheduled_at">Date & Time</label>
			<Input 
				id="scheduled_at" 
				name="scheduled_at" 
				type="datetime-local" 
				bind:value={createScheduledAt} 
				required 
			/>
		</div>

		<div class="form-group">
			<label for="location">Location</label>
			<Input 
				id="location" 
				name="location" 
				bind:value={createLocation} 
				placeholder="Community Hall or Virtual Meeting Link" 
			/>
		</div>

		<div class="form-group">
			<label for="notes">Notes (Optional)</label>
			<Textarea 
				id="notes" 
				name="notes" 
				bind:value={createNotes} 
				placeholder="Additional information about this meeting..." 
			/>
		</div>

		<div class="modal-actions">
			<Button type="button" variant="ghost" onclick={() => (showCreateModal = false)}>
				Cancel
			</Button>
			<Button type="submit" variant="primary">Schedule Meeting</Button>
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
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 2rem;
	}

	.header__content {
		flex: 1;
	}

	.header__title {
		font-size: 2rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.header__subtitle {
		color: var(--color-text-secondary);
		margin: 0;
	}

	.section {
		margin-bottom: 3rem;
	}

	.section__heading {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1.5rem 0;
	}

	.meeting-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.meeting-card {
		display: flex;
		gap: 1.5rem;
		padding: 1.5rem;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.meeting-card:hover {
		border-color: var(--color-primary);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.meeting-card__date {
		flex-shrink: 0;
		width: 60px;
		text-align: center;
		padding: 0.5rem;
		background: var(--color-primary-light);
		border-radius: 8px;
	}

	.meeting-card__date-day {
		font-size: 1.75rem;
		font-weight: 700;
		line-height: 1;
		color: var(--color-primary);
	}

	.meeting-card__date-month {
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--color-text-secondary);
		margin-top: 0.25rem;
	}

	.meeting-card__content {
		flex: 1;
		min-width: 0;
	}

	.meeting-card__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.meeting-card__title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.meeting-status {
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.meeting-card__meta {
		display: flex;
		gap: 1.5rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin-bottom: 0.5rem;
	}

	.meeting-card__notes {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
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

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.5rem;
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
</style>
