<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Badge, Button, EmptyState, Input, PageHeader, Textarea } from '@bfs/ui';
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
	<PageHeader title="Mailboxes" description="{mailboxes.length} shown" />

	<form class="search-form" method="get">
		<Input
			type="search"
			name="q"
			value={q}
			placeholder="Search by handle…"
		/>
		<Button variant="secondary" type="submit">Search</Button>
		{#if q}
			<Button variant="secondary" href="/moderator/mailboxes">Clear</Button>
		{/if}
	</form>

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	{#if mailboxes.length === 0}
		<EmptyState title="No mailboxes found." />
	{:else}
		<div class="mailbox-list">
			{#each mailboxes as mb}
				<div class="mailbox-row">
					<div class="mailbox-row__handle">@{mb.handle_cache}</div>
					<div class="mailbox-row__uuid">{mb.principal_uuid}</div>
					<div class="mailbox-row__status">
					<Badge label={mb.status} variant={mb.status === 'active' ? 'success' : 'danger'} />
					</div>
					<div class="mailbox-row__actions">
						{#if mb.status === 'active'}
							<Button
								variant="secondary"
						size="sm"
								onclick={() => openAction(mb.principal_uuid, 'suspend')}
							>
								Suspend
							</Button>
						{:else}
							<Button
								variant="secondary"
						size="sm"
								onclick={() => openAction(mb.principal_uuid, 'reinstate')}
							>
								Reinstate
							</Button>
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
								<Textarea
									id="reason-{mb.principal_uuid}"
									name="reason"
									rows={2}
									required
									placeholder="State the reason…"
									bind:value={reason}
								></Textarea>
							</div>
							<div class="inline-confirm__buttons">
								<Button type="button" variant="secondary"
						size="sm" onclick={cancel}>Cancel</Button>
								<Button
									type="submit"
									variant={actionType === 'suspend' ? 'danger' : 'primary'}
								>
									Confirm {actionType === 'suspend' ? 'Suspend' : 'Reinstate'}
								</Button>
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

	.search-form { display: flex; gap: var(--space-2); }

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

	.inline-confirm {
		padding: var(--space-3) var(--space-5) var(--space-4);
		background: #f9fafb;
		border-bottom: 1px solid var(--color-border-faint);
	}

	.inline-confirm__buttons { display: flex; gap: var(--space-2); margin-top: var(--space-2); }
</style>
