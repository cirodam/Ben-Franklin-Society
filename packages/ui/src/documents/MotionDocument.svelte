<script lang="ts">
	import type { MotionDocument, Provision } from '@bfs/types';
	import Document from './Document.svelte';

	let {
		motion,
		mode = 'view',
		onChange,
		readonly = false
	}: {
		motion: MotionDocument;
		mode?: 'view' | 'edit';
		onChange?: (updates: Partial<MotionDocument>) => void;
		readonly?: boolean;
	} = $props();

	// Local editable state
	let title = $state(motion.title);
	let provisions = $state<Provision[]>(structuredClone($state.snapshot(motion.content.provisions)));

	// Edit mode functions
	function handleTitleChange(e: Event) {
		title = (e.target as HTMLInputElement).value;
		emitChange();
	}

	function addProvision() {
		const nextNumber = (provisions.length + 1).toString();
		provisions = [...provisions, { number: nextNumber, text: '', title: '', reasoning: '' }];
		emitChange();
	}

	function removeProvision(index: number) {
		provisions = provisions.filter((_, i) => i !== index);
		// Renumber remaining provisions
		provisions = provisions.map((provision, i) => ({
			...provision,
			number: (i + 1).toString()
		}));
		emitChange();
	}

	function updateProvision(index: number, field: keyof Provision, value: string) {
		provisions = provisions.map((p, i) => 
			i === index ? { ...p, [field]: value } : p
		);
		emitChange();
	}

	function emitChange() {
		if (onChange) {
			onChange({
				title,
				content: {
					...motion.content,
					provisions
				}
			});
		}
	}

	const isEditMode = $derived(mode === 'edit' && !readonly);
</script>

<Document 
	documentId={motion.document_id || `#${motion.uuid.slice(0, 8)}`}
	title={isEditMode ? '' : title}
