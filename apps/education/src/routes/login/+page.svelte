<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Login - Education</title>
</svelte:head>

<div style="max-width: 400px; margin: 4rem auto;">
	<h1>Login</h1>

	<div class="card">
		<form method="POST" use:enhance>
			<div style="display: flex; flex-direction: column; gap: 1.5rem;">
				<div>
					<label for="username"><strong>Username</strong></label>
					<input type="text" id="username" name="username" required autocomplete="username" />
				</div>

				<div>
					<label for="password"><strong>Password</strong></label>
					<input type="password" id="password" name="password" required autocomplete="current-password" />
				</div>

				{#if form?.error}
					<div style="color: var(--color-error); padding: 1rem; border: 1px solid var(--color-error); border-radius: 4px;">
						{form.error}
					</div>
				{/if}

				<button type="submit" class="primary">Login</button>

				<div style="text-align: center;">
					<a href="/register">Don't have an account? Register</a>
				</div>
			</div>
		</form>
	</div>
</div>
