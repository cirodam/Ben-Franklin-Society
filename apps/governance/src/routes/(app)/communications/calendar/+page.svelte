<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Card, EmptyState, Input, PageHeader, Textarea } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { events, canWrite } = $derived(data);

	let showAddForm = $state(false);

	// Group events by month
	const eventsByMonth = $derived.by(() => {
		const groups: Map<string, typeof events> = new Map();
		
		for (const event of events) {
			const date = new Date(event.starts_at);
			const monthKey = date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
			
			if (!groups.has(monthKey)) {
				groups.set(monthKey, []);
			}
			groups.get(monthKey)!.push(event);
		}
		
		return Array.from(groups.entries());
	});

	function formatDay(iso: string): string {
		const date = new Date(iso);
		return date.toLocaleString(undefined, { day: 'numeric' });
	}

	function formatWeekday(iso: string): string {
		const date = new Date(iso);
		return date.toLocaleString(undefined, { weekday: 'short' });
	}

	function formatTime(iso: string): string {
		const date = new Date(iso);
		return date.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });
	}
</script>

<div class="page">
	<PageHeader title="Calendar">
		{#snippet actions()}
			{#if canWrite}
				<Button size="sm" onclick={() => showAddForm = !showAddForm}>
					{showAddForm ? 'Cancel' : '+ Add Event'}
				</Button>
			{/if}
		{/snippet}
	</PageHeader>

	{#if showAddForm}
		<Card>
			<div class="card__label">New Event</div>
			<form method="POST" action="?/create" use:enhance={() => {
				return ({ result, update }) => {
					if (result.type === 'success') showAddForm = false;
					update();
				};
			}}>
				<div class="form-grid">
					<div class="field--wide">
						<Input name="title" type="text" label="Title" required />
					</div>
					<Input name="starts_at" type="datetime-local" label="Starts" required />
					<Input name="ends_at" type="datetime-local" label="Ends (optional)" />
					<Input name="location" type="text" label="Location (optional)" />
					<div class="field--wide">
						<Textarea name="description" rows={3} label="Description (optional)" />
					</div>
				</div>
				<div class="form-actions">
					<Button type="submit" size="sm">Add Event</Button>
				</div>
			</form>
		</Card>
	{/if}

	{#if events.length === 0}
		<EmptyState
			title="No upcoming events"
		/>
	{:else}
		{#each eventsByMonth as [monthLabel, monthEvents]}
			<div class="month-group">
				<h2 class="month-label">{monthLabel}</h2>
				<div class="event-list">
					{#each monthEvents as event}
						<a href="/communications/calendar/{event.uuid}" class="event-row">
							<div class="event-date">
								<div class="event-date__day">{formatDay(event.starts_at)}</div>
								<div class="event-date__weekday">{formatWeekday(event.starts_at)}</div>
							</div>
							<div class="event-content">
								<div class="event-title">{event.title}</div>
								<div class="event-meta">
									<span>{formatTime(event.starts_at)}</span>
									{#if event.ends_at}
										<span class="sep">→</span>
										<span>{formatTime(event.ends_at)}</span>
									{/if}
									{#if event.location}
										<span class="sep">·</span>
										<span>{event.location}</span>
									{/if}
								</div>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 740px;
		margin: 0 auto;
	}

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.card__label {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		font-weight: var(--weight-medium);
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3);
	}
	.field--wide { grid-column: 1 / -1; }

	.form-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: var(--space-2);
	}

	.month-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.month-label {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
		margin: 0;
	}

	.event-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.event-row {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
		text-decoration: none;
		color: inherit;
		transition: background-color 0.15s;
	}
	.event-row:last-child { border-bottom: none; }
	.event-row:hover {
		background: var(--color-surface-hover, rgba(0, 0, 0, 0.02));
	}

	.event-date {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 56px;
	}

	.event-date__day {
		font-size: var(--text-2xl);
		font-weight: var(--weight-semibold);
		line-height: 1;
		color: var(--color-text);
	}

	.event-date__weekday {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-top: 2px;
	}

	.event-content {
		flex: 1;
		min-width: 0;
	}

	.event-title {
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
		color: var(--color-text);
		margin-bottom: var(--space-1);
	}

	.event-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.sep {
		opacity: 0.4;
	}
</style>

