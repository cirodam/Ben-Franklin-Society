<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Badge, Breadcrumb, Button, Card, EmptyState, Input, Textarea, formatDateTime } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { marketplace, sessions, stalls } = $derived(data);

	let confirmClose  = $state(false);
	let showSession   = $state(false);
	let showStall     = $state(false);
</script>

<div class="page">
	<Breadcrumb items={[{ label: '← Markets', href: '/administrator/markets' }]} />

	<div class="page-header">
		<div>
			<h1>{marketplace.name}</h1>
			<div class="market-location">{marketplace.location}</div>
		</div>
		<Badge variant={marketplace.status === 'active' ? 'success' : 'danger'}>
			{marketplace.status}
		</Badge>
	</div>

	<!-- Edit details -->
	<Card>
		<h2>Details</h2>
		{#if form?.action === 'update' && form?.error}
			<Alert variant="danger">{form.error}</Alert>
		{/if}
		{#if form?.action === 'update' && form?.success}
			<Alert variant="success">Saved.</Alert>
		{/if}
		<form method="POST" action="?/update" use:enhance class="edit-form">
			<div class="field-row">
				<div class="field">
					<label for="name">Name</label>
					<Input id="name" name="name" type="text" required value={marketplace.name} />
				</div>
				<div class="field">
					<label for="location">Location</label>
					<Input id="location" name="location" type="text" required value={marketplace.location} />
				</div>
			</div>
			<div class="field">
				<label for="default_schedule">Usual Schedule</label>
				<Input id="default_schedule" name="default_schedule" type="text" value={marketplace.default_schedule ?? ''} />
			</div>
			<div class="field">
				<label for="description">Description</label>
				<Textarea id="description" name="description" rows={3}>{marketplace.description ?? ''}</Textarea>
			</div>
			<div class="form-actions">
				<Button type="submit" variant="primary" class="btn-sm">Save</Button>
				{#if marketplace.status === 'active'}
					{#if !confirmClose}
						<Button type="button" variant="ghost" class="btn-sm btn-ghost-danger" onclick={() => (confirmClose = true)}>Close Marketplace</Button>
					{:else}
						<span class="confirm-text">This cannot be undone.</span>
						<form method="POST" action="?/close" use:enhance style="display:contents">
							<Button type="submit" variant="danger" class="btn-sm">Confirm Close</Button>
						</form>
						<Button type="button" variant="ghost" class="btn-sm" onclick={() => (confirmClose = false)}>Cancel</Button>
					{/if}
				{/if}
			</div>
		</form>
	</Card>

	<!-- Sessions -->
	<Card>
		<div class="card-header">
			<h2>Sessions</h2>
			<Button variant="ghost" class="btn-sm" onclick={() => (showSession = !showSession)}>
				{showSession ? 'Cancel' : '+ New Session'}
			</Button>
		</div>

		{#if form?.action === 'session' && form?.error}
			<Alert variant="danger">{form.error}</Alert>
		{/if}

		{#if showSession}
			<form method="POST" action="?/create_session" use:enhance class="create-form">
				<div class="field-row">
					<div class="field">
						<label for="starts_at">Start</label>
						<Input id="starts_at" name="starts_at" type="datetime-local" required />
					</div>
					<div class="field">
						<label for="ends_at">End</label>
						<Input id="ends_at" name="ends_at" type="datetime-local" required />
					</div>
				</div>
				<div class="field">
					<label for="notes">Notes (optional)</label>
					<Input id="notes" name="notes" type="text" />
				</div>
				<div class="form-actions">
					<Button type="submit" variant="primary" class="btn-sm">Create Session</Button>
				</div>
			</form>
		{/if}

		{#if sessions.length === 0}
			<EmptyState title="No sessions yet." />
		{:else}
			<div class="session-list">
				{#each sessions as session}
					<a href="/administrator/markets/{marketplace.uuid}/sessions/{session.uuid}" class="session-row">
						<div class="session-date">{formatDateTime(session.starts_at)}</div>
						<div class="session-status">
							<Badge variant={session.status === 'scheduled' ? 'success' : 'danger'}>
								{session.status}
							</Badge>
						</div>
						<div class="session-arrow">→</div>
					</a>
				{/each}
			</div>
		{/if}
	</Card>

	<!-- Stalls -->
	<Card>
		<div class="card-header">
			<h2>Stalls</h2>
			<Button variant="ghost" class="btn-sm" onclick={() => (showStall = !showStall)}>
				{showStall ? 'Cancel' : '+ New Stall'}
			</Button>
		</div>

		{#if form?.action === 'stall' && form?.error}
			<Alert variant="danger">{form.error}</Alert>
		{/if}
		{#if form?.action === 'stall' && form?.success}
			<Alert variant="success">Stall saved.</Alert>
		{/if}

		{#if showStall}
			<form method="POST" action="?/create_stall" use:enhance class="create-form" onsubmit={() => (showStall = false)}>
				<div class="field-row">
					<div class="field">
						<label for="stall_name">Name</label>
						<Input id="stall_name" name="stall_name" type="text" required />
					</div>
					<div class="field">
						<label for="stall_description">Description (optional)</label>
						<Input id="stall_description" name="stall_description" type="text" />
					</div>
				</div>
				<div class="form-actions">
					<Button type="submit" variant="primary" class="btn-sm">Add Stall</Button>
				</div>
			</form>
		{/if}

		{#if stalls.length === 0}
			<EmptyState title="No stalls yet." />
		{:else}
			<div class="stall-list">
				{#each stalls as stall}
					<div class="stall-row">
						<div class="stall-name">{stall.name}</div>
						<div class="stall-desc">{stall.description ?? ''}</div>
						<div class="stall-status">
							<Badge variant={stall.status === 'active' ? 'success' : 'danger'}>
								{stall.status}
							</Badge>
						</div>
						{#if stall.status === 'active'}
							<form method="POST" action="?/retire_stall" use:enhance>
								<input type="hidden" name="stall_uuid" value={stall.uuid} />
								<button type="submit" class="btn-link btn-link--danger">Retire</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</Card>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 800px; }

	.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); }
	h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }
	h2 { margin: 0; font-size: var(--text-base); font-weight: var(--weight-semibold); }
	.market-location { font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-1); }

	.card-header { display: flex; align-items: center; justify-content: space-between; }

	.edit-form, .create-form { display: flex; flex-direction: column; gap: var(--space-3); }
	.field { display: flex; flex-direction: column; gap: var(--space-1); flex: 1; }
	.field label { font-size: var(--text-sm); font-weight: var(--weight-medium); }
	:global(.field input), :global(.field textarea) { width: 100%; }

	.form-actions { display: flex; align-items: center; gap: var(--space-3); }
	.confirm-text { font-size: var(--text-sm); color: var(--color-text-muted); }

	.session-list { display: flex; flex-direction: column; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
	.session-row {
		display: grid; grid-template-columns: 1fr 100px 20px;
		align-items: center; gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--color-border-faint);
		text-decoration: none; color: var(--color-text); font-size: var(--text-sm);
	}
	.session-row:last-child { border-bottom: none; }
	.session-row:hover { background: var(--color-surface-alt, #f8fafc); }
	.session-date { font-size: var(--text-sm); }
	.session-arrow { color: var(--color-text-muted); }

	.stall-list { display: flex; flex-direction: column; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
	.stall-row {
		display: grid; grid-template-columns: 140px 1fr 80px auto;
		align-items: center; gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--color-border-faint);
		font-size: var(--text-sm);
	}
	.stall-row:last-child { border-bottom: none; }
	.stall-name { font-weight: var(--weight-medium); }
	.stall-desc { color: var(--color-text-muted); font-size: var(--text-xs); }

	:global(.btn-sm) { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); }
	:global(.btn-ghost-danger) { border-color: #fca5a5; color: #dc2626; }
</style>
