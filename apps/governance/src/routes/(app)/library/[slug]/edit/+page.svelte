<script lang="ts">
	import { PageHeader } from '@bfs/ui';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const doc = data.document;
	const docType = data.documentType;
	
	// Prose document state
	let title = $state(doc.title);
	let status = $state(doc.content.status);
	
	let paragraphs = $state(docType === 'prose' ? [...doc.content.paragraphs] : []);
	let summary = $state(docType === 'prose' && doc.content.summary ? doc.content.summary : '');
	let tags = $state(docType === 'prose' && doc.content.tags ? doc.content.tags.join(', ') : '');
	
	// Contract state
	let body = $state(docType === 'contract' ? doc.content.body : '');
	let partyAName = $state(docType === 'contract' ? doc.content.party_a.principal_name : '');
	let partyARole = $state(docType === 'contract' ? doc.content.party_a.role : '');
	let partyAUuid = $state(docType === 'contract' ? doc.content.party_a.principal_uuid : '');
	let partyBName = $state(docType === 'contract' ? doc.content.party_b.principal_name : '');
	let partyBRole = $state(docType === 'contract' ? doc.content.party_b.role : '');
	let partyBUuid = $state(docType === 'contract' ? doc.content.party_b.principal_uuid : '');
	let effectiveDate = $state(docType === 'contract' && doc.content.effective_date ? doc.content.effective_date.slice(0, 10) : '');
	let expiryDate = $state(docType === 'contract' && doc.content.expiry_date ? doc.content.expiry_date.slice(0, 10) : '');
	
	function addParagraph() {
		paragraphs = [...paragraphs, ''];
	}
	
	function removeParagraph(index: number) {
		paragraphs = paragraphs.filter((_, i) => i !== index);
	}
	
	function moveParagraphUp(index: number) {
		if (index === 0) return;
		const temp = paragraphs[index];
		paragraphs[index] = paragraphs[index - 1];
		paragraphs[index - 1] = temp;
		paragraphs = [...paragraphs];
	}
	
	function moveParagraphDown(index: number) {
		if (index === paragraphs.length - 1) return;
		const temp = paragraphs[index];
		paragraphs[index] = paragraphs[index + 1];
		paragraphs[index + 1] = temp;
		paragraphs = [...paragraphs];
	}
</script>

