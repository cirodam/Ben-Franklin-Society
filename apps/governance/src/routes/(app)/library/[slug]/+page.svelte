<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';
	import GoverningDocumentView from './views/GoverningDocumentView.svelte';
	import ProseDocumentView from './views/ProseDocumentView.svelte';
	import ContractDocumentView from './views/ContractDocumentView.svelte';
	import MotionDocumentView from './views/MotionDocumentView.svelte';
	import { Modal } from '@bfs/ui';

	let { data }: { data: PageData } = $props();

	const { document: doc, canEdit, canChangeOwner, members, documentType } = $derived(data);
	
	let showChangeOwnerModal = $state(false);
	let selectedOwnerUuid = $state('');
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<style>
		html {
			scroll-behavior: smooth;
		}
	</style>
</svelte:head>

<div class="document-controls">
	<a href="/library" class="back">← Library</a>
	{#if canEdit && (documentType === 'prose' || documentType === 'contract')}
		<a href="/library/{doc.slug}/edit" class="edit-link">Edit</a>
	{/if}
	{#if canChangeOwner}
		<button type="button" class="change-owner-btn" onclick={() => showChangeOwnerModal = true}>
			Change Owner
		</button>
	{/if}
</div>

{#if documentType === 'prose'}
	<ProseDocumentView document={doc as unknown as import('$lib/server/documents/library-types.js').ProseDocument} />
{:else if documentType === 'contract'}
	<ContractDocumentView document={doc as unknown as import('$lib/server/documents/library-types.js').ContractDocument} />
{:else if documentType === 'motion'}
	<MotionDocumentView document={doc as unknown as import('$lib/server/documents/library-types.js').MotionDocument} {canEdit} />
{:else}
	<GoverningDocumentView document={doc as unknown as import('$lib/server/documents/library-types.js').GoverningDocument} {canEdit} />
{/if}

<Modal bind:open={showChangeOwnerModal} title="Change Document Owner">
	<form 
		method="POST" 
		action="?/changeOwner"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
				showChangeOwnerModal = false;
			};
		}}
	>
		<div class="form-group">
			<label for="newOwnerUuid">New Owner</label>
			<select 
				id="newOwnerUuid" 
				name="newOwnerUuid" 
				bind:value={selectedOwnerUuid}
				required
			>
				<option value="">Select a member...</option>
				{#each members as member}
					<option value={member.uuid}>{member.name}</option>
				{/each}
			</select>
		</div>
		
		<div class="modal-actions">
			<button type="button" onclick={() => showChangeOwnerModal = false} disabled={isSubmitting}>
				Cancel
			</button>
			<button type="submit" class="primary" disabled={isSubmitting || !selectedOwnerUuid}>
				{isSubmitting ? 'Changing...' : 'Change Owner'}
			</button>
		</div>
	</form>
</Modal>

<style>
	.document-controls {
		max-width: 1000px;
		margin: 0 auto var(--space-6);
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: 0 var(--space-4);
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

	.edit-link,
	.change-owner-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		color: var(--gold);
		text-decoration: none;
		background: transparent;
		border: 1px solid var(--border);
		transition: all 0.2s;
		cursor: pointer;
	}

	.edit-link:hover,
	.change-owner-btn:hover {
		background: var(--paper);
		color: var(--gold);
		border-color: var(--gold-hover);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.form-group {
		margin-bottom: var(--space-4);
	}

	.form-group label {
		display: block;
		margin-bottom: var(--space-2);
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		color: var(--ink);
	}

	.form-group select {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		border: 1px solid var(--border);
		background: var(--paper);
		color: var(--ink);
		border-radius: 2px;
		transition: border-color 0.2s;
	}

	.form-group select:focus {
		outline: none;
		border-color: var(--gold);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		margin-top: var(--space-5);
	}

	.modal-actions button {
		padding: var(--space-2) var(--space-4);
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		border: 1px solid var(--border);
		background: transparent;
		color: var(--ink-mid);
		cursor: pointer;
		transition: all 0.2s;
	}

	.modal-actions button:hover:not(:disabled) {
		background: var(--paper);
		border-color: var(--gold-hover);
	}

	.modal-actions button.primary {
		background: var(--gold);
		color: white;
		border-color: var(--gold);
	}

	.modal-actions button.primary:hover:not(:disabled) {
		background: var(--gold-hover);
		border-color: var(--gold-hover);
	}

	.modal-actions button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
