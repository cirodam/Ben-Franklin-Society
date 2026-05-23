<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, FieldRow, Input } from '@bfs/ui';
	import type { ActionData } from './$types.js';

	let { form }: { form: ActionData } = $props();
</script>

<div class="setup-wrap">
	<div class="setup-card">
		<div class="setup-header">
			<h1 class="setup-title t-prose">Benjamin Franklin Society Setup</h1>
			<p class="setup-subtitle t-prose-italic">Create the first administrator account to begin</p>
		</div>

		{#if form?.error}
			<Alert variant="danger">{form.error}</Alert>
		{/if}

		<form method="POST" use:enhance class="setup-form">
			<Input
				name="society_name"
				type="text"
				label="Society Name"
				hint="The full name of your local society"
				placeholder="e.g. Ben Franklin Society of Athens, GA"
				required
			/>

			<Input
				name="society_handle"
				type="text"
				label="Society Handle"
				hint="Short identifier for your society (lowercase, no spaces)"
				placeholder="e.g. athens"
				pattern="[a-z0-9-]+"
				required
			/>

			<FieldRow>
				<Input
					name="given_name"
					type="text"
					label="Given name"
					autocomplete="given-name"
					required
				/>
				<Input
					name="family_name"
					type="text"
					label="Family name"
					autocomplete="family-name"
					required
				/>
			</FieldRow>

			<Input
				name="handle"
				type="text"
				label="Handle"
				hint="Your unique identifier (e.g., @jsmith)"
				placeholder="@"
				autocomplete="username"
				required
			/>

			<Input
				name="date_of_birth"
				type="date"
				label="Date of birth"
				required
			/>

			<Input
				name="password"
				type="password"
				label="Password"
				hint="Minimum 12 characters"
				autocomplete="new-password"
				minlength="12"
				required
			/>

			<Input
				name="confirm_password"
				type="password"
				label="Confirm password"
				autocomplete="new-password"
				minlength="12"
				required
			/>

			<Button type="submit" fullWidth>Create</Button>
		</form>
	</div>
</div>

<style>
	.setup-wrap {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-6);
	}

	.setup-card {
		width: 100%;
		max-width: 520px;
		background: var(--paper);
		border: 2px solid var(--border);
		padding: var(--space-12) var(--space-10);
		box-shadow: var(--shadow-elevated);
	}

	.setup-header {
		margin-bottom: var(--space-8);
		text-align: center;
		border-bottom: 1px solid var(--border-subtle);
		padding-bottom: var(--space-6);
	}

	.setup-title {
		font-size: var(--text-3xl);
		font-weight: 400;
		line-height: 1.2;
		margin-bottom: var(--space-3);
	}

	.setup-subtitle {
		font-style: italic;
		color: var(--ink-mid);
	}

	.setup-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}
</style>
