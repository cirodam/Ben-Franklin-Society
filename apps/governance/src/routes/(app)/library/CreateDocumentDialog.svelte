<script lang="ts">
	import { enhance } from '$app/forms';
	import { documentTypes } from '$lib/document-types';
	import type { Person } from '$lib/server/library-types.js';

	interface Props {
		open: boolean;
		person: Person | undefined;
		onClose: () => void;
	}

	let { open = $bindable(), person, onClose }: Props = $props();

	let newDocTitle = $state('');
	let newDocType = $state('prose');

	const allTypes = documentTypes.getAllTypes();
</script>

{#if open}
	<div class="modal-overlay">
		<button 
			class="modal-backdrop" 
			onclick={onClose}
			aria-label="Close dialog"
		></button>
		<div class="modal">
			<h2>Create New Document</h2>
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
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		max-width: 500px;
		width: 90%;
		z-index: 1001;
	}

	.modal h2 {
		margin: 0 0 var(--space-6) 0;
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
	}

	.form-group {
		margin-bottom: var(--space-4);
	}

	.form-group label {
		display: block;
		margin-bottom: var(--space-2);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-base);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		margin-top: var(--space-6);
	}

	.btn {
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		cursor: pointer;
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		transition: all 0.15s;
	}

	.btn:hover {
		background: var(--color-background-hover);
		border-color: var(--color-border-hover);
	}

	.btn--primary {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.btn--primary:hover {
		background: var(--color-primary-hover);
		border-color: var(--color-primary-hover);
	}
</style>
