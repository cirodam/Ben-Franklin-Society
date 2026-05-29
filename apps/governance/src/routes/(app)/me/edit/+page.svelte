<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Breadcrumb, Button, Card, FieldRow, Input, PageHeader } from '@bfs/ui';
	import type { ActionData, PageData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="page">
	<PageHeader title="Edit Profile">
		<Breadcrumb items={[{ label: '← Back to Profile', href: '/me' }]} />
	</PageHeader>

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	<form method="POST" action="?/update" use:enhance class="form">
		<Card>
			<h2>Personal Information</h2>
			
			<div class="field-group">
				<FieldRow>
					<Input
						id="given_name"
						name="given_name"
						label="Given Name"
						type="text"
						required
						placeholder="Jane"
						value={form?.givenName ?? data.person.given_name}
					/>

					<Input
						id="family_name"
						name="family_name"
						label="Family Name"
						type="text"
						required
						placeholder="Doe"
						value={form?.familyName ?? data.person.family_name}
					/>
				</FieldRow>

				<Input
					id="date_of_birth"
					name="date_of_birth"
					label="Date of Birth"
					type="date"
					required
					value={form?.dob ?? data.person.date_of_birth}
				/>

				<Input
					id="phone"
					name="phone"
					label="Phone Number"
					type="tel"
					placeholder="+1-555-555-5555"
					value={form?.phone ?? data.person.phone ?? ''}
					hint="Optional"
				/>
			</div>
		</Card>

		<Card>
			<h2>Location</h2>
			
			<div class="field-group">
				<Input
					id="street_address"
					name="street_address"
					label="Street Address"
					type="text"
					placeholder="123 Main Street, City, State 12345"
					value={form?.streetAddress ?? data.person.street_address ?? ''}
					hint="Optional"
				/>

				<FieldRow>
					<Input
						id="latitude"
						name="latitude"
						label="Latitude"
						type="number"
						step="any"
						min="-90"
						max="90"
						placeholder="37.7749"
						value={form?.latitude ?? data.person.latitude ?? ''}
						hint="Optional"
					/>

					<Input
						id="longitude"
						name="longitude"
						label="Longitude"
						type="number"
						step="any"
						min="-180"
						max="180"
						placeholder="-122.4194"
						value={form?.longitude ?? data.person.longitude ?? ''}
						hint="Optional"
					/>
				</FieldRow>
			</div>
		</Card>

		<div class="form-actions">
			<Button variant="ghost" href="/me">Cancel</Button>
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
	}
</style>
