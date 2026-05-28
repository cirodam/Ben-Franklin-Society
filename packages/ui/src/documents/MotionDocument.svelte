<script lang="ts">
	import type { MotionDocument, Provision } from '@bfs/types';
	import Button from '../Button.svelte';
	import Modal from '../Modal.svelte';

	let {
		motion,
		editable = false,
		onSave
	}: {
		motion: MotionDocument;
		editable?: boolean;
		onSave?: (updates: Partial<MotionDocument>) => void | Promise<void>;
	} = $props();

	// Edit state
	let isEditMode = $state(false);
	let editedTitle = $state(motion.title);
	let editedSlug = $state(motion.slug);
	let editedProvisions = $state<Provision[]>([...motion.content.provisions]);
	let editedClerkNotes = $state(motion.content.clerk_notes || '');
	let editedParliamentarianNotes = $state(motion.content.parliamentarian_notes || '');
	let isSaving = $state(false);

	// Modal state for editing provisions
	let showProvisionModal = $state(false);
	let editingProvisionIndex = $state<number | null>(null);
	let modalProvision = $state<Provision>({ number: '', text: '', reasoning: '' });

	function toggleEditMode() {
		isEditMode = !isEditMode;
		if (isEditMode) {
			editedTitle = motion.title;
			editedSlug = motion.slug;
			editedProvisions = [...motion.content.provisions];
			editedClerkNotes = motion.content.clerk_notes || '';
			editedParliamentarianNotes = motion.content.parliamentarian_notes || '';
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
			editedProvisions[editingProvisionIndex] = { ...modalProvision };
		} else {
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
	}

	async function handleSave() {
		if (onSave) {
			isSaving = true;
			try {
				await onSave({
					title: editedTitle,
					slug: editedSlug,
					content: {
						...motion.content,
						provisions: editedProvisions,
						clerk_notes: editedClerkNotes || undefined,
						parliamentarian_notes: editedParliamentarianNotes || undefined
					}
				});
				isEditMode = false;
			} finally {
				isSaving = false;
			}
		}
	}
</script>

<article class="document">
	<div class="document-header">
		<div class="document-title-block">
			<div class="document-letterhead">
				<div class="letterhead-body">The Ben Franklin Society</div>
				<div class="letterhead-doc-number">
					{motion.document_id || `#${motion.uuid.slice(0, 8)}`}
				</div>
			</div>
			{#if isEditMode}
				<input
					type="text"
					bind:value={editedTitle}
					class="document-title-input"
					placeholder="Motion Title"
				/>
			{:else}
				<h1 class="document-title">{motion.title}</h1>
			{/if}
		</div>

		<div class="motion-meta">
			<div class="meta-row">
				<span class="meta-label">Status:</span>
				<span class="meta-value status-{motion.content.status}">{motion.content.status}</span>
			</div>
			{#if motion.content.body_name}
				<div class="meta-row">
					<span class="meta-label">Body:</span>
					<span class="meta-value">{motion.content.body_name}</span>
				</div>
			{/if}
			{#if motion.content.status !== 'draft'}
				<div class="meta-row">
					<span class="meta-label">Introduced:</span>
					<span class="meta-value">
						{new Date(motion.created_at).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</span>
				</div>
			{/if}
		</div>

		{#if editable}
			<div class="edit-toolbar">
				{#if !isEditMode}
					<Button variant="secondary" size="sm" onclick={toggleEditMode}>
						Edit Motion
					</Button>
				{:else}
					<Button variant="secondary" size="sm" onclick={cancelEdit}>Cancel</Button>
					<Button variant="primary" size="sm" onclick={handleSave} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save Changes'}
					</Button>
				{/if}
			</div>
		{/if}
	</div>

	<div class="document-body">
		<div class="motion-body">
			<div class="provisions-section">
				{#if isEditMode}
					<div class="section-header">
						<h2 class="section-heading">Provisions</h2>
						<Button variant="secondary" size="sm" onclick={openNewProvisionModal}>
							+ Add Provision
						</Button>
					</div>
				{/if}

				{#each (isEditMode ? editedProvisions : motion.content.provisions) as provision, index}
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
								<button
									type="button"
									class="btn-edit-provision"
									onclick={() => openProvisionModal(index)}
								>
									Edit
								</button>
								<button
									type="button"
									class="btn-delete-provision"
									onclick={() => deleteProvision(index)}
								>
									Delete
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			{#if !isEditMode && motion.content.signatures && motion.content.signatures.length > 0}
				<div class="signatures-section">
					<h2 class="section-heading">Signatures</h2>
					<div class="signatures-list">
						{#each motion.content.signatures as signature}
							<div class="signature" style={signature.font ? `font-family: ${signature.font}` : ''}>
								<div class="signature-text">{signature.signature_text}</div>
								<div class="signature-date">
									{new Date(signature.signed_at).toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

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
						{:else if motion.content.clerk_notes}
							<div class="form-box-text">{motion.content.clerk_notes}</div>
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
						{:else if motion.content.parliamentarian_notes}
							<div class="form-box-text">{motion.content.parliamentarian_notes}</div>
						{:else}
							<div class="form-box-empty">No notes recorded.</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</article>

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
				placeholder="Rationale for this provision..."
				rows="4"
				class="modal-textarea"
			></textarea>
		</div>

		<div class="modal-actions">
			<Button variant="secondary" onclick={() => (showProvisionModal = false)}>Cancel</Button>
			<Button variant="primary" onclick={saveProvision}>
				{editingProvisionIndex !== null ? 'Save' : 'Add'}
			</Button>
		</div>
	</div>
</Modal>

<style>
	/* Document paper styling */
	.document {
		max-width: 1000px;
		margin: 0 auto;
		padding: var(--space-8);
		background: var(--paper, #fdfbf7);
		box-shadow: 
			0 2px 4px rgba(0, 0, 0, 0.06),
			0 8px 24px rgba(0, 0, 0, 0.10),
			0 24px 64px rgba(0, 0, 0, 0.14),
			0 48px 96px rgba(0, 0, 0, 0.08);
		position: relative;
		width: 100%;
		box-sizing: border-box;
	}

	.document::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: 
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 1.5rem,
				rgba(45, 90, 79, 0.02) 1.5rem,
				rgba(45, 90, 79, 0.02) calc(1.5rem + 1px)
			);
		pointer-events: none;
	}

	.document-header {
		padding: var(--space-10, 2.5rem);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
		position: relative;
		z-index: 1;
	}

	.document-body {
		padding: var(--space-10, 2.5rem);
		position: relative;
		z-index: 1;
	}

	.document-letterhead {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-4, 1rem);
		font-family: 'IM Fell English SC', serif;
	}

	.letterhead-body {
		font-size: var(--text-xs, 0.75rem);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	.letterhead-doc-number {
		font-size: var(--text-xs, 0.75rem);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	.document-title {
		font-family: 'IM Fell English', serif;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 400;
		line-height: 1.15;
		color: #151c1a;
		margin: var(--space-8, 2rem) 0 var(--space-5, 1.25rem);
		text-align: center;
		letter-spacing: -0.01em;
	}

	.document-title-input {
		font-family: 'IM Fell English', serif;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 400;
		line-height: 1.15;
		color: #151c1a;
		margin: var(--space-8, 2rem) 0 var(--space-5, 1.25rem);
		text-align: center;
		letter-spacing: -0.01em;
		width: 100%;
		border: 2px dashed rgba(45, 90, 79, 0.3);
		background: rgba(255, 255, 255, 0.5);
		padding: 0.5rem;
		border-radius: 4px;
	}

	.motion-meta {
		display: flex;
		flex-direction: column;
		gap: var(--space-2, 0.5rem);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm, 0.875rem);
		margin-top: var(--space-4, 1rem);
	}

	.meta-row {
		display: flex;
		gap: var(--space-2, 0.5rem);
	}

	.meta-label {
		font-weight: 600;
		font-style: italic;
		color: #5a5a50;
	}

	.meta-value {
		color: #2d2d28;
	}

	.meta-value.status-draft { color: #666; }
	.meta-value.status-introduced { color: #1565c0; }
	.meta-value.status-deliberation { color: #f57c00; }
	.meta-value.status-voting { color: #7b1fa2; }
	.meta-value.status-adopted { color: #2e7d32; }
	.meta-value.status-enacted { color: #1b5e20; }
	.meta-value.status-rejected { color: #c62828; }
	.meta-value.status-withdrawn { color: #757575; }

	.edit-toolbar {
		display: flex;
		gap: var(--space-3, 0.75rem);
		justify-content: center;
		margin-top: var(--space-6, 1.5rem);
		padding-top: var(--space-6, 1.5rem);
		border-top: 1px solid rgba(45, 90, 79, 0.1);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-6, 1.5rem);
	}

	.section-heading {
		font-family: 'IM Fell English', serif;
		font-size: 1.5rem;
		font-weight: 400;
		color: #2d2d28;
		margin: 0;
	}

	.provisions-section {
		margin-bottom: var(--space-8, 2rem);
	}

	.provision {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: var(--space-4, 1rem);
		margin-bottom: var(--space-6, 1.5rem);
		padding-bottom: var(--space-6, 1.5rem);
		border-bottom: 1px solid rgba(45, 90, 79, 0.1);
	}

	.provision:last-child {
		border-bottom: none;
	}

	.provision.edit-mode {
		background: rgba(255, 255, 255, 0.5);
		padding: var(--space-4, 1rem);
		border-radius: 4px;
		border: 1px solid rgba(45, 90, 79, 0.15);
	}

	.provision-number {
		font-family: 'IM Fell English SC', serif;
		font-size: 1.25rem;
		font-weight: 600;
		color: #7a5c1a;
		min-width: 3rem;
	}

	.provision-content {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base, 1rem);
		line-height: 1.7;
		color: #2d2d28;
	}

	.provision-title {
		font-family: 'IM Fell English', serif;
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 var(--space-3, 0.75rem) 0;
		color: #151c1a;
	}

	.provision-text {
		white-space: pre-wrap;
	}

	.provision-reasoning {
		margin-top: var(--space-4, 1rem);
		padding-left: var(--space-4, 1rem);
		border-left: 3px solid rgba(45, 90, 79, 0.2);
		font-size: 0.9rem;
		color: #5a5a50;
	}

	.reasoning-label {
		font-weight: 600;
		font-style: italic;
	}

	.provision-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-2, 0.5rem);
	}

	.btn-edit-provision,
	.btn-delete-provision {
		padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
		font-size: 0.875rem;
		border-radius: 4px;
		border: 1px solid;
		background: white;
		cursor: pointer;
		white-space: nowrap;
	}

	.btn-edit-provision {
		border-color: rgba(45, 90, 79, 0.3);
		color: #2d5a4f;
	}

	.btn-edit-provision:hover {
		background: rgba(45, 90, 79, 0.05);
	}

	.btn-delete-provision {
		border-color: rgba(211, 47, 47, 0.3);
		color: #c62828;
	}

	.btn-delete-provision:hover {
		background: rgba(211, 47, 47, 0.05);
	}

	.signatures-section {
		margin-top: var(--space-10, 2.5rem);
		padding-top: var(--space-8, 2rem);
		border-top: 2px solid rgba(45, 90, 79, 0.15);
	}

	.signatures-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-6, 1.5rem);
		margin-top: var(--space-6, 1.5rem);
	}

	.signature {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: var(--space-4, 1rem);
		border-bottom: 1px solid rgba(45, 90, 79, 0.2);
	}

	.signature-text {
		font-size: 1.5rem;
		color: #2d2d28;
	}

	.signature-date {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 0.875rem;
		color: #5a5a50;
	}

	.official-notes-section {
		margin-top: var(--space-10, 2.5rem);
		display: grid;
		gap: var(--space-6, 1.5rem);
	}

	.form-box {
		border: 2px solid rgba(45, 90, 79, 0.2);
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.3);
	}

	.form-box-header {
		padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
		border-bottom: 1px solid rgba(45, 90, 79, 0.2);
		background: rgba(45, 90, 79, 0.05);
	}

	.form-box-label {
		font-family: 'IM Fell English SC', serif;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #2d5a4f;
		font-weight: 600;
	}

	.form-box-content {
		padding: var(--space-4, 1rem);
		min-height: 4rem;
	}

	.form-box-text {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 0.9rem;
		line-height: 1.6;
		color: #2d2d28;
		white-space: pre-wrap;
	}

	.form-box-empty {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 0.875rem;
		color: #999;
		font-style: italic;
	}

	.form-textarea {
		width: 100%;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 0.9rem;
		line-height: 1.6;
		color: #2d2d28;
		border: 1px solid rgba(45, 90, 79, 0.2);
		border-radius: 4px;
		padding: var(--space-3, 0.75rem);
		background: white;
		resize: vertical;
	}

	/* Modal styling */
	.modal-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4, 1rem);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2, 0.5rem);
	}

	.form-group label {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 0.875rem;
		font-weight: 600;
		color: #2d2d28;
	}

	.modal-input,
	.modal-textarea {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1rem;
		padding: var(--space-3, 0.75rem);
		border: 1px solid rgba(45, 90, 79, 0.3);
		border-radius: 4px;
		background: white;
	}

	.modal-textarea {
		resize: vertical;
	}

	.modal-actions {
		display: flex;
		gap: var(--space-3, 0.75rem);
		justify-content: flex-end;
		margin-top: var(--space-4, 1rem);
		padding-top: var(--space-4, 1rem);
		border-top: 1px solid rgba(45, 90, 79, 0.1);
	}

	@media (max-width: 768px) {
		.document {
			padding: var(--space-4, 1rem);
		}

		.document-header,
		.document-body {
			padding: var(--space-6, 1.5rem);
		}

		.provision {
			grid-template-columns: 1fr;
			gap: var(--space-3, 0.75rem);
		}

		.provision-actions {
			flex-direction: row;
		}
	}
</style>
