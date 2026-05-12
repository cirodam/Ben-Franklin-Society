<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { events, canWrite } = $derived(data);

	let showAddForm = $state(false);

	function fmt(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleString(undefined, {
			month: 'short', day: 'numeric', year: 'numeric',
			hour: '2-digit', minute: '2-digit',
		});
	}
</script>

<div class="page">
	<div class="page-header">
		<h1>Calendar</h1>
		{#if canWrite}
			<button class="btn btn--sm btn--primary" onclick={() => showAddForm = !showAddForm}>
				{showAddForm ? 'Cancel' : '+ Add Event'}
			</button>
		{/if}
	</div>

	{#if showAddForm}
		<div class="card">
			<div class="card__label">New Event</div>
			<form method="POST" action="?/create" use:enhance={() => {
				return ({ result, update }) => {
					if (result.type === 'success') showAddForm = false;
					update();
				};
			}}>
				<div class="form-grid">
					<label class="field field--wide">
						<span>Title</span>
						<input class="input" name="title" type="text" required />
					</label>
					<label class="field">
						<span>Starts</span>
						<input class="input" name="starts_at" type="datetime-local" required />
					</label>
					<label class="field">
						<span>Ends <span class="opt">(optional)</span></span>
						<input class="input" name="ends_at" type="datetime-local" />
					</label>
					<label class="field">
						<span>Location <span class="opt">(optional)</span></span>
						<input class="input" name="location" type="text" />
					</label>
					<label class="field field--wide">
						<span>Description <span class="opt">(optional)</span></span>
						<textarea class="textarea" name="description" rows="3"></textarea>
					</label>
				</div>
				<div class="form-actions">
					<button type="submit" class="btn btn--primary btn--sm">Add Event</button>
				</div>
			</form>
		</div>
	{/if}

	{#if events.length === 0}
		<div class="empty-card">
			<p>No upcoming events.</p>
		</div>
	{:else}
		<div class="event-list">
			{#each events as e}
				<div class="event">
					<div class="event__main">
						<div class="event__title">{e.title}</div>
						<div class="event__meta">
							<span>{fmt(e.starts_at)}</span>
							{#if e.ends_at}<span class="sep">→</span><span>{fmt(e.ends_at)}</span>{/if}
							{#if e.location}<span class="sep">·</span><span>{e.location}</span>{/if}
						</div>
						{#if e.description}<p class="event__desc">{e.description}</p>{/if}
					</div>
					{#if canWrite}
						<form method="POST" action="?/cancel" use:enhance>
							<input type="hidden" name="event_uuid" value={e.uuid} />
							<button class="btn-inline btn-inline--danger" type="submit">Cancel</button>
						</form>
					{/if}
				</div>
			{/each}
		</div>
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

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.page-header h1 { margin: 0; }

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
	.field { display: flex; flex-direction: column; gap: var(--space-1); }
	.field--wide { grid-column: 1 / -1; }
	.field span { font-size: var(--text-xs); color: var(--color-text-muted); }
	.opt { opacity: 0.6; }

	.input, .textarea {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-family: inherit;
		background: var(--color-bg);
		color: var(--color-text);
		width: 100%;
		box-sizing: border-box;
	}
	.textarea { resize: vertical; }
	.form-actions { display: flex; gap: var(--space-2); }

	.empty-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.empty-card p { margin: 0; }

	.event-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	.event {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}
	.event:last-child { border-bottom: none; }

	.event__title {
		font-weight: var(--weight-medium);
		margin-bottom: var(--space-1);
	}
	.event__meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
	.sep { opacity: 0.4; }
	.event__desc {
		margin: var(--space-2) 0 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: 1.6;
	}

	.btn-inline {
		background: none;
		border: none;
		padding: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		cursor: pointer;
		text-decoration: underline;
		white-space: nowrap;
		margin-top: var(--space-1);
	}
	.btn-inline--danger:hover { color: #991b1b; }
</style>

