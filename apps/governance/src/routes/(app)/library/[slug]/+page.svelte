<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';
	import MotionDocumentView from './views/MotionDocumentView.svelte';
	import GoverningDocumentView from './views/GoverningDocumentView.svelte';

	let { data }: { data: PageData } = $props();

	const { document: doc, canEdit, documentType, status, bodySlug } = $derived(data);
	
	let isMoving = $state(false);

	// Available statuses for each document type
	const governingStatuses = ['inbox', 'enacted', 'repealed', 'sunsetted'];
	const motionStatuses = ['inbox', 'queued', 'deliberating', 'rejected', 'adopted', 'enacted'];

	const statusLabels: Record<string, string> = {
		inbox: 'Inbox',
		enacted: 'Enacted',
		repealed: 'Repealed',
		sunsetted: 'Sunsetted',
		queued: 'Queued',
		deliberating: 'Deliberating',
		rejected: 'Rejected',
		adopted: 'Adopted'
	};
</script>

<svelte:head>
	<style>
		:global(.app-shell__main) {
			background: linear-gradient(135deg, #e8e4d9 0%, #d4cfc0 100%) !important;
		}
		:global(.app-shell__content) {
			padding: 0 !important;
		}
		html {
			scroll-behavior: smooth;
		}
	</style>
</svelte:head>

<div class="document-page">
	<div class="document-controls">
		{#if documentType === 'governing'}
			<a href="/library" class="back">← Society Code</a>
		{:else if documentType === 'motion'}
			<a href="/governance/motions" class="back">← Motions</a>
		{/if}
		
		<div class="status-indicator">
			<span class="status-label">Status:</span>
			<span class="status-value">{statusLabels[status] || status}</span>
		</div>

		{#if canEdit && documentType === 'governing'}
			<a href="/library/{doc.slug}/edit" class="edit-btn">Edit Document</a>
		{/if}

		<form 
			method="POST" 
			action="?/moveDocument"
			class="move-form"
			use:enhance={() => {
				isMoving = true;
				return async ({ update }) => {
					await update();
					isMoving = false;
				};
			}}
		>
			<input type="hidden" name="documentType" value={documentType} />
			{#if documentType === 'motion' && bodySlug}
				<input type="hidden" name="bodySlug" value={bodySlug} />
			{/if}
			
			<label for="toStatus" class="move-label">Move to:</label>
			<select 
				id="toStatus" 
				name="toStatus" 
				class="move-select"
				disabled={isMoving}
				onchange={(e) => e.currentTarget.form?.requestSubmit()}
			>
				<option value="">--</option>
				{#if documentType === 'governing'}
					{#each governingStatuses as s}
						{#if s !== status}
							<option value={s}>{statusLabels[s] || s}</option>
						{/if}
					{/each}
				{:else if documentType === 'motion'}
					{#each motionStatuses as s}
						{#if s !== status}
							<option value={s}>{statusLabels[s] || s}</option>
						{/if}
					{/each}
				{/if}
			</select>
		</form>
	</div>

	<div class="document-wrapper">
		{#if documentType === 'motion'}
			<MotionDocumentView document={doc as unknown as import('$lib/server/documents/library-types.js').MotionDocument} canEdit={canEdit} />
		{:else if documentType === 'governing'}
			<GoverningDocumentView document={doc as unknown as import('$lib/server/documents/library-types.js').GoverningDocument} canEdit={canEdit} />
		{/if}
	</div>
</div>

<style>
	.document-page {
		min-height: 100vh;
		padding: var(--space-8, 2rem);
		display: flex;
		flex-direction: column;
		gap: var(--space-6, 1.5rem);
	}

	.document-wrapper {
		display: flex;
		justify-content: center;
	}

	.document-controls {
		max-width: 1000px;
		margin: 0 auto var(--space-6);
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: 0 var(--space-4);
		flex-wrap: wrap;
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		color: var(--ink-mid);
		text-decoration: none;
		background: transparent;
		border: 1px solid var(--border);
		transition: all 0.2s;
	}

	.back:hover {
		background: var(--paper);
		color: var(--ink);
		border-color: var(--gold-hover);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: var(--paper);
		border: 1px solid var(--border);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
	}

	.status-label {
		font-weight: 600;
		color: var(--ink-mid);
	}

	.status-value {
		color: var(--ink);
		text-transform: capitalize;
	}

	.edit-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		color: var(--paper);
		text-decoration: none;
		background: var(--gold);
		border: 1px solid var(--gold);
		transition: all 0.2s;
	}

	.edit-btn:hover {
		background: var(--gold-hover);
		border-color: var(--gold-hover);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.move-form {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-left: auto;
	}

	.move-label {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		color: var(--ink-mid);
	}

	.move-select {
		padding: var(--space-2) var(--space-3);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		border: 1px solid var(--border);
		background: var(--paper);
		color: var(--ink);
		border-radius: 2px;
		cursor: pointer;
		transition: border-color 0.2s;
		min-width: 150px;
	}

	.move-select:hover:not(:disabled) {
		border-color: var(--gold);
	}

	.move-select:focus {
		outline: none;
		border-color: var(--gold);
	}

	.move-select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
