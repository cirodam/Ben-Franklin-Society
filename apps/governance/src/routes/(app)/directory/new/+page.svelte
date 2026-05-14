<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types.js';

	let { form }: { form: ActionData } = $props();
</script>

<div class="page">
	<div class="page-header">
		<h1>Add New Person</h1>
		<a href="/directory" class="breadcrumb">← Back to Directory</a>
	</div>

	{#if form?.error}
		<div class="alert alert--error">
			{form.error}
		</div>
	{/if}

	<form method="POST" action="?/create" use:enhance class="form">
		<div class="form-section">
			<h2>Basic Information</h2>
			
			<div class="field">
				<label for="handle">Handle <span class="required">*</span></label>
				<input
					id="handle"
					name="handle"
					type="text"
					required
					pattern="[a-z0-9_-]{'{2,32}'}"
					placeholder="jane-doe"
					value={form?.handle ?? ''}
				/>
				<p class="field-hint">2-32 lowercase letters, numbers, hyphens, or underscores</p>
			</div>

			<div class="field-row">
				<div class="field">
					<label for="given_name">Given Name <span class="required">*</span></label>
					<input
						id="given_name"
						name="given_name"
						type="text"
						required
						placeholder="Jane"
						value={form?.givenName ?? ''}
					/>
				</div>

				<div class="field">
					<label for="family_name">Family Name <span class="required">*</span></label>
					<input
						id="family_name"
						name="family_name"
						type="text"
						required
						placeholder="Doe"
						value={form?.familyName ?? ''}
					/>
				</div>
			</div>

			<div class="field">
				<label for="date_of_birth">Date of Birth <span class="required">*</span></label>
				<input
					id="date_of_birth"
					name="date_of_birth"
					type="date"
					required
					value={form?.dob ?? ''}
				/>
			</div>

			<div class="field">
				<label for="phone">Phone Number</label>
				<input
					id="phone"
					name="phone"
					type="tel"
					placeholder="+1-555-555-5555"
					value={form?.phone ?? ''}
				/>
				<p class="field-hint">Optional</p>
			</div>
		</div>

		<div class="form-section">
			<h2>Initial Password</h2>
			
			<div class="field">
				<label for="initial_password">Password <span class="required">*</span></label>
				<input
					id="initial_password"
					name="initial_password"
					type="password"
					required
					minlength="8"
					placeholder="Minimum 8 characters"
				/>
				<p class="field-hint">User can change this after first login</p>
			</div>
		</div>

		<div class="form-actions">
			<a href="/directory" class="btn btn--ghost">Cancel</a>
			<button type="submit" class="btn btn--primary">Create Person</button>
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

	.page-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.page-header h1 {
		margin: 0;
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
	}

	.breadcrumb {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--text-sm);
	}

	.breadcrumb:hover {
		text-decoration: underline;
	}

	.alert {
		padding: var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
	}

	.alert--error {
		background: #fee2e2;
		border: 1px solid #fca5a5;
		color: #7f1d1d;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.form-section h2 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.field label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	.required {
		color: #dc2626;
	}

	.field input,
	.field select {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.field input:focus,
	.field select:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.field-hint {
		margin: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border-faint);
	}

	.btn {
		padding: var(--space-2) var(--space-5);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		border: none;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
	}

	.btn--primary {
		background: var(--color-accent);
		color: #fff;
	}

	.btn--ghost {
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text);
	}

	.btn:hover {
		filter: brightness(0.92);
	}
</style>
