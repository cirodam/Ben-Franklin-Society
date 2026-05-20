<script lang="ts">
	import { enhance } from '$app/forms';
	import type { MotionDocument } from '$lib/server/documents/library-types.js';
	import DocumentView from './DocumentView.svelte';

	let { 
		document: doc,
		canEdit = false 
	}: { 
		document: MotionDocument;
		canEdit?: boolean;
	} = $props();

	const statusVariant: Record<string, string> = {
		draft:        'status--draft',
		introduced:   'status--introduced',
		deliberation: 'status--deliberation',
		enacted:      'status--enacted',
		rejected:     'status--rejected',
		withdrawn:    'status--withdrawn',
	};

	// Edit state
	let isEditing = $state(false);
	let editedProvisions = $state([...doc.content.provisions]);
	let editedReasoning = $state(doc.content.reasoning || '');
	let isSaving = $state(false);

	function startEditing() {
		isEditing = true;
		editedProvisions = [...doc.content.provisions];
		editedReasoning = doc.content.reasoning || '';
	}

	function cancelEditing() {
		isEditing = false;
	}

	function addProvision() {
		const nextNumber = (editedProvisions.length + 1).toString();
		editedProvisions = [...editedProvisions, { number: nextNumber, text: '' }];
	}

	function removeProvision(index: number) {
		editedProvisions = editedProvisions.filter((_, i) => i !== index);
		// Renumber provisions
		editedProvisions = editedProvisions.map((p, i) => ({
			...p,
			number: (i + 1).toString()
		}));
	}
</script>

