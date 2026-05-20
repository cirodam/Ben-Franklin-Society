<script lang="ts">
	import { enhance } from '$app/forms';
	import { documentTypes } from '$lib/documents';
	import type { Person } from '$lib/server/documents/library-types.js';

	interface Props {
		open: boolean;
		person: Person | undefined;
		onClose: () => void;
	}

	let { open = $bindable(), person, onClose }: Props = $props();

	let newDocTitle = $state('');
	let newDocType = $state('prose');
	let activeTab = $state<'create' | 'upload'>('create');
	let selectedFile = $state<File | null>(null);

	const allTypes = documentTypes.getAllTypes();

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		selectedFile = input.files?.[0] || null;
	}
</script>

{#if open}
	<div class="modal-overlay">
		<button 
			class="modal-backdrop" 
			onclick={onClose}
			aria-label="Close dialog"
		></button>
		<div class="modal">
			<h2>Add Document</h2>
			
			<div class="tabs">
				<button 
					class="tab" 
					class:active={activeTab === 'create'}
					onclick={() => activeTab = 'create'}
				>
					Create New
				</button>
				<button 
					class="tab" 
					class:active={activeTab === 'upload'}
					onclick={() => activeTab = 'upload'}
				>
					Upload JSON
				</button>
			</div>

			{#if activeTab === 'create'}
				<form method="POST" action="?/create" use:enhance>
					<div class="form-group">
						<label for="title">Title</label>
						<input 
							id="title"
							name="title" 
							type="text" 
							bind:value={newDocTitle}
							placeholder="Enter document title..."
							required
						/>
					</div>
					
					<div class="form-group">
						<label for="type">Type</label>
						<select id="type" name="type" bind:value={newDocType}>
							{#each allTypes as type}
								{@const typeConfig = documentTypes.get(type)}
								{#if typeConfig && (!typeConfig.canCreate || typeConfig.canCreate(person))}
									<option value={type}>{typeConfig.icon} {typeConfig.label}</option>
								{/if}
							{/each}
						</select>
					</div>
					
					<div class="modal-actions">
						<button type="button" class="btn" onclick={onClose}>
							Cancel
						</button>
						<button type="submit" class="btn btn--primary">
							Create
						</button>
					</div>
				</form>
			{:else}
				<form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance>
					<div class="form-group">
						<label for="file">JSON File</label>
						<input 
							id="file"
							name="file" 
							type="file" 
							accept=".json"
							onchange={handleFileChange}
							required
						/>
						{#if selectedFile}
							<p class="file-info">{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</p>
						{/if}
					</div>
					
					<div class="info-box">
						<p>Document Upload</p>
						<ul>
							<li>Upload a valid JSON document file</li>
							<li>Required fields: type, title, content</li>
							<li>A fresh UUID and slug will be generated</li>
							<li>Existing document_id will be preserved</li>
							<li>You will be listed as owner</li>
						</ul>
					</div>
					
					<div class="modal-actions">
						<button type="button" class="btn" onclick={onClose}>
							Cancel
						</button>
						<button type="submit" class="btn btn--primary" disabled={!selectedFile}>
							Upload
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-backdrop {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: transparent;
		border: none;
		cursor: pointer;
	}

	.modal {
		position: relative;
		background: var(--paper);
		border: 2px solid var(--border);
		border-radius: 0;
		padding: var(--space-8);
		max-width: 500px;
		width: 90%;
		z-index: 1001;
		box-shadow: var(--shadow-elevated);
	}

	.modal h2 {
		margin: 0 0 var(--space-6) 0;
		font-family: 'IM Fell English', serif;
		font-size: var(--text-2xl);
		font-weight: 400;
		color: var(--ink);
		text-align: center;
		letter-spacing: -0.01em;
	}

	.tabs {
		display: flex;
		gap: 0;
		margin-bottom: var(--space-6);
		border-bottom: 2px solid var(--border-subtle);
	}

	.tab {
		flex: 1;
		padding: var(--space-3) var(--space-4);
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		cursor: pointer;
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.12em;
		color: var(--ink-faint);
		transition: all 0.2s;
		text-transform: lowercase;
	}

	.tab:hover {
		color: var(--ink-mid);
		background: var(--tint-gold);
	}

	.tab.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
		background: transparent;
	}

	.form-group {
		margin-bottom: var(--space-5);
	}

	.form-group label {
		display: block;
		margin-bottom: var(--space-2);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.12em;
		color: var(--ink-mid);
		text-transform: lowercase;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid var(--border);
		border-radius: 0;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: var(--ink);
		background: var(--paper);
		transition: border-color 0.2s;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: var(--accent);
	}

	.form-group input::placeholder {
		color: var(--ink-faint);
		opacity: 1;
	}

	.form-group input[type="file"] {
		padding: var(--space-2);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		cursor: pointer;
	}

	.file-info {
		margin-top: var(--space-2);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-mid);
		font-style: italic;
	}

	.info-box {
		margin: var(--space-4) 0;
		padding: var(--space-4);
		background: var(--tint-green);
		border: 1px solid var(--border-subtle);
		border-radius: 0;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
	}

	.info-box p {
		margin: 0 0 var(--space-2) 0;
		font-weight: 600;
		color: var(--ink);
	}

	.info-box ul {
		margin: 0;
		padding-left: var(--space-5);
		color: var(--ink-mid);
		line-height: 1.6;
	}

	.info-box li {
		margin-bottom: var(--space-1);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		margin-top: var(--space-6);
		padding-top: var(--space-5);
		border-top: 1px solid var(--border-subtle);
	}

	.btn {
		padding: 0.625rem var(--space-5);
		border: 1px solid var(--border);
		border-radius: 0;
		background: var(--paper);
		cursor: pointer;
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.12em;
		text-transform: lowercase;
		color: var(--ink);
		transition: all 0.2s;
	}

	.btn:hover:not(:disabled) {
		background: var(--tint-gold);
		border-color: var(--border-strong);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn--primary {
		background: var(--accent);
		color: var(--paper);
		border-color: var(--accent);
	}

	.btn--primary:hover:not(:disabled) {
		background: var(--accent-mid);
		border-color: var(--accent-mid);
	}
</style>
