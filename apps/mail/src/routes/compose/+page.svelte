<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { draft, prefill } = $derived(data);

	// Pre-fill values from a draft, from a failed action, or from URL prefill (reply/forward).
	const prefillTo = $derived(
		form?.to_raw ??
		prefill?.to_raw ??
		(draft ? draft.recipients.filter((r) => r.type === 'to').map((r) => `@${r.recipient_handle_cache}`).join(', ') : '')
	);
	const prefillCc = $derived(
		form?.cc_raw ??
		(draft ? draft.recipients.filter((r) => r.type === 'cc').map((r) => `@${r.recipient_handle_cache}`).join(', ') : '')
	);
	const prefillSubject = $derived(form?.subject ?? prefill?.subject ?? draft?.subject ?? '');
	const prefillBody    = $derived(form?.body    ?? prefill?.body    ?? draft?.body    ?? '');
</script>

<div class="page">
	<div class="page-header">
		<h1>New Message</h1>
	</div>

	{#if form?.error}
		<p class="error-msg">{form.error}</p>
	{/if}

	<form method="POST" class="compose-form">
		<!-- Hidden draft uuid if editing a draft -->
		{#if draft}
			<input type="hidden" name="draft_uuid" value={draft.uuid} />
		{/if}

		<div class="field">
			<label for="to" class="label">To</label>
			<input
				id="to"
				name="to"
				type="text"
				class="input"
				placeholder="@handle, @another"
				value={prefillTo}
				required
			/>
		</div>

		<div class="field">
			<label for="cc" class="label">Cc <span class="optional">(optional)</span></label>
			<input
				id="cc"
				name="cc"
				type="text"
				class="input"
				placeholder="@handle"
				value={prefillCc}
			/>
		</div>

		<div class="field">
			<label for="subject" class="label">Subject</label>
			<input
				id="subject"
				name="subject"
				type="text"
				class="input"
				placeholder="Subject"
				value={prefillSubject}
				required
			/>
		</div>

		<div class="field">
			<label for="body" class="label">Message</label>
			<textarea
				id="body"
				name="body"
				class="textarea"
				placeholder="Write your message…"
				rows="12"
				required
			>{prefillBody}</textarea>
		</div>

		<div class="form-actions">
			<button type="submit" formaction="?/save_draft" class="btn-secondary">Save Draft</button>
			<button type="submit" formaction="?/send"       class="btn-primary">Send</button>
		</div>
	</form>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 640px;
	}

	.page-header h1 {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
	}

	.error-msg {
		color: var(--color-danger);
		font-size: var(--text-sm);
		margin: 0;
		padding: var(--space-3) var(--space-4);
		background: var(--color-danger-subtle, #fff0f0);
		border-radius: var(--radius);
	}

	.compose-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.label {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.optional {
		font-weight: var(--weight-normal);
		text-transform: none;
		letter-spacing: 0;
	}

	.input,
	.textarea {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-family: inherit;
		font-size: var(--text-sm);
		background: var(--color-bg);
		color: var(--color-text);
		width: 100%;
		box-sizing: border-box;
	}
	.input:focus,
	.textarea:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.textarea {
		resize: vertical;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding-top: var(--space-2);
	}

	.btn-primary {
		background: var(--color-accent);
		color: #fff;
		border: none;
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		padding: var(--space-2) var(--space-5);
		cursor: pointer;
	}
	.btn-primary:hover { opacity: 0.9; }

	.btn-secondary {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		padding: var(--space-2) var(--space-5);
		cursor: pointer;
	}
	.btn-secondary:hover { background: var(--color-accent-subtle); }
</style>