<DocumentView>
	{#snippet header()}
		<div class="document-title-block">
			<div class="motion-letterhead">
				<div class="letterhead-body">The Ben Franklin Society</div>
				<div class="letterhead-motion-number">
					{doc.document_id || `#${doc.uuid.slice(0, 8)}`}
				</div>
			</div>
			<h1 class="document-title">{doc.title}</h1>
			<div class="document-meta">
				<span class="type-badge">Motion</span>
				<span class="status-badge {statusVariant[doc.content.status] ?? ''}">
					{doc.content.status}
				</span>
			</div>
		</div>
		<div class="motion-meta">
			<div class="meta-row">
				<span class="meta-label">Introduced:</span>
				<span class="meta-value">{new Date(doc.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
			</div>
		</div>
		
		{#if canEdit && !isEditing}
			<div class="edit-toolbar">
				<button type="button" class="btn-edit" onclick={startEditing}>
					Edit Motion
				</button>
			</div>
		{/if}
	{/snippet}

	{#snippet body()}
		{#if isEditing}
			<form 
				method="POST" 
				action="?/updateMotion"
				use:enhance={() => {
					isSaving = true;
					return async ({ update, result }) => {
						await update();
						isSaving = false;
						if (result.type === 'success') {
							isEditing = false;
							// Reload page to get updated data
							window.location.reload();
						}
					};
				}}
			>
				<input type="hidden" name="provisions" value={JSON.stringify(editedProvisions)} />
				<input type="hidden" name="reasoning" bind:value={editedReasoning} />
				
				<div class="motion-body">
					<div class="provisions-section">
						<div class="section-header">
							<h2 class="section-heading">Provisions</h2>
							<button type="button" class="btn-add" onclick={addProvision}>
								+ Add Provision
							</button>
						</div>
						
						{#each editedProvisions as provision, index}
							<div class="provision edit-mode">
								<div class="provision-number-edit">
									<input 
										type="text" 
										bind:value={provision.number}
										class="input-number"
										placeholder="#"
									/>
								</div>
								<div class="provision-content">
									<input 
										type="text" 
										bind:value={provision.title}
										class="input-title"
										placeholder="Provision title (optional)"
									/>
									<textarea 
										bind:value={provision.text}
										class="input-text"
										placeholder="Provision text"
										rows="3"
									></textarea>
								</div>
								<button 
									type="button" 
									class="btn-remove" 
									onclick={() => removeProvision(index)}
									title="Remove provision"
								>
									×
								</button>
							</div>
						{/each}
					</div>

					<div class="reasoning-section">
						<h2 class="section-heading">Reasoning</h2>
						<textarea 
							bind:value={editedReasoning}
							class="input-reasoning"
							placeholder="Explain the reasoning behind this motion..."
							rows="5"
						></textarea>
					</div>

					<div class="edit-actions">
						<button type="button" class="btn-cancel" onclick={cancelEditing} disabled={isSaving}>
							Cancel
						</button>
						<button type="submit" class="btn-save" disabled={isSaving}>
							{isSaving ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</div>
			</form>
		{:else}
			<div class="motion-body">
				<div class="provisions-section">
					{#each doc.content.provisions as provision}
						<div class="provision">
							<div class="provision-number">{provision.number}</div>
							<div class="provision-content">
								{#if provision.title}
									<h3 class="provision-title">{provision.title}</h3>
								{/if}
								<div class="provision-text">{provision.text}</div>
							</div>
						</div>
					{/each}
				</div>

				{#if doc.content.reasoning}
					<div class="reasoning-section">
						<h2 class="section-heading">Reasoning</h2>
						<div class="section-text">{doc.content.reasoning}</div>
					</div>
				{/if}

				{#if doc.content.signatures && doc.content.signatures.length > 0}
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

				{#if doc.content.clerk_notes}
					<div class="clerk-annotation">
						<div class="annotation-stamp">Clerk</div>
						<div class="annotation-content">
							<div class="annotation-heading">Administrative Notes</div>
							<div class="annotation-text">{doc.content.clerk_notes}</div>
						</div>
					</div>
				{/if}

				{#if doc.content.parliamentarian_notes}
					<div class="parliamentarian-annotation">
						<div class="annotation-stamp">Parliamentarian</div>
						<div class="annotation-content">
							<div class="annotation-heading">Procedural Notes</div>
							<div class="annotation-text">{doc.content.parliamentarian_notes}</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{/snippet}
</DocumentView>

<style>
	.motion-letterhead {
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

	.letterhead-motion-number {
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

	/* Official Annotations */
	.clerk-annotation,
	.parliamentarian-annotation {
		margin-top: var(--space-10);
		position: relative;
		border: 2px solid;
		border-radius: 3px;
		padding: var(--space-6);
		background: rgba(255, 255, 255, 0.6);
	}

	.clerk-annotation {
		border-color: #5b8cb8;
		background: rgba(91, 140, 184, 0.05);
	}

	.parliamentarian-annotation {
		border-color: #b86c8b;
		background: rgba(184, 108, 139, 0.05);
	}

	.annotation-stamp {
		position: absolute;
		top: -0.75rem;
		left: var(--space-4);
		padding: 0 var(--space-2);
		background: var(--paper);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: inherit;
	}

	.clerk-annotation .annotation-stamp {
		color: #1e3a5f;
	}

	.parliamentarian-annotation .annotation-stamp {
		color: #70284a;
	}

	.annotation-heading {
		font-size: var(--text-sm);
		font-weight: 600;
		margin-bottom: var(--space-2);
		color: inherit;
	}

	.clerk-annotation .annotation-heading {
		color: #1e3a5f;
	}

	.parliamentarian-annotation .annotation-heading {
		color: #70284a;
	}

	.annotation-text {
		font-size: var(--text-sm);
		line-height: 1.6;
		white-space: pre-wrap;
		color: #151c1a;
	}

	/* Status variants for motions */
	.status--introduced {
		background: rgba(33, 150, 243, 0.15);
		color: #1565c0;
	}

	.status--deliberation {
		background: rgba(255, 152, 0, 0.15);
		color: #e65100;
	}

	/* Edit Mode */
	.edit-toolbar {
		display: flex;
		justify-content: center;
		margin-top: var(--space-6);
		padding-top: var(--space-4);
		border-top: 1px solid rgba(45, 90, 79, 0.15);
	}

	.btn-edit {
		padding: var(--space-2) var(--space-5);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #7a5c1a;
		background: transparent;
		border: 1px solid #7a5c1a;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-edit:hover {
		background: rgba(122, 92, 26, 0.05);
		border-color: #5a4515;
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
		background: rgba(255, 255, 255, 0.5);
		border-radius: 2px;
	}

	.provision-number-edit {
		min-width: 3rem;
	}

	.input-number {
		width: 100%;
		padding: var(--space-1) var(--space-2);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		font-weight: 600;
		color: #7a5c1a;
		background: transparent;
		border: 1px solid rgba(122, 92, 26, 0.3);
		border-radius: 2px;
	}

	.input-title {
		width: 100%;
		padding: var(--space-2);
		margin-bottom: var(--space-2);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		font-weight: 600;
		color: #2d5a4f;
		background: transparent;
		border: 1px solid rgba(45, 90, 79, 0.2);
		border-radius: 2px;
	}

	.input-text {
		width: 100%;
		padding: var(--space-2);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.0625rem;
		line-height: 1.75;
		color: #151c1a;
		background: transparent;
		border: 1px solid rgba(45, 90, 79, 0.2);
		border-radius: 2px;
		resize: vertical;
		min-height: 80px;
	}

	.input-reasoning {
		width: 100%;
		padding: var(--space-3);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		line-height: 1.75;
		color: #3c2f16;
		background: rgba(255, 255, 255, 0.5);
		border: 1px solid rgba(45, 90, 79, 0.2);
		border-radius: 2px;
		resize: vertical;
		min-height: 120px;
	}

	.input-number:focus,
	.input-title:focus,
	.input-text:focus,
	.input-reasoning:focus {
		outline: none;
		border-color: #7a5c1a;
		background: rgba(255, 255, 255, 0.8);
	}

	.btn-remove {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		width: 24px;
		height: 24px;
		padding: 0;
		font-size: 20px;
		line-height: 1;
		color: #b86c8b;
		background: transparent;
		border: 1px solid #b86c8b;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-remove:hover {
		background: rgba(184, 108, 139, 0.1);
		color: #70284a;
		border-color: #70284a;
	}

	.edit-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		margin-top: var(--space-6);
		padding-top: var(--space-6);
		border-top: 1px solid rgba(45, 90, 79, 0.2);
	}

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
</style>
