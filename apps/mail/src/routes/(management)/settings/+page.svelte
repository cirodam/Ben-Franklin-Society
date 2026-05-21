<script lang="ts">
	import { enhance } from '$app/forms';
	import { PageHeader, Alert, Button } from '@bfs/ui';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { mailbox } = $derived(data);

	let signature = $state(mailbox.signature || '');
	let showPreview = $state(false);

	const formData = $derived(form as any);
</script>

<div class="page">
	<PageHeader title="Mail Settings" />

	{#if formData?.success}
		<Alert variant="success">Signature updated successfully</Alert>
	{/if}

	<div class="section">
		<h2 class="section-title">Signature</h2>
		<p class="section-description">
			Your signature will be automatically appended to new messages and replies. You can edit or remove it before sending.
		</p>

		<form method="POST" action="?/updateSignature" use:enhance>
			<div class="form-group">
				<div class="signature-tabs">
					<button
						type="button"
						class="tab"
						class:tab--active={!showPreview}
						onclick={() => (showPreview = false)}
					>
						Edit
					</button>
					<button
						type="button"
						class="tab"
						class:tab--active={showPreview}
						onclick={() => (showPreview = true)}
					>
						Preview
					</button>
				</div>

				{#if showPreview}
					<div class="preview-box">
						{#if signature.trim()}
							<div class="signature-delimiter">--</div>
							<MarkdownRenderer markdown={signature} />
						{:else}
							<p class="empty-message">No signature set</p>
						{/if}
					</div>
				{:else}
					<MarkdownEditor
						name="signature"
						bind:value={signature}
						rows={6}
						placeholder="Your name\nYour title\nContact information…"
					/>
				{/if}
			</div>

			<div class="form-actions">
				<Button type="submit" variant="primary">Save Signature</Button>
			</div>
		</form>
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.section {
		background: white;
		border: 2px solid var(--border-strong);
		border-radius: var(--radius-lg);
		padding: var(--space-7);
		box-shadow: 0 2px 8px rgba(43, 76, 126, 0.08);
	}

	.section-title {
		margin: 0 0 var(--space-2);
		font-family: var(--font-sans);
		font-size: var(--text-xl);
		font-weight: 700;
		color: var(--ink-navy);
	}

	.section-description {
		margin: 0 0 var(--space-5);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--ink-slate);
		line-height: 1.6;
	}

	.form-group {
		margin-bottom: var(--space-5);
	}

	.signature-tabs {
		display: flex;
		gap: var(--space-1);
		margin-bottom: var(--space-3);
		border-bottom: 2px solid var(--border);
	}

	.tab {
		padding: var(--space-2) var(--space-4);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		cursor: pointer;
		color: var(--ink-slate);
		transition: all 0.2s;
	}

	.tab:hover {
		color: var(--postal-blue);
	}

	.tab--active {
		color: var(--postal-blue);
		border-bottom-color: var(--postal-blue);
	}

	.preview-box {
		padding: var(--space-5);
		background: var(--parchment);
		border: 1.5px solid var(--border);
		border-radius: var(--radius);
		min-height: 150px;
	}

	.signature-delimiter {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--ink-gray);
		margin-bottom: var(--space-3);
	}

	.empty-message {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--ink-gray);
		font-style: italic;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: var(--space-6);
	}
</style>
