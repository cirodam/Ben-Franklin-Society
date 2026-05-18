<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Breadcrumb, Button, Card, Checkbox, Input, PageHeader, Select } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let enableSortition = $state(form?.enableSortition ?? !!data.sortitionConfig);
</script>

<div class="page">
	<PageHeader title="Edit Committee">
		<Breadcrumb items={[{ label: `← Back to ${data.association.name}`, href: `/organization/committees/${data.association.uuid}` }]} />
	</PageHeader>

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	<form method="POST" action="?/update" use:enhance class="form">
		<Card>
			<h2>Basic Information</h2>
			
			<div class="field-group">
				<Input
					id="handle"
					label="Handle"
					type="text"
					disabled
					value={data.association.handle}
					hint="Handle cannot be changed (used in URLs)"
				/>

				<Input
					id="name"
					name="name"
					label="Name"
					type="text"
					required
					value={form?.name ?? data.association.name}
				/>

				<Select
					id="status"
					name="status"
					label="Status"
					value={form?.status ?? data.association.status}
					hint="Setting to 'dissolved' is permanent"
				>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
					<option value="dissolved">Dissolved</option>
				</Select>
			</div>
		</Card>

		<Card>
			<h2>Founding Document</h2>
			
			<Input
				id="governing_document_slug"
				name="governing_document_slug"
				label="Document Slug"
				type="text"
				placeholder="committee-rules"
				value={form?.governingDocumentSlug ?? data.association.governing_document_slug ?? ''}
				hint="Slug of the governing document in data/documents/. Leave blank to remove."
			/>
		</Card>

		<Card>
			<h2>Sortition Configuration</h2>
			
			<div class="field-group">
				<Checkbox
					name="enable_sortition"
					label="Enable sortition for this committee"
					bind:checked={enableSortition}
					hint="Sortition randomly selects members from a source pool for fixed terms"
				/>

				{#if enableSortition}
					<Input
						id="seat_count"
						name="seat_count"
						label="Number of Seats"
						type="number"
						min="1"
						required={enableSortition}
						value={form?.seatCount ?? data.sortitionConfig?.seat_count ?? 5}
						hint="How many members can be seated at once"
					/>

					<Input
						id="term_days"
						name="term_days"
						label="Term Length (days)"
						type="number"
						min="1"
						required={enableSortition}
						value={form?.termDays ?? data.sortitionConfig?.term_days ?? 180}
						hint="How long each member serves"
					/>

					<Select
						id="source_college_uuid"
						name="source_college_uuid"
						label="Source College"
						value={form?.sourceCollegeUuid ?? data.sortitionConfig?.source_college_uuid ?? ''}
						hint="Draw members from a specific college or all citizens"
					>
						<option value="">Community (all citizens)</option>
						{#each data.colleges as college}
							<option value={college.uuid}>{college.name}</option>
						{/each}
					</Select>
				{/if}
			</div>
		</Card>

		<div class="form-actions">
			<Button variant="ghost" href="/organization/committees/{data.association.uuid}">Cancel</Button>
			<Button type="submit">Save Changes</Button>
		</div>
	</form>
</div>

<style>
	.page {
		max-width: 680px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form h2 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border-faint);
	}
</style>
