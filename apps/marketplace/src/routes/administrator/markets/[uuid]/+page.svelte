<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { marketplace, sessions, stalls } = $derived(data);

	let confirmClose  = $state(false);
	let showSession   = $state(false);
	let showStall     = $state(false);

	function fmtDatetimeLocal(iso: string): string {
		// Trim to datetime-local format (YYYY-MM-DDTHH:MM)
		return iso.slice(0, 16);
	}
	function fmtDatetime(iso: string): string {
		return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
	}
</script>

<div class="page">
	<div class="breadcrumb"><a href="/administrator/markets">← Markets</a></div>

	<div class="page-header">
		<div>
			<h1>{marketplace.name}</h1>
			<div class="market-location">{marketplace.location}</div>
		</div>
		<span class="badge {marketplace.status === 'active' ? 'badge-active' : 'badge-closed'}">{marketplace.status}</span>
	</div>

	<!-- Edit details -->
	<section class="card">
		<h2>Details</h2>
		{#if form?.action === 'update' && form?.error}
			<div class="form-error">{form.error}</div>
		{/if}
		{#if form?.action === 'update' && form?.success}
			<div class="form-success">Saved.</div>
		{/if}
		<form method="POST" action="?/update" use:enhance class="edit-form">
			<div class="field-row">
				<div class="field">
					<label for="name">Name</label>
					<input id="name" name="name" type="text" required value={marketplace.name} />
				</div>
				<div class="field">
					<label for="location">Location</label>
					<input id="location" name="location" type="text" required value={marketplace.location} />
				</div>
			</div>
			<div class="field">
				<label for="default_schedule">Usual Schedule</label>
				<input id="default_schedule" name="default_schedule" type="text" value={marketplace.default_schedule ?? ''} />
			</div>
			<div class="field">
				<label for="description">Description</label>
				<textarea id="description" name="description" rows="3">{marketplace.description ?? ''}</textarea>
			</div>
			<div class="form-actions">
				<button type="submit" class="btn btn-primary btn-sm">Save</button>
				{#if marketplace.status === 'active'}
					{#if !confirmClose}
						<button type="button" class="btn btn-ghost btn-sm btn-ghost-danger" onclick={() => (confirmClose = true)}>Close Marketplace</button>
					{:else}
						<span class="confirm-text">This cannot be undone.</span>
						<form method="POST" action="?/close" use:enhance style="display:contents">
							<button type="submit" class="btn btn-sm btn-danger">Confirm Close</button>
						</form>
						<button type="button" class="btn btn-ghost btn-sm" onclick={() => (confirmClose = false)}>Cancel</button>
					{/if}
				{/if}
			</div>
		</form>
	</section>

	<!-- Sessions -->
	<section class="card">
		<div class="card-header">
			<h2>Sessions</h2>
			<button class="btn btn-ghost btn-sm" onclick={() => (showSession = !showSession)}>
				{showSession ? 'Cancel' : '+ New Session'}
			</button>
		</div>

		{#if form?.action === 'session' && form?.error}
			<div class="form-error">{form.error}</div>
		{/if}

		{#if showSession}
			<form method="POST" action="?/create_session" use:enhance class="create-form">
				<div class="field-row">
					<div class="field">
						<label for="starts_at">Start</label>
						<input id="starts_at" name="starts_at" type="datetime-local" required />
					</div>
					<div class="field">
						<label for="ends_at">End</label>
						<input id="ends_at" name="ends_at" type="datetime-local" required />
					</div>
				</div>
				<div class="field">
					<label for="notes">Notes (optional)</label>
					<input id="notes" name="notes" type="text" />
				</div>
				<div class="form-actions">
					<button type="submit" class="btn btn-primary btn-sm">Create Session</button>
				</div>
			</form>
		{/if}

		{#if sessions.length === 0}
			<p class="empty">No sessions yet.</p>
		{:else}
			<div class="session-list">
				{#each sessions as session}
					<a href="/administrator/markets/{marketplace.uuid}/sessions/{session.uuid}" class="session-row">
						<div class="session-date">{fmtDatetime(session.starts_at)}</div>
						<div class="session-status">
							<span class="badge {session.status === 'scheduled' ? 'badge-active' : 'badge-closed'}">{session.status}</span>
						</div>
						<div class="session-arrow">→</div>
					</a>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Stalls -->
	<section class="card">
		<div class="card-header">
			<h2>Stalls</h2>
			<button class="btn btn-ghost btn-sm" onclick={() => (showStall = !showStall)}>
				{showStall ? 'Cancel' : '+ New Stall'}
			</button>
		</div>

		{#if form?.action === 'stall' && form?.error}
			<div class="form-error">{form.error}</div>
		{/if}
		{#if form?.action === 'stall' && form?.success}
			<div class="form-success">Stall saved.</div>
		{/if}

		{#if showStall}
			<form method="POST" action="?/create_stall" use:enhance class="create-form" onsubmit={() => (showStall = false)}>
				<div class="field-row">
					<div class="field">
						<label for="stall_name">Name</label>
						<input id="stall_name" name="stall_name" type="text" required />
					</div>
					<div class="field">
						<label for="stall_description">Description (optional)</label>
						<input id="stall_description" name="stall_description" type="text" />
					</div>
				</div>
				<div class="form-actions">
					<button type="submit" class="btn btn-primary btn-sm">Add Stall</button>
				</div>
			</form>
		{/if}

		{#if stalls.length === 0}
			<p class="empty">No stalls yet.</p>
		{:else}
			<div class="stall-list">
				{#each stalls as stall}
					<div class="stall-row">
						<div class="stall-name">{stall.name}</div>
						<div class="stall-desc">{stall.description ?? ''}</div>
						<div class="stall-status">
							<span class="badge {stall.status === 'active' ? 'badge-active' : 'badge-closed'}">{stall.status}</span>
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
	</section>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 800px; }
	.breadcrumb a { color: var(--color-text-muted); font-size: var(--text-sm); text-decoration: none; }
	.breadcrumb a:hover { text-decoration: underline; }

	.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); }
	h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }
	h2 { margin: 0; font-size: var(--text-base); font-weight: var(--weight-semibold); }
	.market-location { font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-1); }

	.card { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-5); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
	.card-header { display: flex; align-items: center; justify-content: space-between; }

	.form-error   { padding: var(--space-3) var(--space-4); background: #fee2e2; border: 1px solid #fca5a5; border-radius: var(--radius-md); font-size: var(--text-sm); color: #7f1d1d; }
	.form-success { padding: var(--space-3) var(--space-4); background: #d1fae5; border: 1px solid #6ee7b7; border-radius: var(--radius-md); font-size: var(--text-sm); color: #065f46; }

	.edit-form, .create-form { display: flex; flex-direction: column; gap: var(--space-3); }
	.field { display: flex; flex-direction: column; gap: var(--space-1); flex: 1; }
	.field label { font-size: var(--text-sm); font-weight: var(--weight-medium); }
	.field input, .field textarea {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-family: inherit;
	}
	.field textarea { resize: vertical; }
	.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }

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

	.badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: capitalize; }
	.badge-active { background: #d1fae5; color: #065f46; }
	.badge-closed { background: #fee2e2; color: #7f1d1d; }

	.empty { color: var(--color-text-muted); font-size: var(--text-sm); margin: 0; }

	.btn { padding: var(--space-2) var(--space-5); border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer; border: none; text-decoration: none; display: inline-flex; align-items: center; }
	.btn-primary { background: var(--color-accent); color: #fff; }
	.btn-danger  { background: #dc2626; color: #fff; }
	.btn-ghost   { background: transparent; border: 1px solid var(--color-border); color: var(--color-text); }
	.btn-ghost-danger { border-color: #fca5a5; color: #dc2626; }
	.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); }
	.btn:hover { filter: brightness(0.92); }
	.btn-link { background: none; border: none; padding: 0; font-size: var(--text-xs); cursor: pointer; text-decoration: underline; color: var(--color-accent); }
	.btn-link--danger { color: #dc2626; }
</style>
