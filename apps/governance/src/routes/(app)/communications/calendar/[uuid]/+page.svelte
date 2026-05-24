<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button, Card, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { event, canWrite } = $derived(data);

	function formatDate(iso: string): string {
		const date = new Date(iso);
		return date.toLocaleString(undefined, {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	}

	function formatTime(iso: string): string {
		const date = new Date(iso);
		return date.toLocaleString(undefined, {
			hour: 'numeric',
			minute: '2-digit',
		});
	}

	function formatDateTime(iso: string): string {
		return `${formatDate(iso)} at ${formatTime(iso)}`;
	}
</script>

<div class="page">
	<PageHeader title="Event Details">
		{#snippet actions()}
			<Button size="sm" variant="ghost" href="/communications/calendar">← Back to Calendar</Button>
		{/snippet}
	</PageHeader>

	<Card>
		<div class="event-detail">
			<h1 class="event-title">{event.title}</h1>

			<div class="event-info">
				<div class="info-row">
					<div class="info-label">When</div>
					<div class="info-value">
						{formatDateTime(event.starts_at)}
						{#if event.ends_at}
							<div class="info-secondary">Until {formatTime(event.ends_at)}</div>
						{/if}
					</div>
				</div>

				{#if event.location}
					<div class="info-row">
						<div class="info-label">Where</div>
						<div class="info-value">{event.location}</div>
					</div>
				{/if}

				{#if event.description}
					<div class="info-row">
						<div class="info-label">Details</div>
						<div class="info-value description">{event.description}</div>
					</div>
				{/if}
			</div>

			{#if canWrite}
				<div class="event-actions">
					<form method="POST" action="?/cancel" use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								await goto('/communications/calendar');
							}
							update();
						};
					}}>
						<Button type="submit" variant="danger" size="sm">Cancel Event</Button>
					</form>
				</div>
			{/if}
		</div>
	</Card>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 640px;
		margin: 0 auto;
	}

	.event-detail {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.event-title {
		font-size: var(--text-2xl);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
		margin: 0;
		line-height: 1.3;
	}

	.event-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.info-row {
		display: grid;
		grid-template-columns: 100px 1fr;
		gap: var(--space-4);
	}

	.info-label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
	}

	.info-value {
		font-size: var(--text-base);
		color: var(--color-text);
		line-height: 1.6;
	}

	.info-secondary {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin-top: var(--space-1);
	}

	.description {
		white-space: pre-wrap;
	}

	.event-actions {
		display: flex;
		justify-content: flex-end;
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
	}
</style>
