<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Input } from '@bfs/ui';
	import type { ActionData, PageData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="login-wrap">
	<div class="login-card">
		<h1 class="login-title">{data.societyName}</h1>
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

	.login-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
</style>