>
	{#snippet header()}
		{#if isEditMode}
			<input
				type="text"
				value={title}
				oninput={handleTitleChange}
				class="title-input"
				placeholder="Motion title"
			/>
		{/if}

		<div class="motion-meta">
			{#if motion.content.body_name}
				<div class="meta-row">
					<span class="meta-label">Body:</span>
					<span class="meta-value">{motion.content.body_name}</span>
				</div>
			{/if}
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
		</div>
	{/snippet}

	<div class="motion-body">
		<div class="provisions-section">
			{#each provisions as provision, provisionIdx}
				<div class="provision" class:provision--edit={isEditMode}>
					{#if isEditMode}
						<div class="provision-edit">
							<div class="provision-edit-header">
								<input
									type="text"
									value={provision.number}
									oninput={(e) => updateProvision(provisionIdx, 'number', (e.target as HTMLInputElement).value)}
									class="provision-number-input"
									placeholder="1"
								/>
								<input
									type="text"
									value={provision.title || ''}
									oninput={(e) => updateProvision(provisionIdx, 'title', (e.target as HTMLInputElement).value)}
									class="provision-title-input"
									placeholder="Provision title (optional)"
								/>
								<button
									type="button"
									class="btn-delete-provision"
									onclick={() => removeProvision(provisionIdx)}
									title="Delete provision"
								>
									×
								</button>
							</div>
							<textarea
								value={provision.text}
								oninput={(e) => updateProvision(provisionIdx, 'text', (e.target as HTMLTextAreaElement).value)}
								class="provision-text-input"
								placeholder="Provision text"
								rows="3"
							></textarea>
							<textarea
								value={provision.reasoning || ''}
								oninput={(e) => updateProvision(provisionIdx, 'reasoning', (e.target as HTMLTextAreaElement).value)}
								class="provision-reasoning-input"
								placeholder="Reasoning (optional)"
								rows="2"
							></textarea>
						</div>
					{:else}
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
					{/if}
				</div>
			{/each}

			{#if isEditMode}
				<button
					type="button"
					class="btn-add-provision"
					onclick={addProvision}
				>
					+ Add Provision
				</button>
			{/if}
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
	</div>
</Document>

<style>
	/* Title editing */
	.title-input {
		font-family: 'IM Fell English', serif;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 400;
		line-height: 1.15;
		color: #151c1a;
		margin: var(--space-8, 2rem) 0 var(--space-5, 1.25rem);
		text-align: center;
		letter-spacing: -0.01em;
		width: 100%;
		border: 2px dashed rgba(45, 90, 79, 0.2);
		background: rgba(255, 255, 255, 0.3);
		padding: var(--space-2, 0.5rem);
		border-radius: 4px;
	}

	.title-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.4);
		background: rgba(255, 255, 255, 0.6);
	}

	/* Motion metadata */
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

	/* Provisions */
	.provisions-section {
		margin-bottom: var(--space-8, 2rem);
	}

	.provision {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-4, 1rem);
		margin-bottom: var(--space-6, 1.5rem);
		padding-bottom: var(--space-6, 1.5rem);
		border-bottom: 1px solid rgba(45, 90, 79, 0.1);
	}

	.provision:last-child {
		border-bottom: none;
	}

	.provision--edit {
		grid-template-columns: 1fr;
		background: rgba(255, 255, 255, 0.3);
		padding: var(--space-4, 1rem);
		border: 2px dashed rgba(45, 90, 79, 0.15);
		border-radius: 4px;
	}

	/* View mode provision */
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

	/* Edit mode provision inputs */
	.provision-edit {
		display: flex;
		flex-direction: column;
		gap: var(--space-3, 0.75rem);
	}

	.provision-edit-header {
		display: flex;
		align-items: center;
		gap: var(--space-2, 0.5rem);
	}

	.provision-number-input {
		font-family: 'IM Fell English SC', serif;
		font-size: 1rem;
		font-weight: 600;
		width: 4rem;
		padding: var(--space-2, 0.5rem);
		border: 1px solid rgba(45, 90, 79, 0.25);
		background: white;
		border-radius: 4px;
		text-align: center;
	}

	.provision-number-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.5);
	}

	.provision-title-input {
		font-family: 'IM Fell English', serif;
		font-size: 1rem;
		font-weight: 600;
		flex: 1;
		padding: var(--space-2, 0.5rem);
		border: 1px solid rgba(45, 90, 79, 0.25);
		background: white;
		border-radius: 4px;
	}

	.provision-title-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.5);
	}

	.btn-delete-provision {
		width: 1.75rem;
		height: 1.75rem;
		border: 1px solid rgba(211, 47, 47, 0.3);
		background: white;
		color: #c62828;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1.25rem;
		line-height: 1;
		padding: 0;
		transition: all 0.15s;
	}

	.btn-delete-provision:hover {
		background: rgba(211, 47, 47, 0.1);
		border-color: #c62828;
	}

	.provision-text-input,
	.provision-reasoning-input {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1rem;
		line-height: 1.7;
		padding: var(--space-3, 0.75rem);
		border: 1px solid rgba(45, 90, 79, 0.25);
		background: white;
		border-radius: 4px;
		resize: vertical;
		width: 100%;
	}

	.provision-text-input:focus,
	.provision-reasoning-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.5);
	}

	.provision-reasoning-input {
		font-size: 0.9rem;
		color: #5a5a50;
		background: rgba(45, 90, 79, 0.02);
	}

	.btn-add-provision {
		display: block;
		margin: var(--space-6, 1.5rem) auto;
		padding: var(--space-3, 0.75rem) var(--space-5, 1.25rem);
		border: 2px dashed rgba(45, 90, 79, 0.3);
		background: rgba(255, 255, 255, 0.5);
		color: #2d5a4f;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.15s;
	}

	.btn-add-provision:hover {
		background: rgba(45, 90, 79, 0.05);
		border-color: #2d5a4f;
	}

	/* Signatures */
	.section-heading {
		font-family: 'IM Fell English', serif;
		font-size: 1.5rem;
		font-weight: 400;
		color: #2d2d28;
		margin: 0 0 var(--space-4, 1rem) 0;
	}

	.signatures-section {
		margin-bottom: var(--space-8, 2rem);
		padding-bottom: var(--space-8, 2rem);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.signatures-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-6, 1.5rem);
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

	/* Official notes */
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
		border: 1px solid rgba(45, 90, 79, 0.25);
		border-radius: 4px;
		padding: var(--space-3, 0.75rem);
		background: white;
		resize: vertical;
	}

	.form-textarea:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.5);
	}

	@media (max-width: 768px) {
		.provision--edit .provision-edit-header {
			flex-direction: column;
			align-items: stretch;
		}

		.provision-number-input {
			width: 100%;
		}

		.signature {
			flex-direction: column;
			gap: var(--space-2, 0.5rem);
		}
	}
</style>
	.