<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '@bfs/ui/src/Badge.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { people, canAdd, canEdit, canRemove, enactedMotions } = $derived(data);

	type Person = typeof people[number];

	let showAddForm  = $state(false);
	let editingUuid  = $state<string | null>(null);
	let editGiven    = $state('');
	let editFamily   = $state('');
	let editDob      = $state('');
	let editPhone    = $state('');

	type PendingAction = { uuid: string; action: 'suspend' | 'reinstate' | 'revoke' };
	let pendingAction = $state<PendingAction | null>(null);
	let pendingMotion = $state('');

	function setPending(uuid: string, action: PendingAction['action']) {
		pendingAction = { uuid, action };
		pendingMotion = '';
	}

	function startEdit(p: Person) {
		editingUuid = p.uuid;
		editGiven   = p.given_name;
		editFamily  = p.family_name;
		editDob     = p.date_of_birth;
		editPhone   = p.phone ?? '';
	}

	const statusVariant = (s: string): 'success' | 'warn' | 'danger' =>
		s === 'active' ? 'success' : s === 'suspended' ? 'warn' : 'danger';
</script>

<div class="page">
	<div class="page-header">
		<h1>People</h1>
		{#if canAdd}
			<button class="btn btn--sm btn--primary" onclick={() => showAddForm = !showAddForm}>
				{showAddForm ? 'Cancel' : '+ Add Person'}
			</button>
		{/if}
	</div>

	{#if showAddForm}
		<div class="card">
			<div class="card__label">Add Person</div>
			<form method="POST" action="?/add" use:enhance={() => {
				return ({ result, update }) => {
					if (result.type === 'success') showAddForm = false;
					update();
				};
			}}>
				<div class="form-grid">				<label class="field field--wide">
					<span>Pursuant to motion</span>
					<select class="input" name="motion_uuid" required>
						<option value="">— Select enacted motion —</option>
						{#each enactedMotions as m}
							<option value={m.uuid}>[{m.body_name}] {m.title}</option>
						{/each}
					</select>
				</label>					<label class="field">
						<span>Handle</span>
						<input class="input" name="handle" type="text" placeholder="e.g. jane_smith" required />
					</label>
					<label class="field">
						<span>Given name</span>
						<input class="input" name="given_name" type="text" required />
					</label>
					<label class="field">
						<span>Family name</span>
						<input class="input" name="family_name" type="text" required />
					</label>
					<label class="field">
						<span>Date of birth</span>
						<input class="input" name="date_of_birth" type="date" required />
					</label>
					<label class="field">
						<span>Phone (optional)</span>
						<input class="input" name="phone" type="tel" />
					</label>
					<label class="field">
						<span>Initial password</span>
						<input class="input" name="password" type="password" minlength="12" required />
					</label>
				</div>
				<div class="form-actions">
					<button type="submit" class="btn btn--primary btn--sm">Add Person</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="people-table">
		<table>
			<thead>
				<tr>
					<th>Handle</th>
					<th>Name</th>
					<th>DOB</th>
					<th>Phone</th>
					<th>Status</th>
					<th>Joined</th>
					{#if canEdit || canRemove}<th></th>{/if}
				</tr>
			</thead>
			<tbody>
				{#each people as p (p.uuid)}
					<tr class:editing={editingUuid === p.uuid}>
						<td><code>@{p.handle}</code></td>
						{#if editingUuid === p.uuid}
							<td colspan="3">
								<form method="POST" action="?/edit" use:enhance={() => {
									return ({ result, update }) => {
										if (result.type === 'success') editingUuid = null;
										update();
									};
								}} class="inline-edit">
									<input type="hidden" name="person_uuid" value={p.uuid} />
									<input class="input input--sm" name="given_name"    bind:value={editGiven}  placeholder="Given name"  required />
									<input class="input input--sm" name="family_name"   bind:value={editFamily} placeholder="Family name" required />
									<input class="input input--sm" name="date_of_birth" type="date" bind:value={editDob} required />
									<input class="input input--sm" name="phone"          bind:value={editPhone}  placeholder="Phone" type="tel" />
									<button type="submit" class="btn btn--sm btn--primary">Save</button>
									<button type="button" class="btn btn--sm" onclick={() => editingUuid = null}>Cancel</button>
								</form>
							</td>
							<td><Badge label={p.status} variant={statusVariant(p.status)} /></td>
							<td>{p.joined_at.slice(0, 10)}</td>
						{:else}
							<td>{p.given_name} {p.family_name}</td>
							<td>{p.date_of_birth}</td>
							<td>{p.phone ?? '—'}</td>
							<td><Badge label={p.status} variant={statusVariant(p.status)} /></td>
							<td>{p.joined_at.slice(0, 10)}</td>
						{/if}
						{#if canEdit || canRemove}
							<td class="actions-cell">
								{#if pendingAction?.uuid === p.uuid}
									<form method="POST" action="?/{pendingAction.action}" use:enhance={() => {
										return ({ result, update }) => {
											if (result.type === 'success') pendingAction = null;
											update();
										};
									}} class="pending-form">
										<input type="hidden" name="person_uuid" value={p.uuid} />
										<select class="input input--sm" name="motion_uuid" bind:value={pendingMotion} required>
											<option value="">— Select enacted motion —</option>
											{#each enactedMotions as m}
												<option value={m.uuid}>[{m.body_name}] {m.title}</option>
											{/each}
										</select>
										<button type="submit" class="btn btn--sm btn--primary" disabled={!pendingMotion}>Confirm</button>
										<button type="button" class="btn btn--sm" onclick={() => pendingAction = null}>Cancel</button>
									</form>
								{:else}
									{#if canEdit && editingUuid !== p.uuid}
										<button class="btn-inline" onclick={() => startEdit(p)}>Edit</button>
									{/if}
									{#if canRemove}
										{#if p.status === 'active'}
											<button class="btn-inline btn-inline--warn" onclick={() => setPending(p.uuid, 'suspend')}>Suspend</button>
										{:else if p.status === 'suspended'}
											<button class="btn-inline btn-inline--ok" onclick={() => setPending(p.uuid, 'reinstate')}>Reinstate</button>
										{/if}
										{#if p.status !== 'revoked'}
											<button class="btn-inline btn-inline--danger" onclick={() => setPending(p.uuid, 'revoke')}>Revoke</button>
										{/if}
									{/if}
								{/if}
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
	}
	.page-header h1 { margin: 0; }

	/* Add form card */
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
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: var(--space-3);
	}
	.field { display: flex; flex-direction: column; gap: var(--space-1); }
	.field span { font-size: var(--text-xs); color: var(--color-text-muted); }
	.input {
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
	.input--sm { padding: var(--space-1) var(--space-2); }
	.form-actions { display: flex; gap: var(--space-2); }

	/* Table */
	.people-table {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}
	thead th {
		text-align: left;
		padding: var(--space-2) var(--space-4);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		background: var(--color-bg);
		border-bottom: 1px solid var(--color-border);
		font-weight: var(--weight-medium);
	}
	tbody tr {
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}
	tbody tr:last-child { border-bottom: none; }
	tbody tr.editing { background: var(--color-bg); }
	tbody td {
		padding: var(--space-3) var(--space-4);
		vertical-align: middle;
	}
	code {
		font-family: var(--font-mono);
		color: var(--color-text-muted);
	}

	/* Inline edit row */
	.inline-edit {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}
	.inline-edit .input { width: auto; flex: 1; min-width: 100px; }

	/* Action cell */
	.actions-cell {
		white-space: nowrap;
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	.pending-form {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}
	.pending-form .input { width: auto; min-width: 200px; flex: 1; }
	.btn-inline {
		background: none;
		border: none;
		padding: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		cursor: pointer;
		text-decoration: underline;
	}
	.btn-inline:hover           { color: var(--color-text); }
	.btn-inline--warn:hover     { color: #92400e; }
	.btn-inline--ok:hover       { color: #166534; }
	.btn-inline--danger:hover   { color: #991b1b; }
</style>

