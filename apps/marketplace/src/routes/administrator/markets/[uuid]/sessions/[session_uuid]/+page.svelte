<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Badge, Breadcrumb, Button, formatDateTime, Input } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { marketplace, session, stalls } = $derived(data);

	let confirmCancel = $state(false);
	let assigningStall = $state<string | null>(null);
</script>

<div class="page">
	<Breadcrumb items={[
		{ label: 'Markets', href: '/administrator/markets' },
		{ label: marketplace.name, href: `/administrator/markets/${marketplace.uuid}` },
		{ label: 'Session' }
	]} />

	<div class="session-header">
		<div>
			<h1>{formatDateTime(session.starts_at)}</h1>
			<div class="session-ends">Ends: {formatDateTime(session.ends_at)}</div>
			{#if session.notes}
				<div class="session-notes">{session.notes}</div>
			{/if}
		</div>
		<div class="header-right">
			<Badge variant={session.status === 'scheduled' ? 'success' : 'danger'}>
				{session.status}
			</Badge>
			{#if session.status === 'scheduled'}
				{#if !confirmCancel}
					<Button variant="ghost" class="btn-ghost-danger btn-sm" onclick={() => (confirmCancel = true)}>Cancel Session</Button>
				{:else}
					<span class="confirm-text">This cannot be undone.</span>
					<form method="POST" action="?/cancel" use:enhance style="display:contents">
						<Button type="submit" variant="danger" class="btn-sm">Confirm Cancel</Button>
					</form>
					<Button type="button" variant="ghost" class="btn-sm" onclick={() => (confirmCancel = false)}>Back</Button>
				{/if}
			{/if}
		</div>
	</div>

	{#if form?.action === 'assign' && form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	<section class="stalls-section">
		<h2>Stall Assignments</h2>

		{#if stalls.length === 0}
			<p class="empty">No active stalls in this marketplace.</p>
		{:else}
			<div class="stall-table">
				<div class="stall-header">
					<span>Stall</span>
					<span>Assigned To</span>
					<span>Notes</span>
					<span>Actions</span>
				</div>
				{#each stalls as stall}
					<div class="stall-row">
						<div class="stall-name">{stall.name}</div>
						<div class="stall-assignee">
							{#if stall.assignment}
								<span class="handle">@{stall.assignment.assignee_handle_cache}</span>
							{:else}
								<span class="unassigned">Unassigned</span>
							{/if}
						</div>
						<div class="stall-notes">
							{#if stall.assignment?.notes}
								<span class="notes-text">{stall.assignment.notes}</span>
							{/if}
						</div>
						<div class="stall-actions">
							{#if stall.assignment}
								<form method="POST" action="?/remove_assignment" use:enhance>
									<input type="hidden" name="assignment_uuid" value={stall.assignment.uuid} />
									<button type="submit" class="btn-link btn-link--danger">Remove</button>
								</form>
								<button class="btn-link" onclick={() => (assigningStall = assigningStall === stall.uuid ? null : stall.uuid)}>Reassign</button>
							{:else}
								<button class="btn-link" onclick={() => (assigningStall = assigningStall === stall.uuid ? null : stall.uuid)}>Assign</button>
							{/if}
						</div>
					</div>
					{#if assigningStall === stall.uuid}
						<div class="assign-form-row">
							<form
								method="POST"
								action="?/assign"
								use:enhance={() => { return ({ result }) => { if (result.type === 'success') assigningStall = null; }; }}
								class="assign-form"
							>
								<input type="hidden" name="stall_uuid" value={stall.uuid} />
							<Input name="handle" type="text" placeholder="@handle" required />
							<Input name="notes" type="text" placeholder="Notes (optional)" />
								<button type="submit" class="btn btn-primary btn-sm">Assign</button>
								<button type="button" class="btn btn-ghost btn-sm" onclick={() => (assigningStall = null)}>Cancel</button>
							</form>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 800px; }

	.session-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-5); }
	h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }
	h2 { margin: 0; font-size: var(--text-lg); font-weight: var(--weight-semibold); }
	.session-ends  { font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-1); }
	.session-notes { font-size: var(--text-sm); color: var(--color-text-muted); font-style: italic; margin-top: var(--space-1); }

	.header-right { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; justify-content: flex-end; }
	.confirm-text { font-size: var(--text-sm); color: var(--color-text-muted); }

	.stalls-section { display: flex; flex-direction: column; gap: var(--space-3); }
	.empty { color: var(--color-text-muted); font-size: var(--text-sm); }

	.stall-table { border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
	.stall-header {
		display: grid; grid-template-columns: 140px 160px 1fr 120px;
		padding: var(--space-2) var(--space-5);
		background: var(--color-surface-alt, #f8fafc);
		font-size: var(--text-xs); font-weight: var(--weight-semibold);
		color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em;
		border-bottom: 1px solid var(--color-border);
	}
	.stall-row {
		display: grid; grid-template-columns: 140px 160px 1fr 120px;
		align-items: center; gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--color-border-faint);
		font-size: var(--text-sm);
	}
	.stall-row:last-child { border-bottom: none; }

	.stall-name      { font-weight: var(--weight-medium); }
	.handle          { font-family: var(--font-mono); font-size: var(--text-xs); }
	.unassigned      { color: var(--color-text-muted); font-style: italic; font-size: var(--text-xs); }
	.notes-text      { font-size: var(--text-xs); color: var(--color-text-muted); }
	.stall-actions   { display: flex; gap: var(--space-3); align-items: center; }

	.assign-form-row {
		padding: var(--space-3) var(--space-5);
		background: var(--color-surface-alt, #f8fafc);
		border-bottom: 1px solid var(--color-border-faint);
	}
	.assign-form { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
	.assign-input {
		padding: var(--space-1) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-family: inherit;
		width: 140px;
	}
	.assign-input--wide { width: 220px; }

	:global(.btn-sm) { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); }
	:global(.btn-ghost-danger) { border-color: #fca5a5; color: #dc2626; }
</style>
