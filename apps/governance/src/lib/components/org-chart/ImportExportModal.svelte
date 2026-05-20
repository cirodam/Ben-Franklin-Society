<script lang="ts">
	interface Props {
		show: boolean;
		onClose: () => void;
	}

	let { show, onClose }: Props = $props();

	let importJson = $state('');
	let importError = $state('');

	async function handleImport(associationUuid: string) {
		try {
			const data = JSON.parse(importJson);

			const response = await fetch(`/api/org-charts/${associationUuid}/import`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Import failed');
			}

			window.location.reload();
		} catch (error) {
			importError = error instanceof Error ? error.message : 'Invalid JSON';
		}
	}

	function handleClose() {
		importJson = '';
		importError = '';
		onClose();
	}
</script>

{#if show}
	<div class="modal-overlay" onclick={handleClose}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Import Organization Chart</h3>
				<button class="btn-close" onclick={handleClose}>×</button>
			</div>
			<div class="modal-body">
				<p class="modal-description">
					Paste your organization chart JSON below. This will create roles, sections, and templates.
				</p>
				<textarea
					bind:value={importJson}
					placeholder="Paste JSON here..."
					rows="15"
					class="import-textarea"
				></textarea>
				{#if importError}
					<div class="import-error">{importError}</div>
				{/if}
				<div class="modal-actions">
					<button class="btn btn-primary" onclick={() => handleImport('')}>Import</button>
					<button class="btn" onclick={handleClose}>Cancel</button>
				</div>
			</div>
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

	.modal {
		background: var(--paper);
		max-width: 600px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
		border: 1px solid var(--border-strong);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-4);
		border-bottom: 1px solid var(--border);
	}

	.modal-header h3 {
		font-family: 'IM Fell English', serif;
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 400;
		color: var(--ink);
	}

	.btn-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--gold);
	}

	.btn-close:hover {
		color: var(--gold-hover);
	}

	.modal-body {
		padding: var(--space-4);
	}

	.modal-description {
		margin: 0 0 var(--space-3) 0;
		color: var(--ink-mid);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
	}

	.import-textarea {
		width: 100%;
		padding: var(--space-2);
		border: 1px solid var(--border);
		font-family: monospace;
		font-size: var(--text-xs);
		background: var(--paper);
		resize: vertical;
	}

	.import-error {
		margin: var(--space-2) 0;
		padding: var(--space-3);
		background: #fee;
		border-left: 2px solid #dc2626;
		color: #dc2626;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
	}

	.modal-actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-3);
		justify-content: flex-end;
	}

	.btn {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--border);
		background: rgba(250, 250, 247, 0.5);
		cursor: pointer;
		font-size: var(--text-sm);
		font-family: 'Libre Baskerville', Georgia, serif;
		color: var(--ink);
	}

	.btn:hover {
		background: var(--paper);
		border-color: var(--gold);
	}

	.btn-primary {
		background: var(--gold);
		color: white;
		border-color: var(--gold);
	}

	.btn-primary:hover {
		background: var(--gold-hover);
		border-color: var(--gold-hover);
	}
</style>
