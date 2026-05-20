<script lang="ts">
	import { enhance } from '$app/forms';
	import type { MotionDocument, Provision } from '$lib/server/documents/library-types.js';
	import DocumentView from './DocumentView.svelte';
	import { Modal } from '@bfs/ui';

	let { 
		document: doc,
		canEdit = false 
	}: { 
		document: MotionDocument;
		canEdit?: boolean;
	} = $props();

	// Edit state
	let isEditMode = $state(false);
	let editedProvisions = $state([...doc.content.provisions]);
	let editedClerkNotes = $state(doc.content.clerk_notes || '');
	let editedParliamentarianNotes = $state(doc.content.parliamentarian_notes || '');
	let isSaving = $state(false);

	// Modal state
	let showProvisionModal = $state(false);
	let editingProvisionIndex = $state<number | null>(null);
	let modalProvision = $state<Provision>({ number: '', text: '', reasoning: '' });

	function toggleEditMode() {
		isEditMode = !isEditMode;
		if (isEditMode) {
			editedProvisions = [...doc.content.provisions];
			editedClerkNotes = doc.content.clerk_notes || '';
			editedParliamentarianNotes = doc.content.parliamentarian_notes || '';
		}
	}

	function openProvisionModal(index: number) {
		editingProvisionIndex = index;
		modalProvision = { ...editedProvisions[index] };
		showProvisionModal = true;
	}

	function openNewProvisionModal() {
		editingProvisionIndex = null;
		const nextNumber = (editedProvisions.length + 1).toString();
		modalProvision = { number: nextNumber, text: '', reasoning: '' };
		showProvisionModal = true;
	}

	function saveProvision() {
		if (editingProvisionIndex !== null) {
			// Update existing provision
			editedProvisions[editingProvisionIndex] = { ...modalProvision };
		} else {
			// Add new provision
			editedProvisions = [...editedProvisions, { ...modalProvision }];
		}
		showProvisionModal = false;
	}

	function deleteProvision(index: number) {
		if (confirm('Delete this provision?')) {
			editedProvisions = editedProvisions.filter((_, i) => i !== index);
			// Renumber provisions
			editedProvisions = editedProvisions.map((p, i) => ({
				...p,
				number: (i + 1).toString()
			}));
		}
	}

	function cancelEdit() {
		isEditMode = false;
		editedProvisions = [...doc.content.provisions];
		editedClerkNotes = doc.content.clerk_notes || '';
		editedParliamentarianNotes = doc.content.parliamentarian_notes || '';
	}
</script>

