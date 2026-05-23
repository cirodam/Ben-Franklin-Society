<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Input } from '@bfs/ui';
	import type { ActionData, PageData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="login-wrap">
	<div class="login-card">
		<div class="login-header">
			<h1 class="login-title">Benjamin Franklin Society</h1>
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
		max-width: 640px;
		background: var(--paper);
		border: 2px solid var(--border);
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
		font-family: var(--font-prose);
		font-size: var(--text-3xl);
		font-weight: 400;
		line-height: 1.2;
		color: var(--ink);
		margin-bottom: var(--space-2);
	}

	.login-subtitle {
		font-family: var(--font-label);
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
</style>

