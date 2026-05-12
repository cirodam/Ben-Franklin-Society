<script lang="ts">
	import { enhance } from '$app/forms';
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

	<div class="card message-card">
		<div class="label">Reported message</div>
		<div class="message-subject">{report.message_subject}</div>
		<div class="message-from">from @{report.message_from_handle}</div>
		<pre class="message-body">{report.message_body}</pre>
	</div>

	<div class="card reason-card">
		<div class="label">Reporter's reason <span class="anon">(anonymised)</span></div>
		<p class="reporter-reason">{report.reason}</p>
		<div class="meta">Reported {fmtDate(report.created_at)}</div>
	</div>

	{#if form?.error}
		<div class="error-banner">{form.error}</div>
	{/if}

	{#if report.status === 'pending'}
		{#if openAction === null}
			<div class="actions">
				<button class="btn btn-secondary" onclick={() => open('dismiss')}>Dismiss</button>
				<button class="btn btn-warning"   onclick={() => open('delete_message')}>Delete Message</button>
				<button class="btn btn-danger"     onclick={() => open('suspend_mailbox')}>Suspend Mailbox</button>
			</div>
		{:else}
			<form
				method="post"
				action="?/{openAction}"
				class="confirm-form card"
				use:enhance
			>
				<div class="confirm-form__title">
					{#if openAction === 'dismiss'}Dismiss report
					{:else if openAction === 'delete_message'}Delete the reported message
					{:else}Suspend this mailbox
					{/if}
				</div>
				<div class="field">
					<label for="reason">Reason (required)</label>
					<textarea
						id="reason"
						name="reason"
						class="textarea"
						rows="3"
						placeholder="Provide a reason for this action…"
						required
						bind:value={reason}
					></textarea>
				</div>
				<div class="confirm-form__buttons">
					<button type="button" class="btn btn-secondary" onclick={cancel}>Cancel</button>
					<button type="submit" class="btn {openAction === 'dismiss' ? 'btn-secondary' : 'btn-danger'}">
						Confirm
					</button>
				</div>
			</form>
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

	.card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
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

	.error-banner {
		padding: var(--space-3) var(--space-4);
		background: #fff0f0;
		border: 1px solid #f5a5a5;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: #891818;
	}

	.actions {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.confirm-form { gap: var(--space-4); }
	.confirm-form__title { font-weight: var(--weight-semibold); font-size: var(--text-base); }
	.confirm-form__buttons { display: flex; gap: var(--space-3); }

	.field { display: flex; flex-direction: column; gap: var(--space-2); }
	label { font-size: var(--text-sm); font-weight: var(--weight-medium); }

	.textarea {
		resize: vertical;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-family: inherit;
		font-size: var(--text-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}
	.textarea:focus { outline: 2px solid var(--color-primary); outline-offset: 1px; }

	.btn {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		border: none;
	}
	.btn-secondary { background: var(--color-surface-alt, #f3f4f6); color: var(--color-text); border: 1px solid var(--color-border); }
	.btn-warning   { background: #ffc107; color: #333; }
	.btn-danger    { background: #dc2626; color: #fff; }
	.btn:hover { filter: brightness(0.92); }
</style>
