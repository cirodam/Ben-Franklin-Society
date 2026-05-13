<script lang="ts">
	import { enhance } from '$app/forms';
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
			<p class="error">{form.error}</p>
		{/if}

		<form method="POST" use:enhance class="setup-form">
			<label class="field">
				<span class="field__label">Society Name</span>
				<input
					name="society_name"
					type="text"
					placeholder="e.g. Ben Franklin Society of Athens, GA"
					required
				/>
				<span class="field__hint">The full name of your local society</span>
			</label>

			<div class="field-row">
				<label class="field">
					<span class="field__label">Given name</span>
					<input name="given_name" type="text" autocomplete="given-name" required />
				</label>
				<label class="field">
					<span class="field__label">Family name</span>
					<input name="family_name" type="text" autocomplete="family-name" required />
				</label>
			</div>

			<label class="field">
				<span class="field__label">Handle</span>
				<input
					name="handle"
					type="text"
					autocomplete="username"
					pattern="[a-z0-9_-]{2,32}"
					placeholder="e.g. alice"
					required
				/>
				<span class="field__hint">2–32 lowercase letters, numbers, hyphens, or underscores</span>
			</label>

			<label class="field">
				<span class="field__label">Date of birth</span>
				<input name="date_of_birth" type="date" required />
			</label>

			<label class="field">
				<span class="field__label">Password</span>
				<input name="password" type="password" autocomplete="new-password" minlength="12" required />
				<span class="field__hint">Minimum 12 characters</span>
			</label>

			<label class="field">
				<span class="field__label">Confirm password</span>
				<input name="confirm_password" type="password" autocomplete="new-password" minlength="12" required />
			</label>

			<button type="submit" class="submit-btn">Create account</button>
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

	.error {
		font-size: var(--text-sm);
		color: var(--color-danger);
		background: var(--color-danger-subtle);
		border-radius: var(--radius);
		padding: var(--space-2) var(--space-3);
		margin-bottom: var(--space-4);
	}

	.setup-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.field__label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	.field__hint {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.field input {
		width: 100%;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--color-text);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-2) var(--space-3);
		outline: none;
		transition: border-color 120ms, box-shadow 120ms;
	}

	.field input:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px var(--color-accent-subtle);
	}

	.submit-btn {
		width: 100%;
		margin-top: var(--space-2);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: #fff;
		background: var(--color-accent);
		border: none;
		border-radius: var(--radius);
		padding: var(--space-3);
		cursor: pointer;
		transition: background 120ms;
	}

	.submit-btn:hover {
		background: var(--color-accent-hover);
	}
</style>
