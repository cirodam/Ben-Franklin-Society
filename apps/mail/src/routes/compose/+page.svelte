<script lang="ts">
	import { enhance } from '$app/forms';
	import { PageHeader, Alert, Input, Textarea, Button } from '@bfs/ui';
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
	<PageHeader title="New Message" />

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	<form method="POST" class="compose-form">
		<!-- Hidden draft uuid if editing a draft -->
		{#if draft}
			<input type="hidden" name="draft_uuid" value={draft.uuid} />
		{/if}

			<Input
				id="to"
				name="to"
				label="To"
				placeholder="@handle, @another"
				value={prefillTo}
				required
			/>

			<Input
				id="cc"
				name="cc"
				label="Cc (optional)"
				placeholder="@handle"
				value={prefillCc}
			/>

			<Input
				id="subject"
				name="subject"
				label="Subject"
				placeholder="Subject"
				value={prefillSubject}
				required
			/>

			<Textarea
				id="body"
				name="body"
				label="Message"
				placeholder="Write your message…"
				rows={12}
				value={prefillBody}
				required
			/>

			<div class="form-actions">
				<Button type="submit" formaction="?/save_draft" variant="secondary">Save Draft</Button>
				<Button type="submit" formaction="?/send">Send</Button>
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

	.compose-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding-top: var(--space-2);
	}
</style>
