<script lang="ts">
	import { enhance } from '$app/forms';
	import type { MotionDocument, Provision } from '$lib/server/documents/library-types.js';
	import DocumentView from './DocumentView.svelte';

	let { 
		document: doc,
		canEdit = false,
		isCreating = false
	}: { 
		document: MotionDocument;
		canEdit?: boolean;
		isCreating?: boolean;
	} = $props();

	// Edit state - always track provisions if editable
	let editedTitle = $state(doc.title);
	let editedProvisions = $state([...doc.content.provisions]);
	let editedClerkNotes = $state(doc.content.clerk_notes || '');
	let editedParliamentarianNotes = $state(doc.content.parliamentarian_notes || '');
	let isSaving = $state(false);
	let hasChanges = $state(false);

	function addProvision() {
		const nextNumber = (editedProvisions.length + 1).toString();
		editedProvisions = [...editedProvisions, { number: nextNumber, text: '', reasoning: '' }];
		hasChanges = true;
	}

	function deleteProvision(index: number) {
		editedProvisions = editedProvisions.filter((_, i) => i !== index);
		// Renumber provisions
		editedProvisions = editedProvisions.map((p, i) => ({
			...p,
			number: (i + 1).toString()
		}));
		hasChanges = true;
	}

	function handleInput() {
		hasChanges = true;
	}
</script>

