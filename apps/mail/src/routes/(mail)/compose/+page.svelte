<script lang="ts">
	import { PageHeader, Alert, Input, Button } from '@bfs/ui';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import AutosaveIndicator from '$lib/components/compose/AutosaveIndicator.svelte';
	import TemplateSelector from '$lib/components/compose/TemplateSelector.svelte';
	import RecipientFields from '$lib/components/compose/RecipientFields.svelte';
	import AttachmentsSection from '$lib/components/compose/AttachmentsSection.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { draft, prefill, signature, templates, attachments, contactGroups } = $derived(data);

	// Pre-fill values from a draft, from a failed action, or from URL prefill (reply/forward).
	const prefillTo = $derived(
		form?.to_raw ??
		prefill?.to_raw ??
		(draft
			? draft.recipients
					.filter((r) => r.type === 'to')
					.map((r) => `@${r.recipient_handle_cache}`)
					.join(', ')
			: '')
	);
	const prefillCc = $derived(
		form?.cc_raw ??
		(draft
			? draft.recipients
					.filter((r) => r.type === 'cc')
					.map((r) => `@${r.recipient_handle_cache}`)
					.join(', ')
			: '')
	);
	const prefillBcc = $derived(
		form?.bcc_raw ??
		(draft
			? draft.recipients
					.filter((r) => r.type === 'bcc')
					.map((r) => `@${r.recipient_handle_cache}`)
					.join(', ')
			: '')
	);
	const prefillSubject = $derived(form?.subject ?? prefill?.subject ?? draft?.subject ?? '');
	const prefillBody = $derived(
		form?.body ?? prefill?.body ?? draft?.body ?? (prefill ? '' : signature)
	);

	// Template selection state
	let selectedTemplate = $state<string>('');
	let toValue = $state(prefillTo);
	let ccValue = $state(prefillCc);
	let bccValue = $state(prefillBcc);
	let subjectValue = $state(prefillSubject);
	let bodyValue = $state(prefillBody);

	// Handle template selection
	function handleTemplateSelect(template: any) {
		if (template) {
			subjectValue = template.subject;
			bodyValue = template.body;
		}
	}

	// Autosave functionality
	let lastSavedAt = $state<Date | null>(null);
	let isSaving = $state(false);
	let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

	// Trigger autosave when form content changes
	$effect(() => {
		// Watch for changes in form fields
		toValue;
		ccValue;
		bccValue;
		subjectValue;
		bodyValue;

		// Clear existing timer
		if (autosaveTimer) {
			clearTimeout(autosaveTimer);
		}

		// Only autosave if there's content (at least a subject or body)
		if (!subjectValue && !bodyValue) return;

		// Set new timer to save after 3 seconds of inactivity
		autosaveTimer = setTimeout(async () => {
			await autosave();
		}, 3000);

		// Cleanup on unmount
		return () => {
			if (autosaveTimer) clearTimeout(autosaveTimer);
		};
	});

	async function autosave() {
		if (isSaving) return;

		isSaving = true;
		try {
			const formData = new FormData();
			if (draft) formData.append('draft_uuid', draft.uuid);
			formData.append('to', toValue);
			formData.append('cc', ccValue);
			formData.append('bcc', bccValue);
			formData.append('subject', subjectValue);
			formData.append('body', bodyValue);
			formData.append('content_type', 'text/markdown');

			const response = await fetch('?/autosave', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const result = await response.json();
				lastSavedAt = new Date();

				// Update URL if this is a new draft
				if (!draft && result?.draft_uuid) {
					const url = new URL(window.location.href);
					url.searchParams.set('draft', result.draft_uuid);
					window.history.replaceState({}, '', url);
				}
			}
		} catch (error) {
			console.error('Autosave failed:', error);
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="page">
	<PageHeader title="New Message" />

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	<form method="POST" class="compose-form" enctype="multipart/form-data">
		{#if draft}
			<input type="hidden" name="draft_uuid" value={draft.uuid} />
		{/if}

		<AutosaveIndicator {isSaving} {lastSavedAt} />

		<TemplateSelector {templates} bind:selectedTemplate onTemplateSelect={handleTemplateSelect} />

		<RecipientFields
			bind:toValue
			bind:ccValue
			bind:bccValue
			{contactGroups}
		/>

		<Input
			id="subject"
			name="subject"
			label="Subject"
			placeholder="Subject"
			bind:value={subjectValue}
			required
		/>

		<input type="hidden" name="content_type" value="text/markdown" />

		<div>
			<label class="label">Message</label>
			<MarkdownEditor
				name="body"
				bind:value={bodyValue}
				rows={12}
				placeholder="Write your message…"
				required
			/>
		</div>

		<AttachmentsSection {attachments} draftUuid={draft?.uuid} />

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
	}

	.compose-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		background: white;
		border: 2px solid var(--border-strong);
		border-radius: var(--radius-lg);
		padding: var(--space-7);
		box-shadow: 0 2px 8px rgba(43, 76, 126, 0.08);
	}

	.label {
		display: block;
		margin-bottom: var(--space-2);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--ink-charcoal);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		margin-top: var(--space-2);
	}
</style>
