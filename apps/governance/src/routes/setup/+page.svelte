<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, FieldRow, Input } from '@bfs/ui';
	import type { ActionData } from './$types.js';

	let { form }: { form: ActionData } = $props();
</script>

<div class="setup-wrap">
	<div class="setup-card">
		<div class="setup-header">
			<h1 class="setup-title">Welcome to BFS Governance</h1>
			<p class="setup-subtitle">Create the first administrator account to begin</p>
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
		padding: var(--space-6);
	}

	.setup-card {
		width: 100%;
		max-width: 520px;
		background: var(--paper);
		border: 2px solid var(--border);
		border-radius: 0;
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
		font-family: 'IM Fell English', serif;
		font-size: var(--text-3xl);
		font-weight: 400;
		line-height: 1.2;
		color: var(--ink);
		margin-bottom: var(--space-3);
		letter-spacing: 0.01em;
	}

	.setup-subtitle {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		font-style: italic;
		color: var(--ink-mid);
		line-height: 1.6;
	}

	.setup-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.setup-form :global(label) {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.12em;
		color: var(--ink-mid);
	}

	.setup-form :global(input) {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		border: 1px solid var(--border);
		border-radius: 0;
		padding: 0.625rem 0.875rem;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.setup-form :global(input:focus) {
		border-color: var(--border-strong);
		box-shadow: 0 0 0 3px rgba(45, 90, 79, 0.08);
		outline: none;
	}

	.setup-form :global(button[type="submit"]) {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		letter-spacing: 0.16em;
		margin-top: var(--space-3);
		padding: 0.875rem 1.5rem;
		background: var(--accent);
		color: #fff;
		border: 1px solid var(--accent);
		border-radius: 0;
		cursor: pointer;
		transition: background 0.2s, border-color 0.2s;
	}

	.setup-form :global(button[type="submit"]:hover) {
		background: #224438;
		border-color: #224438;
	}
</style>
