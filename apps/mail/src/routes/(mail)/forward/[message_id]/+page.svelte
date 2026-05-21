<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Input, Card, Textarea, formatDateTime } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { original } = $derived(data);

	let toHandles = $state('');
	let ccHandles = $state('');
	let bccHandles = $state('');
	let body = $state(
		`\n\n---------- Forwarded message ----------\nFrom: @${original.from_handle_cache}\nDate: ${formatDateTime(original.sent_at)}\nSubject: ${original.subject}\nTo: ${original.recipients.map((r) => '@' + r.recipient_handle_cache).join(', ')}\n\n${original.body}`
	);

	// Type assertion to work around ActionData inference issue
	const formData = $derived(form as any);
</script>

<div class="page">
	<div class="page-header">
		<a href="/thread/{original.thread_id}" class="back-link">← Back to Thread</a>
		<h1>Forward Message</h1>
	</div>

	{#if formData?.error}
		<Alert variant="danger">{formData.error}</Alert>
	{/if}

	<Card>
		<form method="POST" action="?/forward" use:enhance>
			<div class="form-section">
				<Input
					label="To"
					name="to"
					type="text"
					bind:value={toHandles}
					placeholder="@alice, @bob"
					required
					error={formData?.field === 'to' ? formData.error : undefined}
				/>
				<p class="field-hint">Comma-separated list of handles</p>
			</div>

			<div class="form-section">
				<Input
					label="CC (optional)"
					name="cc"
					type="text"
					bind:value={ccHandles}
					placeholder="@charlie, @diana"
					error={formData?.field === 'cc' ? formData.error : undefined}
				/>
				<p class="field-hint">Comma-separated list of handles</p>
			</div>

			<div class="form-section">
				<Input
					label="BCC (optional)"
					name="bcc"
					type="text"
					bind:value={bccHandles}
					placeholder="@eve, @frank"
					error={formData?.field === 'bcc' ? formData.error : undefined}
				/>
				<p class="field-hint">Comma-separated list of handles (hidden from other recipients)</p>
			</div>

			<div class="form-section">
				<label for="body" class="label">Message</label>
				<Textarea name="body" bind:value={body} rows={16} required />
			</div>

			<div class="form-actions">
				<Button type="submit" variant="primary">Send</Button>
				<a href="/thread/{original.thread_id}" class="btn-cancel">Cancel</a>
			</div>
		</form>
	</Card>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.back-link {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--postal-blue);
		text-decoration: none;
		transition: color 0.2s;
	}
	.back-link:hover {
		color: var(--postal-blue-mid);
		text-decoration: underline;
	}

	.page-header h1 {
		margin: 0;
		font-family: var(--font-sans);
		font-size: var(--text-2xl);
		font-weight: 700;
		color: var(--ink-navy);
	}

	.form-section {
		margin-bottom: var(--space-5);
	}

	.label {
		display: block;
		margin-bottom: var(--space-2);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--ink-charcoal);
	}

	.field-hint {
		margin-top: var(--space-1);
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		color: var(--ink-gray);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		margin-top: var(--space-6);
	}

	.btn-cancel {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--postal-blue);
		text-decoration: none;
		transition: color 0.2s;
	}
	.btn-cancel:hover {
		color: var(--postal-blue-mid);
		text-decoration: underline;
	}
</style>
