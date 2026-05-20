<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Input } from '@bfs/ui';
	import type { ActionData, PageData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="login-wrap">
	<div class="login-card">
		<div class="login-header">
			<h1 class="login-title">{data.societyName}</h1>
			<p class="login-subtitle">Member Portal</p>
		</div>
		{#if form?.error}
			<Alert variant="danger">{form.error}</Alert>
		{/if}
		<form method="POST" use:enhance class="login-form">
			<Input
				name="handle"
				type="text"
				label="Handle"
				autocomplete="username"
				required
			/>
			<Input
				name="password"
				type="password"
				label="Password"
				autocomplete="current-password"
				required
			/>
			<Button type="submit" fullWidth>Sign in</Button>
		</form>
	</div>
</div>

<style>
	.login-wrap {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-6);
	}

	.login-card {
		width: 100%;
		max-width: 420px;
		background: var(--paper);
		border: 2px solid var(--border);
		border-radius: 0;
		padding: var(--space-10) var(--space-8);
		box-shadow: var(--shadow-elevated);
	}

	.login-header {
		text-align: center;
		margin-bottom: var(--space-8);
		border-bottom: 1px solid var(--border-subtle);
		padding-bottom: var(--space-6);
	}

	.login-title {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-3xl);
		font-weight: 400;
		line-height: 1.2;
		color: var(--ink);
		margin-bottom: var(--space-2);
		letter-spacing: 0.01em;
	}

	.login-subtitle {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.2em;
		color: var(--ink-mid);
		text-transform: lowercase;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.login-form :global(label) {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.12em;
		color: var(--ink-mid);
	}

	.login-form :global(input) {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		border: 1px solid var(--border);
		border-radius: 0;
		padding: 0.625rem 0.875rem;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.login-form :global(input:focus) {
		border-color: var(--border-strong);
		box-shadow: 0 0 0 3px rgba(45, 90, 79, 0.08);
		outline: none;
	}

	.login-form :global(button[type="submit"]) {
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

	.login-form :global(button[type="submit"]:hover) {
		background: #224438;
		border-color: #224438;
	}
</style>

