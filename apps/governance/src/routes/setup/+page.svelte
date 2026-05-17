<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, FieldRow, Input } from '@bfs/ui';
	import type { ActionData } from './$types.js';

	let { form }: { form: ActionData } = $props();
</script>

<div class="setup-wrap">
	<div class="setup-card">
		<div class="setup-header">
			<h1>Welcome to BFS Governance</h1>
			<p>Create the first administrator account to get started.</p>
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

			<Button type="submit" fullWidth>Create account</Button>
		</form>
	</div>
</div>

<style>
	.setup-wrap {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg);
		padding: var(--space-6);
	}

	.setup-card {
		width: 100%;
		max-width: 480px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-8);
		box-shadow: var(--shadow);
	}

	.setup-header {
		margin-bottom: var(--space-6);
	}

	.setup-header h1 {
		font-size: var(--text-xl);
		margin-bottom: var(--space-2);
	}

	.setup-header p {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.setup-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}


</style>
