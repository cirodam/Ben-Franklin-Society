<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types.js';

	let { form }: { form: ActionData } = $props();
</script>

<div class="login-wrap">
	<div class="login-card">
		<h1 class="login-title">BFS Governance</h1>
		{#if form?.error}
			<p class="login-error">{form.error}</p>
		{/if}
		<form method="POST" use:enhance class="login-form">
			<label class="field">
				<span class="field__label">Handle</span>
				<input name="handle" type="text" autocomplete="username" required />
			</label>
			<label class="field">
				<span class="field__label">Password</span>
				<input name="password" type="password" autocomplete="current-password" required />
			</label>
			<button type="submit" class="login-btn">Sign in</button>
		</form>
	</div>
</div>

<style>
	.login-wrap {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg);
	}

	.login-card {
		width: 100%;
		max-width: 360px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-8);
		box-shadow: var(--shadow);
	}

	.login-title {
		font-size: var(--text-xl);
		margin-bottom: var(--space-6);
		text-align: center;
	}

	.login-error {
		font-size: var(--text-sm);
		color: var(--color-danger);
		background: var(--color-danger-subtle);
		border-radius: var(--radius);
		padding: var(--space-2) var(--space-3);
		margin-bottom: var(--space-4);
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
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

	.login-btn {
		width: 100%;
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
	.login-btn:hover {
		background: var(--color-accent-hover);
	}
</style>

