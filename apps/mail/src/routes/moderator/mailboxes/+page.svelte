<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { mailboxes, q } = $derived(data);

	// Per-row inline action state
	let actionOpen  = $state<string | null>(null); // principal_uuid
	let actionType  = $state<'suspend' | 'reinstate' | null>(null);
	let reason      = $state('');

	function openAction(principal_uuid: string, type: 'suspend' | 'reinstate') {
		actionOpen = principal_uuid;
		actionType = type;
		reason = '';
	}
	function cancel() {
		actionOpen = null;
		actionType = null;
	}
</script>

<div class="page">
	<div class="page-header">
		<h1>Mailboxes</h1>
		<span class="count">{mailboxes.length} shown</span>
	</div>

	<form class="search-form" method="get">
		<input
			class="search-input"
			type="search"
			name="q"
			value={q}
			placeholder="Search by handle…"
			aria-label="Search mailboxes"
		/>
		<button class="btn btn-secondary" type="submit">Search</button>
		{#if q}
			<a href="/moderator/mailboxes" class="btn btn-secondary">Clear</a>
		{/if}
	</form>

	{#if form?.error}
		<div class="error-banner">{form.error}</div>
	{/if}

	{#if mailboxes.length === 0}
		<p class="empty">No mailboxes found.</p>
	{:else}
		<div class="mailbox-list">
			{#each mailboxes as mb}
				<div class="mailbox-row">
					<div class="mailbox-row__handle">@{mb.handle_cache}</div>
					<div class="mailbox-row__uuid">{mb.principal_uuid}</div>
					<div class="mailbox-row__status">
						<span class="badge {mb.status === 'active' ? 'badge-active' : 'badge-suspended'}">
							{mb.status}
						</span>
					</div>
					<div class="mailbox-row__actions">
						{#if mb.status === 'active'}
							<button
								class="btn btn-warning btn-sm"
								onclick={() => openAction(mb.principal_uuid, 'suspend')}
							>
								Suspend
							</button>
						{:else}
							<button
								class="btn btn-secondary btn-sm"
								onclick={() => openAction(mb.principal_uuid, 'reinstate')}
							>
								Reinstate
							</button>
						{/if}
					</div>
				</div>

				{#if actionOpen === mb.principal_uuid}
					<div class="inline-confirm">
						<form
							method="post"
							action="?/{actionType}"
							use:enhance={() => {
								return ({ update }) => {
									cancel();
									update();
								};
							}}
						>
							<input type="hidden" name="principal_uuid" value={mb.principal_uuid} />
							<div class="field">
								<label for="reason-{mb.principal_uuid}">
									Reason (required) for {actionType === 'suspend' ? 'suspending' : 'reinstating'} @{mb.handle_cache}
								</label>
								<textarea
									id="reason-{mb.principal_uuid}"
									name="reason"
									class="textarea"
									rows="2"
									required
									placeholder="State the reason…"
									bind:value={reason}
								></textarea>
							</div>
							<div class="inline-confirm__buttons">
								<button type="button" class="btn btn-secondary btn-sm" onclick={cancel}>Cancel</button>
								<button
									type="submit"
									class="btn btn-sm {actionType === 'suspend' ? 'btn-danger' : 'btn-success'}"
								>
									Confirm {actionType === 'suspend' ? 'Suspend' : 'Reinstate'}
								</button>
							</div>
						</form>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); }

	.page-header {
		display: flex;
		align-items: baseline;
		gap: var(--space-4);
	}
	.page-header h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }
	.count { font-size: var(--text-sm); color: var(--color-text-muted); }

	.search-form { display: flex; gap: var(--space-2); }

	.search-input {
		flex: 1;
		max-width: 320px;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.empty { color: var(--color-text-muted); font-size: var(--text-sm); }

	.error-banner {
		padding: var(--space-3) var(--space-4);
		background: #fff0f0;
		border: 1px solid #f5a5a5;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: #891818;
	}

	.mailbox-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.mailbox-row {
		display: grid;
		grid-template-columns: 1fr 2fr auto auto;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--color-border-faint);
		background: var(--color-surface);
		font-size: var(--text-sm);
	}

	.mailbox-row__handle { font-weight: var(--weight-medium); font-family: var(--font-mono); }
	.mailbox-row__uuid {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 9999px;
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		text-transform: capitalize;
	}
	.badge-active    { background: #d1fae5; color: #065f46; }
	.badge-suspended { background: #fee2e2; color: #7f1d1d; }

	.inline-confirm {
		padding: var(--space-3) var(--space-5) var(--space-4);
		background: #f9fafb;
		border-bottom: 1px solid var(--color-border-faint);
	}

	.inline-confirm__buttons { display: flex; gap: var(--space-2); margin-top: var(--space-2); }

	.field { display: flex; flex-direction: column; gap: var(--space-1); }
	label { font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--color-text-muted); }

	.textarea {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-family: inherit;
		resize: vertical;
		background: var(--color-surface);
		color: var(--color-text);
	}

	.btn {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		border: none;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
	}
	.btn-sm   { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); }
	.btn-secondary { background: var(--color-surface-alt, #f3f4f6); color: var(--color-text); border: 1px solid var(--color-border); }
	.btn-warning   { background: #ffc107; color: #333; }
	.btn-danger    { background: #dc2626; color: #fff; }
	.btn-success   { background: #16a34a; color: #fff; }
	.btn:hover { filter: brightness(0.92); }
</style>