<div class="page">
	<PageHeader 
		title="Edit Document"
		description="Edit {doc.title}"
	/>

	<form method="POST" action="?/save" use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				goto(`/library/${doc.slug}`);
			}
		};
	}}>
		{#if docType === 'prose'}
			<input type="hidden" name="paragraphs" value={JSON.stringify(paragraphs)} />
		{/if}
		
		<div class="form-section">
			<h2>Document Metadata</h2>
			
			<div class="form-group">
				<label for="title">Title</label>
				<input 
					id="title"
					name="title" 
					type="text" 
					bind:value={title}
					required
				/>
			</div>
			
			<div class="form-row">
				<div class="form-group">
					<label for="status">Status</label>
					{#if docType === 'prose'}
						<select id="status" name="status" bind:value={status}>
							<option value="draft">Draft</option>
							<option value="published">Published</option>
							<option value="archived">Archived</option>
						</select>
					{:else if docType === 'contract'}
						<select id="status" name="status" bind:value={status}>
							<option value="draft">Draft</option>
							<option value="active">Active</option>
							<option value="completed">Completed</option>
							<option value="terminated">Terminated</option>
						</select>
					{/if}
				</div>
			</div>
			
			{#if docType === 'prose'}
				<div class="form-group">
					<label for="summary">Summary (optional)</label>
					<textarea 
						id="summary"
						name="summary" 
						bind:value={summary}
						rows="2"
						placeholder="Brief summary of the document..."
					/>
				</div>
				
				<div class="form-group">
					<label for="tags">Tags (optional, comma-separated)</label>
					<input 
						id="tags"
						name="tags" 
						type="text" 
						bind:value={tags}
						placeholder="tag1, tag2, tag3"
					/>
				</div>
			{/if}
		</div>

		{#if docType === 'contract'}
			<div class="form-section">
				<h2>Parties</h2>
				
				<div class="party-section">
					<h3>Party A</h3>
					<div class="form-group">
						<label for="party_a_name">Name</label>
						<input 
							id="party_a_name"
							name="party_a_name" 
							type="text" 
							bind:value={partyAName}
							placeholder="Person or association name"
						/>
					</div>
					<div class="form-group">
						<label for="party_a_role">Role</label>
						<input 
							id="party_a_role"
							name="party_a_role" 
							type="text" 
							bind:value={partyARole}
							placeholder="e.g., buyer, seller, guarantor"
						/>
					</div>
					<div class="form-group">
						<label for="party_a_uuid">UUID (optional)</label>
						<input 
							id="party_a_uuid"
							name="party_a_uuid" 
							type="text" 
							bind:value={partyAUuid}
							placeholder="Principal UUID"
						/>
					</div>
				</div>

				<div class="party-section">
					<h3>Party B</h3>
					<div class="form-group">
						<label for="party_b_name">Name</label>
						<input 
							id="party_b_name"
							name="party_b_name" 
							type="text" 
							bind:value={partyBName}
							placeholder="Person or association name"
						/>
					</div>
					<div class="form-group">
						<label for="party_b_role">Role</label>
						<input 
							id="party_b_role"
							name="party_b_role" 
							type="text" 
							bind:value={partyBRole}
							placeholder="e.g., buyer, seller, guarantor"
						/>
					</div>
					<div class="form-group">
						<label for="party_b_uuid">UUID (optional)</label>
						<input 
							id="party_b_uuid"
							name="party_b_uuid" 
							type="text" 
							bind:value={partyBUuid}
							placeholder="Principal UUID"
						/>
					</div>
				</div>
			</div>

			<div class="form-section">
				<h2>Dates</h2>
				<div class="form-row">
					<div class="form-group">
						<label for="effective_date">Effective Date (optional)</label>
						<input 
							id="effective_date"
							name="effective_date" 
							type="date" 
							bind:value={effectiveDate}
						/>
					</div>
					<div class="form-group">
						<label for="expiry_date">Expiry Date (optional)</label>
						<input 
							id="expiry_date"
							name="expiry_date" 
							type="date" 
							bind:value={expiryDate}
						/>
					</div>
				</div>
			</div>

			<div class="form-section">
				<h2>Contract Text</h2>
				<div class="form-group">
					<textarea 
						name="body"
						bind:value={body}
						rows="15"
						placeholder="Enter the full text of the contract agreement..."
					/>
				</div>
			</div>
		{:else if docType === 'prose'}
			<div class="form-section">
				<div class="section-header">
					<h2>Content</h2>
					<button type="button" class="btn btn--secondary" onclick={addParagraph}>
						+ Add Paragraph
					</button>
				</div>
				
				<div class="paragraphs">
					{#each paragraphs as paragraph, index}
						<div class="paragraph-editor">
							<div class="paragraph-toolbar">
								<span class="paragraph-number">Paragraph {index + 1}</span>
								<div class="paragraph-actions">
									<button 
										type="button" 
										class="icon-btn" 
										onclick={() => moveParagraphUp(index)}
										disabled={index === 0}
										title="Move up"
									>
										↑
									</button>
									<button 
										type="button" 
										class="icon-btn" 
										onclick={() => moveParagraphDown(index)}
										disabled={index === paragraphs.length - 1}
										title="Move down"
									>
										↓
									</button>
									<button 
										type="button" 
										class="icon-btn icon-btn--danger" 
										onclick={() => removeParagraph(index)}
										disabled={paragraphs.length === 1}
										title="Delete"
									>
										×
									</button>
								</div>
							</div>
							<textarea 
								bind:value={paragraphs[index]}
								rows="4"
								placeholder="Enter paragraph text..."
							/>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="form-actions">
			<button type="button" class="btn" onclick={() => goto(`/library/${doc.slug}`)}>
				Cancel
			</button>
			<button type="submit" class="btn btn--primary">
				Save Changes
			</button>
		</div>
	</form>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 900px;
		margin: 0 auto;
		padding-bottom: var(--space-8);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form-section {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}

	.form-section h2 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-lg);
		color: var(--color-text);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
	}

	.section-header h2 {
		margin: 0;
	}

	.form-group {
		margin-bottom: var(--space-4);
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	.form-group label {
		display: block;
		margin-bottom: var(--space-2);
		font-weight: var(--weight-medium);
		color: var(--color-text);
		font-size: var(--text-sm);
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		font-size: var(--text-base);
		font-family: inherit;
	}

	.form-group textarea {
		resize: vertical;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-primary, #3b82f6);
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
	}

	.paragraphs {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.paragraph-editor {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.paragraph-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) var(--space-3);
		background: var(--color-background);
		border-bottom: 1px solid var(--color-border);
	}

	.paragraph-number {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
	}

	.paragraph-actions {
		display: flex;
		gap: var(--space-1);
	}

	.paragraph-editor textarea {
		width: 100%;
		border: none;
		border-radius: 0;
		padding: var(--space-3);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding-top: var(--space-4);
	}

	.btn {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn:hover {
		background: var(--color-background);
	}

	.btn--primary {
		background: var(--color-primary, #3b82f6);
		color: white;
		border-color: var(--color-primary, #3b82f6);
	}

	.btn--primary:hover {
		background: var(--color-primary-dark, #2563eb);
	}

	.btn--secondary {
		background: var(--color-background);
	}

	.icon-btn {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--text-base);
		line-height: 1;
		cursor: pointer;
		transition: all 0.15s;
	}

	.icon-btn:hover:not(:disabled) {
		background: var(--color-background);
	}

	.icon-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.icon-btn--danger {
		color: #dc2626;
		font-size: var(--text-xl);
	}

	.icon-btn--danger:hover:not(:disabled) {
		background: #fee2e2;
		border-color: #fca5a5;
	}

	.party-section {
		padding: var(--space-4);
		background: rgba(91, 140, 184, 0.05);
		border: 1px solid rgba(91, 140, 184, 0.2);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-4);
	}

	.party-section h3 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-lg);
		color: var(--color-text);
	}
</style>