<DocumentView>
	{#snippet header()}
		<div class="document-title-block">
			<div class="document-letterhead">
				<div class="letterhead-body">The Ben Franklin Society</div>
				<div class="letterhead-doc-number">
					{doc.document_id || `#${doc.uuid.slice(0, 8)}`}
				</div>
			</div>
			<h1 class="document-title">{doc.title}</h1>
		</div>
		<div class="motion-meta">
			<div class="meta-row">
				<span class="meta-label">Status:</span>
				<span class="meta-value status-{doc.content.status}">{doc.content.status}</span>
			</div>
			{#if doc.content.body_name}
				<div class="meta-row">
					<span class="meta-label">Body:</span>
					<span class="meta-value">{doc.content.body_name}</span>
				</div>
			{/if}
			{#if doc.content.status !== 'draft'}
				<div class="meta-row">
					<span class="meta-label">Introduced:</span>
					<span class="meta-value">{new Date(doc.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
				</div>
			{/if}
			{#if doc.content.deliberation_rule_name || doc.content.status !== 'draft'}
				<div class="meta-row">
					<span class="meta-label">Deliberation:</span>
					<span class="meta-value">{doc.content.deliberation_rule_name || '—'}</span>
				</div>
			{/if}
			{#if doc.content.vote_rule_name || doc.content.status !== 'draft'}
				<div class="meta-row">
					<span class="meta-label">Voting:</span>
					<span class="meta-value">{doc.content.vote_rule_name || '—'}</span>
				</div>
			{/if}
		</div>
		
		{#if canEdit}
			<div class="edit-toolbar">
				{#if !isEditMode}
					<button type="button" class="btn-edit" onclick={toggleEditMode}>
						Edit Motion
					</button>
				{:else}
					<button type="button" class="btn-cancel" onclick={cancelEdit}>
						Cancel
					</button>
					<button type="button" class="btn-save" onclick={() => document.getElementById('save-form')?.requestSubmit()} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save Changes'}
					</button>
				{/if}
			</div>
		{/if}
	{/snippet}

	{#snippet body()}
		<form 
			id="save-form"
			method="POST" 
			action="?/updateMotion"
			use:enhance={() => {
				isSaving = true;
				return async ({ update, result }) => {
					await update();
					isSaving = false;
					if (result.type === 'success') {
						isEditMode = false;
						window.location.reload();
					}
				};
			}}
		>
			<input type="hidden" name="provisions" value={JSON.stringify(editedProvisions)} />
			<input type="hidden" name="clerk_notes" value={editedClerkNotes} />
			<input type="hidden" name="parliamentarian_notes" value={editedParliamentarianNotes} />
		</form>

		<div class="motion-body">
			<div class="provisions-section">
				{#if isEditMode}
					<div class="section-header">
						<h2 class="section-heading">Provisions</h2>
						<button type="button" class="btn-add" onclick={openNewProvisionModal}>
							+ Add Provision
						</button>
					</div>
				{/if}

				{#each (isEditMode ? editedProvisions : doc.content.provisions) as provision, index}
					<div class="provision" class:edit-mode={isEditMode}>
						<div class="provision-number">{provision.number}</div>
						<div class="provision-content">
							{#if provision.title}
								<h3 class="provision-title">{provision.title}</h3>
							{/if}
							<div class="provision-text">{provision.text}</div>
							{#if provision.reasoning}
								<div class="provision-reasoning">
									<span class="reasoning-label">Reasoning:</span>
									<span class="reasoning-text">{provision.reasoning}</span>
								</div>
							{/if}
						</div>
						{#if isEditMode}
							<div class="provision-actions">
								<button type="button" class="btn-edit-provision" onclick={() => openProvisionModal(index)}>
									Edit
								</button>
								<button type="button" class="btn-delete-provision" onclick={() => deleteProvision(index)}>
									Delete
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			{#if !isEditMode && doc.content.signatures && doc.content.signatures.length > 0}
				<div class="signatures-section">
					<h2 class="section-heading">Signatures</h2>
					<div class="signatures-list">
						{#each doc.content.signatures as signature}
							<div class="signature" style={signature.font ? `font-family: ${signature.font}` : ''}>
								<div class="signature-text">{signature.signature_text}</div>
								<div class="signature-date">{new Date(signature.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Official Notes Section (Preprinted Form Style) -->
			<div class="official-notes-section">
				<div class="form-box clerk-box">
					<div class="form-box-header">
						<span class="form-box-label">Clerk's Notes</span>
					</div>
					<div class="form-box-content">
						{#if isEditMode}
							<textarea 
								bind:value={editedClerkNotes}
								placeholder="Administrative notes, filing information, cross-references..."
								class="form-textarea"
								rows="4"
							></textarea>
						{:else if doc.content.clerk_notes}
							<div class="form-box-text">{doc.content.clerk_notes}</div>
						{:else}
							<div class="form-box-empty">No notes recorded.</div>
						{/if}
					</div>
				</div>

				<div class="form-box parliamentarian-box">
					<div class="form-box-header">
						<span class="form-box-label">Parliamentarian's Notes</span>
					</div>
					<div class="form-box-content">
						{#if isEditMode}
							<textarea 
								bind:value={editedParliamentarianNotes}
								placeholder="Procedural notes, rules applied, precedents..."
								class="form-textarea"
								rows="4"
							></textarea>
						{:else if doc.content.parliamentarian_notes}
							<div class="form-box-text">{doc.content.parliamentarian_notes}</div>
						{:else}
							<div class="form-box-empty">No notes recorded.</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/snippet}
</DocumentView>

<!-- Provision Edit Modal -->
<Modal bind:open={showProvisionModal} title={editingProvisionIndex !== null ? 'Edit Provision' : 'Add Provision'}>
	<div class="modal-content">
		<div class="form-group">
			<label for="provision-number">Number</label>
			<input 
				id="provision-number"
				type="text" 
				bind:value={modalProvision.number}
				placeholder="1"
				class="modal-input"
			/>
		</div>

		<div class="form-group">
			<label for="provision-title">Title (optional)</label>
			<input 
				id="provision-title"
				type="text" 
				bind:value={modalProvision.title}
				placeholder="Provision heading"
				class="modal-input"
			/>
		</div>

		<div class="form-group">
			<label for="provision-text">Text</label>
			<textarea 
				id="provision-text"
				bind:value={modalProvision.text}
				placeholder="The text of this provision..."
				rows="6"
				class="modal-textarea"
			></textarea>
		</div>

		<div class="form-group">
			<label for="provision-reasoning">Reasoning (optional)</label>
			<textarea 
				id="provision-reasoning"
				bind:value={modalProvision.reasoning}
				placeholder="Explain the reasoning for this provision..."
				rows="4"
				class="modal-textarea"
			></textarea>
		</div>

		<div class="modal-actions">
			<button type="button" class="btn-modal-cancel" onclick={() => showProvisionModal = false}>
				Cancel
			</button>
			<button type="button" class="btn-modal-save" onclick={saveProvision}>
				{editingProvisionIndex !== null ? 'Update' : 'Add'} Provision
			</button>
		</div>
	</div>
</Modal>

<style>
	/* Document letterhead */
	.document-letterhead {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-4);
		font-family: 'IM Fell English SC', serif;
	}

	.letterhead-body {
		font-size: var(--text-xs);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	.letterhead-doc-number {
		font-size: var(--text-xs);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	.motion-meta {
		display: flex;
		justify-content: center;
		gap: var(--space-8);
		margin-top: var(--space-4);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
	}

	.meta-row {
		display: flex;
		gap: var(--space-2);
		color: #5a5a50;
	}

	.meta-label {
		font-weight: 600;
		font-style: italic;
	}

	.meta-value {
		font-variant-numeric: oldstyle-nums;
		text-transform: capitalize;
	}

	/* Status-specific colors */
	.meta-value.status-draft {
		color: #7a5c1a;
		font-style: italic;
	}

	.meta-value.status-introduced {
		color: #1565c0;
		font-weight: 600;
	}

	.meta-value.status-deliberation {
		color: #e65100;
		font-weight: 600;
	}

	.meta-value.status-enacted {
		color: #2d5a4f;
		font-weight: 600;
	}

	.meta-value.status-adopted {
		color: #2d5a4f;
		font-weight: 600;
	}

	.meta-value.status-rejected {
		color: #7a2e2e;
		font-weight: 600;
	}

	.meta-value.status-withdrawn {
		color: #5a5a50;
		font-style: italic;
	}

	/* Motion body */
	.motion-body {
		font-family: 'Libre Baskerville', Georgia, serif;
	}

	.body-section {
		margin-bottom: var(--space-8);
	}

	.body-text {
		font-size: 1.0625rem;
		line-height: 1.75;
		color: #151c1a;
		white-space: pre-wrap;
	}

	/* Provisions */
	.provisions-section {
		margin-bottom: var(--space-8);
	}

	.provision {
		display: flex;
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}

	.provision-number {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		font-weight: 600;
		color: #7a5c1a;
		min-width: 3rem;
		flex-shrink: 0;
	}

	.provision-content {
		flex: 1;
	}

	.provision-title {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		font-weight: 600;
		color: #2d5a4f;
		margin: 0 0 var(--space-2);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.provision-text {
		font-size: 1.0625rem;
		line-height: 1.75;
		color: #151c1a;
		white-space: pre-wrap;
	}

	.provision-reasoning {
		margin-top: var(--space-3);
		padding: var(--space-3);
		background: rgba(122, 92, 26, 0.05);
		border-left: 3px solid rgba(122, 92, 26, 0.3);
	}

	.reasoning-label {
		display: block;
		margin-bottom: var(--space-1);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		color: #7a5c1a;
		text-transform: uppercase;
	}

	.reasoning-text {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		line-height: 1.6;
		color: #3c2f16;
		font-style: italic;
	}

	/* Signatures */
	.signatures-section {
		margin-top: var(--space-10);
		padding-top: var(--space-6);
		border-top: 2px solid rgba(45, 90, 79, 0.3);
	}

	.signatures-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		margin-top: var(--space-6);
	}

	.signature {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-4);
		border-left: 3px solid #7a5c1a;
		background: rgba(122, 92, 26, 0.03);
	}

	.signature-text {
		font-size: var(--text-lg);
		line-height: 1.4;
		color: #151c1a;
	}

	.signature-date {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-xs);
		font-style: italic;
		color: #5a5a50;
	}

	.reasoning-section {
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid rgba(45, 90, 79, 0.2);
	}

	.section-heading {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
		margin: 0 0 var(--space-3);
	}

	.section-text {
		font-size: var(--text-base);
		line-height: 1.75;
		color: #3c2f16;
		white-space: pre-wrap;
	}

	/* Official Notes Section (Preprinted Form Style) */
	.official-notes-section {
		margin-top: var(--space-12);
		padding-top: var(--space-8);
		border-top: 2px solid rgba(45, 90, 79, 0.3);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form-box {
		border: 2px solid;
		border-radius: 0;
		padding: 0;
		background: transparent;
	}

	.clerk-box {
		border-color: rgba(91, 140, 184, 0.4);
	}

	.parliamentarian-box {
		border-color: rgba(184, 108, 139, 0.4);
	}

	.form-box-header {
		border-bottom: 1px solid currentColor;
		padding: var(--space-2) var(--space-4);
		background: rgba(0, 0, 0, 0.02);
	}

	.clerk-box .form-box-header {
		border-bottom-color: rgba(91, 140, 184, 0.4);
		background: rgba(91, 140, 184, 0.03);
	}

	.parliamentarian-box .form-box-header {
		border-bottom-color: rgba(184, 108, 139, 0.4);
		background: rgba(184, 108, 139, 0.03);
	}

	.form-box-label {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.15em;
	}

	.clerk-box .form-box-label {
		color: #1e3a5f;
	}

	.parliamentarian-box .form-box-label {
		color: #70284a;
	}

	.form-box-content {
		padding: var(--space-4);
		min-height: 6rem;
	}

	.form-box-text {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		line-height: 1.6;
		white-space: pre-wrap;
		color: #151c1a;
	}

	.form-box-empty {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		font-style: italic;
		color: #9a9a90;
	}

	.form-textarea {
		width: 100%;
		padding: var(--space-2);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		line-height: 1.6;
		color: #151c1a;
		border: 1px solid rgba(45, 90, 79, 0.2);
		border-radius: 0;
		background: var(--paper);
		resize: vertical;
	}

	.form-textarea:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.4);
	}

	.form-textarea::placeholder {
		color: #9a9a90;
		font-style: italic;
	}

	/* Edit Mode */
	.edit-toolbar {
		display: flex;
		justify-content: center;
		gap: var(--space-3);
		margin-top: var(--space-6);
		padding-top: var(--space-4);
		border-top: 1px solid rgba(45, 90, 79, 0.15);
	}

	.btn-edit,
	.btn-cancel,
	.btn-save {
		padding: var(--space-2) var(--space-5);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		border: 1px solid;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-edit {
		color: #7a5c1a;
		background: transparent;
		border-color: #7a5c1a;
	}

	.btn-edit:hover {
		background: rgba(122, 92, 26, 0.05);
		border-color: #5a4515;
	}

	.btn-cancel {
		color: #5a5a50;
		background: transparent;
		border-color: #5a5a50;
	}

	.btn-cancel:hover:not(:disabled) {
		background: rgba(90, 90, 80, 0.05);
	}

	.btn-save {
		color: white;
		background: #2d5a4f;
		border-color: #2d5a4f;
	}

	.btn-save:hover:not(:disabled) {
		background: #234a40;
		border-color: #234a40;
	}

	.btn-cancel:disabled,
	.btn-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
	}

	.btn-add {
		padding: var(--space-1) var(--space-3);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		letter-spacing: 0.05em;
		color: #2d5a4f;
		background: transparent;
		border: 1px solid #2d5a4f;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-add:hover {
		background: rgba(45, 90, 79, 0.05);
	}

	.provision.edit-mode {
		position: relative;
		padding: var(--space-4);
		border: 1px solid rgba(45, 90, 79, 0.2);
		background: rgba(255, 255, 255, 0.3);
		border-radius: 2px;
		transition: all 0.2s;
	}

	.provision.edit-mode:hover {
		background: rgba(255, 255, 255, 0.5);
		border-color: rgba(45, 90, 79, 0.4);
	}

	.provision-actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-3);
	}

	.btn-edit-provision,
	.btn-delete-provision {
		padding: var(--space-1) var(--space-3);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		letter-spacing: 0.05em;
		border: 1px solid;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-edit-provision {
		color: #2d5a4f;
		background: transparent;
		border-color: #2d5a4f;
	}

	.btn-edit-provision:hover {
		background: rgba(45, 90, 79, 0.1);
	}

	.btn-delete-provision {
		color: #b86c8b;
		background: transparent;
		border-color: #b86c8b;
	}

	.btn-delete-provision:hover {
		background: rgba(184, 108, 139, 0.1);
		color: #70284a;
		border-color: #70284a;
	}

	.reasoning-section.edit-mode {
		padding: var(--space-4);
		border: 1px solid rgba(45, 90, 79, 0.2);
		background: rgba(255, 255, 255, 0.3);
		border-radius: 2px;
	}

	.input-reasoning {
		width: 100%;
		padding: var(--space-3);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		line-height: 1.75;
		color: #3c2f16;
		background: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(45, 90, 79, 0.3);
		border-radius: 2px;
		resize: vertical;
		min-height: 120px;
	}

	.input-reasoning:focus {
		outline: none;
		border-color: #7a5c1a;
		background: white;
	}

	/* Modal Styles */
	.modal-content {
		padding: var(--space-2);
	}

	.form-group {
		margin-bottom: var(--space-4);
	}

	.form-group label {
		display: block;
		margin-bottom: var(--space-2);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		color: #2d5a4f;
	}

	.modal-input,
	.modal-textarea {
		width: 100%;
		padding: var(--space-3);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		line-height: 1.5;
		color: #151c1a;
		background: white;
		border: 1px solid rgba(45, 90, 79, 0.3);
		border-radius: 2px;
	}

	.modal-textarea {
		resize: vertical;
		min-height: 120px;
	}

	.modal-input:focus,
	.modal-textarea:focus {
		outline: none;
		border-color: #7a5c1a;
		box-shadow: 0 0 0 2px rgba(122, 92, 26, 0.1);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		margin-top: var(--space-5);
		padding-top: var(--space-4);
		border-top: 1px solid rgba(45, 90, 79, 0.15);
	}

	.btn-modal-cancel,
	.btn-modal-save {
		padding: var(--space-2) var(--space-5);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		border: 1px solid;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-modal-cancel {
		color: #5a5a50;
		background: transparent;
		border-color: #5a5a50;
	}

	.btn-modal-cancel:hover {
		background: rgba(90, 90, 80, 0.05);
	}

	.btn-modal-save {
		color: white;
		background: #2d5a4f;
		border-color: #2d5a4f;
	}

	.btn-modal-save:hover {
		background: #234a40;
		border-color: #234a40;
	}
</style>