<DocumentView>
	{#snippet header()}
		<div class="document-title-block">
			<div class="document-letterhead">
				<div class="letterhead-body">The Ben Franklin Society</div>
				{#if !isCreating}
					<div class="letterhead-doc-number">
						{doc.document_id || `#${doc.uuid.slice(0, 8)}`}
					</div>
				{/if}
			</div>
			{#if isCreating}
				<input 
					type="text" 
					bind:value={editedTitle}
					oninput={handleInput}
					placeholder="Enter motion title..."
					class="document-title-input"
				/>
			{:else}
				<h1 class="document-title">{doc.title}</h1>
			{/if}
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
	{/snippet}

	{#snippet body()}
		<form 
			id="save-form"
			method="POST" 
			action={isCreating ? '' : '?/updateMotion'}
			use:enhance={() => {
				isSaving = true;
				return async ({ update, result }) => {
					await update();
					isSaving = false;
					if (result.type === 'success') {
						hasChanges = false;
						if (!isCreating) {
							window.location.reload();
						}
						// For creating, the server will redirect
					}
				};
			}}
		>
			<input type="hidden" name="title" value={editedTitle} />
			<input type="hidden" name="provisions" value={JSON.stringify(editedProvisions)} />
			<input type="hidden" name="clerk_notes" value={editedClerkNotes} />
			<input type="hidden" name="parliamentarian_notes" value={editedParliamentarianNotes} />
		</form>

		<div class="motion-body">
			<div class="provisions-section">
				{#each (canEdit ? editedProvisions : doc.content.provisions) as provision, index}
					<div class="provision" class:editable={canEdit}>
						<div class="provision-number">{provision.number}</div>
						<div class="provision-content">
							{#if canEdit}
								<input 
									type="text" 
									bind:value={provision.title}
									oninput={handleInput}
									placeholder="Provision title (optional)"
									class="provision-title-input"
								/>
								<textarea 
									bind:value={provision.text}
									oninput={handleInput}
									placeholder="Enter the text of this provision..."
									class="provision-text-input"
									rows="3"
								></textarea>
								<textarea 
									bind:value={provision.reasoning}
									oninput={handleInput}
									placeholder="Reasoning (optional)"
									class="provision-reasoning-input"
									rows="2"
								></textarea>
								<button 
									type="button" 
									class="delete-provision-btn" 
									onclick={() => { if (confirm('Remove this provision?')) deleteProvision(index); }}
									title="Remove provision"
								>
									Remove
								</button>
							{:else}
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
							{/if}
						</div>
					</div>
				{/each}

				{#if canEdit}
					<button type="button" class="add-provision-btn" onclick={addProvision}>
						+ Add Provision
					</button>
				{/if}
			</div>

			{#if !canEdit && doc.content.signatures && doc.content.signatures.length > 0}
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
						{#if canEdit}
							<textarea 
								bind:value={editedClerkNotes}
								oninput={handleInput}
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
						{#if canEdit}
							<textarea 
								bind:value={editedParliamentarianNotes}
								oninput={handleInput}
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

			{#if canEdit && (hasChanges || isCreating)}
				<div class="save-notice">
					<button 
						type="button" 
						class="save-btn" 
						onclick={() => document.getElementById('save-form')?.requestSubmit()} 
						disabled={isSaving}
					>
						{isSaving ? 'Saving...' : isCreating ? 'Create Motion' : 'Save Document'}
					</button>
				</div>
			{/if}
		</div>
	{/snippet}
</DocumentView>

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

	/* Document title input for creating new motions */
	.document-title-input {
		width: 100%;
		padding: var(--space-2) 0;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 2rem;
		font-weight: 400;
		text-align: center;
		color: #151c1a;
		background: transparent;
		border: none;
		border-bottom: 2px dotted rgba(122, 92, 26, 0.3);
		margin-bottom: var(--space-6);
		transition: all 0.2s ease;
	}

	.document-title-input:focus {
		outline: none;
		border-bottom-style: solid;
		border-bottom-color: #7a5c1a;
		background: rgba(255, 255, 255, 0.3);
	}

	.document-title-input::placeholder {
		color: rgba(122, 92, 26, 0.4);
		font-style: italic;
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

	.meta-value.status-enacted,
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

	/* Provisions */
	.provisions-section {
		margin-bottom: var(--space-8);
	}

	.provision {
		display: flex;
		gap: var(--space-4);
		margin-bottom: var(--space-8);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid rgba(45, 90, 79, 0.08);
	}

	.provision:last-of-type {
		border-bottom: none;
	}

	.provision-number {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-lg);
		font-weight: 600;
		color: #7a5c1a;
		min-width: 3rem;
		flex-shrink: 0;
		padding-top: 0.2rem;
	}

	.provision-content {
		flex: 1;
	}

	/* Editable provision fields - styled like filling in a form */
	.provision.editable {
		padding: var(--space-5);
		background: rgba(122, 92, 26, 0.02);
		border: 1px solid rgba(122, 92, 26, 0.1);
		border-bottom: 1px solid rgba(122, 92, 26, 0.1);
		border-radius: 2px;
		transition: all 0.15s ease;
	}

	.provision.editable:hover {
		background: rgba(122, 92, 26, 0.04);
		border-color: rgba(122, 92, 26, 0.2);
	}

	.provision-title-input,
	.provision-text-input,
	.provision-reasoning-input {
		width: 100%;
		font-family: 'Libre Baskerville', Georgia, serif;
		color: #151c1a;
		background: transparent;
		border: none;
		border-bottom: 1px dotted rgba(122, 92, 26, 0.3);
		padding: var(--space-2) 0;
		transition: all 0.2s ease;
	}

	.provision-title-input {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		font-weight: 600;
		color: #2d5a4f;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-3);
	}

	.provision-text-input {
		font-size: 1.0625rem;
		line-height: 1.75;
		resize: vertical;
		min-height: 3.5rem;
		margin-bottom: var(--space-3);
	}

	.provision-reasoning-input {
		font-size: var(--text-sm);
		font-style: italic;
		line-height: 1.6;
		color: #3c2f16;
		resize: vertical;
		min-height: 2.5rem;
		margin-bottom: var(--space-3);
	}

	.provision-title-input:focus,
	.provision-text-input:focus,
	.provision-reasoning-input:focus {
		outline: none;
		border-bottom-style: solid;
		border-bottom-color: #7a5c1a;
		background: rgba(255, 255, 255, 0.5);
	}

	.provision-title-input::placeholder,
	.provision-text-input::placeholder,
	.provision-reasoning-input::placeholder {
		color: rgba(122, 92, 26, 0.4);
		font-style: italic;
	}

	.delete-provision-btn {
		margin-top: var(--space-2);
		padding: var(--space-1) var(--space-3);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		letter-spacing: 0.05em;
		color: #b86c8b;
		background: transparent;
		border: 1px solid rgba(184, 108, 139, 0.3);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.delete-provision-btn:hover {
		background: rgba(184, 108, 139, 0.1);
		border-color: #b86c8b;
		color: #70284a;
	}

	.add-provision-btn {
		margin: var(--space-6) 0 var(--space-8) 3rem;
		padding: var(--space-2) var(--space-4);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.05em;
		color: #2d5a4f;
		background: transparent;
		border: 1px dashed rgba(45, 90, 79, 0.4);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-provision-btn:hover {
		background: rgba(45, 90, 79, 0.05);
		border-style: solid;
		border-color: #2d5a4f;
	}

	/* Read-only provision display */
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
		padding: var(--space-3) var(--space-4);
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
		margin-top: var(--space-12);
		padding-top: var(--space-8);
		border-top: 2px solid rgba(45, 90, 79, 0.3);
	}

	.section-heading {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
		margin: 0 0 var(--space-4);
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
		padding: var(--space-3);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		line-height: 1.6;
		color: #151c1a;
		border: none;
		border-bottom: 1px dotted rgba(45, 90, 79, 0.3);
		border-radius: 0;
		background: transparent;
		resize: vertical;
	}

	.form-textarea:focus {
		outline: none;
		border-bottom-style: solid;
		border-bottom-color: rgba(45, 90, 79, 0.6);
		background: rgba(255, 255, 255, 0.3);
	}

	.form-textarea::placeholder {
		color: #9a9a90;
		font-style: italic;
	}

	/* Save notice */
	.save-notice {
		position: sticky;
		bottom: 0;
		margin-top: var(--space-10);
		padding: var(--space-4);
		text-align: center;
		background: rgba(255, 255, 255, 0.95);
		border-top: 2px solid #2d5a4f;
		box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
	}

	.save-btn {
		padding: var(--space-3) var(--space-8);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: white;
		background: #2d5a4f;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(45, 90, 79, 0.2);
	}

	.save-btn:hover:not(:disabled) {
		background: #234a40;
		box-shadow: 0 4px 12px rgba(45, 90, 79, 0.3);
		transform: translateY(-1px);
	}

	.save-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
