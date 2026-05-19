<script lang="ts">
	import { enhance } from '$app/forms';

	type Section = {
		uuid: string;
		name: string;
	};

	type Role = {
		uuid: string;
		title: string;
	};

	interface Props {
		sections: Section[];
		parentRoleUuid?: string | null;
		parentRoleName?: string;
		sectionUuid?: string | null;
		sectionName?: string;
		onCancel: () => void;
	}

	let { sections, parentRoleUuid = null, parentRoleName, sectionUuid = null, sectionName, onCancel }: Props = $props();

	let form = $state({
		title: '',
		section_uuid: sectionUuid ?? '',
		reports_to_role_uuid: parentRoleUuid ?? '',
		description: '',
		compensation_franks: '0'
	});
</script>

<div class="form-card">
	<h4>
		New Role{#if sectionName} in {sectionName}{:else if parentRoleName} (reports to {parentRoleName}){/if}
	</h4>
	<form
		method="POST"
		action="?/createRole"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					onCancel();
					await update();
				}
			};
		}}
	>
		<input type="hidden" name="reports_to_role_uuid" value={form.reports_to_role_uuid} />
		{#if sectionUuid}
			<input type="hidden" name="section_uuid" value={form.section_uuid} />
		{/if}

		<div class="form-row">
			<div class="form-group">
				<label for="role-title">Title *</label>
				<input
					id="role-title"
					name="title"
					type="text"
					bind:value={form.title}
					required
					placeholder="e.g., Chief Medical Officer"
				/>
			</div>

			{#if !sectionUuid}
				<div class="form-group">
					<label for="role-section">Section</label>
					<select id="role-section" name="section_uuid" bind:value={form.section_uuid}>
						<option value="">None</option>
						{#each sections as section}
							<option value={section.uuid}>{section.name}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>

		<div class="form-group">
			<label for="role-description">Description</label>
			<textarea
				id="role-description"
				name="description"
				bind:value={form.description}
				rows="2"
			></textarea>
		</div>

		<div class="form-group">
			<label for="role-compensation">Compensation (Franks)</label>
			<input
				id="role-compensation"
				name="compensation_franks"
				type="number"
				bind:value={form.compensation_franks}
				min="0"
			/>
		</div>

		<div class="form-actions">
			<button type="submit" class="btn-primary">Create Role</button>
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

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-3);
	}

	.form-row .form-group {
		margin-bottom: 0;
	}

	label {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		font-weight: 400;
		letter-spacing: 0.1em;
		color: #374340;
	}

	input[type='text'],
	input[type='number'],
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
