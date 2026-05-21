<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Card, Textarea } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { report } = $derived(data);

	let openAction = $state<'dismiss' | 'delete_message' | 'suspend_mailbox' | null>(null);
	let reason     = $state('');

	function open(action: typeof openAction) {
		openAction = action;
		reason = '';
	}
	function cancel() { openAction = null; }

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleString([], {
			dateStyle: 'medium', timeStyle: 'short',
		});
	}
</script>

<div class="page">
	<div class="breadcrumb">
		<a href="/moderator">← Reports</a>
	</div>

	{#if report.status !== 'pending'}
		<div class="resolved-banner">
			This report has already been resolved ({report.status}).
		</div>
	{/if}

	<Card class="message-card">
		<div class="label">Reported message</div>
		<div class="message-subject">{report.message_subject}</div>
		<div class="message-from">from @{report.message_from_handle}</div>
		<pre class="message-body">{report.message_body}</pre>
	</Card>

	<Card class="reason-card">
		<div class="label">Reporter's reason <span class="anon">(anonymised)</span></div>
		<p class="reporter-reason">{report.reason}</p>
		<div class="meta">Reported {fmtDate(report.created_at)}</div>
	</Card>

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	{#if report.status === 'pending'}
		{#if openAction === null}
			<div class="actions">
				<Button variant="secondary" onclick={() => open('dismiss')}>Dismiss</Button>
				<Button variant="secondary" onclick={() => open('delete_message')}>Delete Message</Button>
				<Button variant="danger" onclick={() => open('suspend_mailbox')}>Suspend Mailbox</Button>
			</div>
		{:else}
			<Card class="confirm-form">
				<form
					method="post"
					action="?/{openAction}"
					use:enhance
				>
					<div class="confirm-form__title">
						{#if openAction === 'dismiss'}Dismiss report
						{:else if openAction === 'delete_message'}Delete the reported message
						{:else}Suspend this mailbox
						{/if}
					</div>
					<Textarea
						id="reason"
						name="reason"
						label="Reason (required)"
						rows={3}
						placeholder="Provide a reason for this action…"
						required
						bind:value={reason}
					/>
					<div class="confirm-form__buttons">
						<Button type="button" variant="secondary" onclick={cancel}>Cancel</Button>
						<Button type="submit" variant={openAction === 'dismiss' ? 'secondary' : 'danger'}>
							Confirm
						</Button>
					</div>
				</form>
			</Card>
		{/if}
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); }

	.breadcrumb a { color: var(--color-text-muted); font-size: var(--text-sm); text-decoration: none; }
	.breadcrumb a:hover { text-decoration: underline; }

	.resolved-banner {
		padding: var(--space-3) var(--space-4);
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: #664d03;
	}

	.label {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		font-weight: var(--weight-semibold);
	}

	.anon { font-style: italic; text-transform: none; }

	.message-subject { font-size: var(--text-lg); font-weight: var(--weight-bold); }
	.message-from { font-size: var(--text-sm); color: var(--color-text-muted); font-family: var(--font-mono); }

	.message-body {
		white-space: pre-wrap;
		font-family: inherit;
		font-size: var(--text-sm);
		color: var(--color-text);
		background: var(--color-surface-alt, #f9fafb);
		border: 1px solid var(--color-border-faint);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		margin: 0;
		line-height: 1.6;
	}

	.reporter-reason { margin: 0; font-size: var(--text-sm); color: var(--color-text); }
	.meta { font-size: var(--text-xs); color: var(--color-text-muted); }

	.actions {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.confirm-form :global(form) {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.confirm-form__title { font-weight: var(--weight-semibold); font-size: var(--text-base); }
	.confirm-form__buttons { display: flex; gap: var(--space-3); }
</style>
