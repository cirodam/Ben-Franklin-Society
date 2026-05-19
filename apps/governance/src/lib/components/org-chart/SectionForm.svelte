<script lang="ts">
	import { enhance } from '$app/forms';

	type Section = {
		uuid: string;
		name: string;
	};

	interface Props {
		sections: Section[];
		onCancel: () => void;
	}

	let { sections, onCancel }: Props = $props();

	let form = $state({
		name: '',
		parent_section_uuid: '',
		description: ''
	});
</script>

<div class="form-card">
	<h4>New Section</h4>
	<form
		method="POST"
		action="?/createSection"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					onCancel();
					await update();
				}
			};
		}}
	>
		<div class="form-group">
			<label for="section-name">Name *</label>
			<input
				id="section-name"
				name="name"
				type="text"
				bind:value={form.name}
				required
				placeholder="e.g., Health Services"
			/>
		</div>

		<div class="form-group">
			<label for="parent-section">Parent Section</label>
			<select id="parent-section" name="parent_section_uuid" bind:value={form.parent_section_uuid}>
				<option value="">None (Top Level)</option>
				{#each sections as section}
					<option value={section.uuid}>{section.name}</option>
				{/each}
			</select>
		</div>

		<div class="form-group">
			<label for="section-description">Description</label>
			<textarea
				id="section-description"
				name="description"
				bind:value={form.description}
				rows="2"
			></textarea>
		</div>

		<div class="form-actions">
			<button type="submit" class="btn-primary">Create Section</button>
			<button type="button" class="btn-secondary" onclick={onCancel}>Cancel</button>
		</div>
	</form>
</div>

<style>
	.form-card {
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.3);
		padding: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.form-card h4 {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		font-weight: 400;
		letter-spacing: 0.1em;
		color: #151c1a;
		margin: 0 0 var(--space-3) 0;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		margin-bottom: var(--space-3);
	}

	label {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		font-weight: 400;
		letter-spacing: 0.1em;
		color: #374340;
	}

	input[type='text'],
	textarea,
	select {
		padding: var(--space-2);
		border: 1px solid rgba(45, 90, 79, 0.2);
		font-size: var(--text-sm);
		font-family: 'Libre Baskerville', Georgia, serif;
		background: #fafaf7;
		color: #151c1a;
	}

	input:focus,
	textarea:focus,
	select:focus {
		outline: none;
		border-color: #7a5c1a;
	}

	.form-actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-3);
	}

	.btn-primary {
		padding: var(--space-2) var(--space-3);
		background: #7a5c1a;
		color: white;
		border: 1px solid #7a5c1a;
		cursor: pointer;
		font-size: var(--text-sm);
		font-family: 'Libre Baskerville', Georgia, serif;
	}

	.btn-primary:hover {
		background: #d4a24a;
		border-color: #d4a24a;
	}

	.btn-secondary {
		padding: var(--space-2) var(--space-3);
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid rgba(45, 90, 79, 0.2);
		cursor: pointer;
		font-size: var(--text-sm);
		font-family: 'Libre Baskerville', Georgia, serif;
	}

	.btn-secondary:hover {
		background: var(--paper);
		border-color: #7a5c1a;
	}
</style>
