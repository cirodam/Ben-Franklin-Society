<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Breadcrumb, Button, Card, FieldRow, Input, PageHeader } from '@bfs/ui';
	import type { ActionData } from './$types.js';

	let { form }: { form: ActionData } = $props();
</script>

<div class="page">
	<PageHeader title="Add New Person">
		<Breadcrumb items={[{ label: '← Back to Directory', href: '/directory' }]} />
	</PageHeader>

	{#if form?.error}
		<Alert variant="danger">{form.error}</Alert>
	{/if}

	<form method="POST" action="?/create" use:enhance class="form">
		<Card>
			<h2>Basic Information</h2>
			
			<div class="field-group">
				<Input
					id="handle"
					name="handle"
					label="Handle"
					type="text"
					required
					pattern="[a-z0-9_-]{'{2,32}'}"
					placeholder="jane-doe"
					value={form?.handle ?? ''}
					hint="2-32 lowercase letters, numbers, hyphens, or underscores"
				/>

				<FieldRow>
					<Input
						id="given_name"
						name="given_name"
						label="Given Name"
						type="text"
						required
						placeholder="Jane"
						value={form?.givenName ?? ''}
					/>

					<Input
						id="family_name"
						name="family_name"
						label="Family Name"
						type="text"
						required
						placeholder="Doe"
						value={form?.familyName ?? ''}
					/>
				</FieldRow>

				<Input
					id="date_of_birth"
					name="date_of_birth"
					label="Date of Birth"
					type="date"
					required
					value={form?.dob ?? ''}
				/>

				<Input
					id="phone"
					name="phone"
					label="Phone Number"
					type="tel"
					placeholder="+1-555-555-5555"
					value={form?.phone ?? ''}
					hint="Optional"
				/>
			</div>
		</Card>

		<Card>
			<h2>Initial Password</h2>
			
			<Input
				id="initial_password"
				name="initial_password"
				label="Password"
				type="password"
				required
				minlength="8"
				placeholder="Minimum 8 characters"
				hint="User can change this after first login"
			/>
		</Card>

		<div class="form-actions">
			<Button variant="ghost" href="/organization/directory">Cancel</Button>
			<Button type="submit">Create Person</Button>
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
