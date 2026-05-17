<script lang="ts">
	import { enhance } from '$app/forms';
	import { Input, Textarea, Select, Button } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { people, associations, actingAs } = $derived(data);

	// Combine people and associations for party selection
	const principals = $derived([
		...people.map((p) => ({
			uuid: p.uuid,
			name: `${p.given_name} ${p.family_name}`,
			handle: p.handle,
			type: 'person',
		})),
		...associations.map((a) => ({
			uuid: a.uuid,
			name: a.name,
			handle: a.handle,
			type: 'association',
		})),
	]);

	let milestones = $state<Array<{ title: string; description: string; due_date: string }>>([]);

	function addMilestoneRow() {
		milestones.push({ title: '', description: '', due_date: '' });
	}

	function removeMilestoneRow(index: number) {
		milestones.splice(index, 1);
	}
</script>

<div class="page">
	<div class="page-header">
		<a href="/contracts" class="back">← Contracts</a>
		<h1>New Contract</h1>
	</div>

	<form method="POST" use:enhance class="form">
		<div class="section">
			<h2>Contract Details</h2>

			<Input id="title" name="title" label="Title" required />

			<Textarea
				id="body"
				name="body"
				label="Agreement Text"
				rows={12}
				hint="The full text of the agreement between the parties."
				required
			/>

			<div class="field-group">
				<Input
					id="effective_date"
					name="effective_date"
					type="date"
					label="Effective Date (optional)"
					hint="If blank, will be set when both parties acknowledge."
				/>

				<Input
					id="expiry_date"
					name="expiry_date"
					type="date"
					label="Expiry Date (optional)"
					hint="Leave blank for no expiration."
				/>
			</div>
		</div>

		<div class="section">
			<h2>Parties</h2>

			<div class="party-section">
				<h3>Party A</h3>
				<div class="field-group">
					<Select id="party_a_uuid" name="party_a_uuid" label="Principal" required>
						<option value="">Select party...</option>
						{#each principals as principal}
							<option value={principal.uuid}>{principal.name} (@{principal.handle})</option>
						{/each}
					</Select>

					<Input
						id="party_a_role"
						name="party_a_role"
						label="Role in Contract"
						placeholder="e.g., Provider, Buyer"
						required
					/>
				</div>
			</div>

			<div class="party-section">
				<h3>Party B</h3>
				<div class="field-group">
					<Select id="party_b_uuid" name="party_b_uuid" label="Principal" required>
						<option value="">Select party...</option>
						{#each principals as principal}
							<option value={principal.uuid}>{principal.name} (@{principal.handle})</option>
						{/each}
					</Select>

					<Input
						id="party_b_role"
						name="party_b_role"
						label="Role in Contract"
						placeholder="e.g., Recipient, Seller"
						required
					/>
				</div>
			</div>
		</div>

		<div class="section">
			<div class="section-header">
				<h2>Milestones (optional)</h2>
				<button type="button" class="btn btn--secondary" onclick={addMilestoneRow}>+ Add Milestone</button>
			</div>

			{#if milestones.length === 0}
				<p class="help">Add milestones to track deliverables and obligations.</p>
			{:else}
				<div class="milestones-list">
					{#each milestones as milestone, i}
						<div class="milestone-row">
							<div class="milestone-fields">
								<Input
									id="milestone_title_{i}"
									name="milestone_title"
									label="Milestone"
									placeholder="Deliverable or obligation"
									bind:value={milestone.title}
								/>

								<Input
									id="milestone_description_{i}"
									name="milestone_description"
									label="Description (optional)"
									placeholder="Additional details"
									bind:value={milestone.description}
								/>

								<Input
									id="milestone_due_date_{i}"
									name="milestone_due_date"
									type="date"
									label="Due Date"
									bind:value={milestone.due_date}
								/>
							</div>

							<button type="button" class="btn-icon btn-remove" onclick={() => removeMilestoneRow(i)}>×</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="actions">
			<button type="submit" class="btn btn--primary">Create Contract</button>
			<a href="/contracts" class="btn btn--secondary">Cancel</a>
		</div>
	</form>
</div>

<style>
	.page {
		max-width: 900px;
		margin: 0 auto;
		padding: var(--space-6);
	}

	.page-header {
		margin-bottom: var(--space-6);
	}

	.back {
		display: inline-block;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		margin-bottom: var(--space-2);
	}

	.back:hover {
		color: var(--color-text);
	}

	.page-header h1 {
		margin: 0;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.section {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
	}

	.section h2 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-lg);
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

	.party-section {
		margin-bottom: var(--space-4);
	}

	.party-section:last-child {
		margin-bottom: 0;
	}

	.party-section h3 {
		margin: 0 0 var(--space-3) 0;
		font-size: var(--text-base);
		color: var(--color-text-muted);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
	}

	.field--date {
		max-width: 200px;
	}

	.field-group {
		display: flex;
		gap: var(--space-4);
	}

	.field-group .field {
		flex: 1;
	}

	label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	input,
	textarea,
	select {
		padding: var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-family: inherit;
		background: var(--color-bg);
		color: var(--color-text);
	}

	input:focus,
	textarea:focus,
	select:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	textarea {
		resize: vertical;
		line-height: 1.6;
	}

	.help {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.milestones-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.milestone-row {
		display: flex;
		gap: var(--space-2);
		align-items: flex-start;
		padding: var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.milestone-fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		flex: 1;
	}

	.btn-icon {
		background: none;
		border: none;
		font-size: var(--text-2xl);
		color: var(--color-text-muted);
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius);
	}

	.btn-icon:hover {
		background: var(--color-danger);
		color: white;
	}

	.actions {
		display: flex;
		gap: var(--space-3);
	}

	.btn {
		padding: var(--space-2) var(--space-4);
		border: none;
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		text-decoration: none;
		display: inline-block;
		text-align: center;
	}

	.btn--primary {
		background: var(--color-primary);
		color: white;
	}

	.btn--primary:hover {
		background: var(--color-primary-dark);
	}

	.btn--secondary {
		background: var(--color-surface-raised);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn--secondary:hover {
		background: var(--color-surface);
	}
</style>
