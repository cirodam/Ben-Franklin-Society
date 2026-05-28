<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Register - Education</title>
</svelte:head>

<div style="max-width: 400px; margin: 4rem auto;">
	<h1>Register</h1>

	<div class="card">
		<form method="POST" use:enhance>
			<div style="display: flex; flex-direction: column; gap: 1.5rem;">
				<div>
					<label for="displayName"><strong>Display Name</strong></label>
					<input type="text" id="displayName" name="displayName" required autocomplete="name" />
				</div>

				<div>
					<label for="username"><strong>Username</strong></label>
					<input type="text" id="username" name="username" required autocomplete="username" />
				</div>

				<div>
					<label for="password"><strong>Password</strong></label>
					<input type="password" id="password" name="password" required autocomplete="new-password" minlength="8" />
					<small style="color: var(--color-secondary);">At least 8 characters</small>
				</div>

				{#if form?.error}
					<div style="color: var(--color-error); padding: 1rem; border: 1px solid var(--color-error); border-radius: 4px;">
						{form.error}
					</div>
				{/if}

				<button type="submit" class="primary">Register</button>

				<div style="text-align: center;">
					<a href="/login">Already have an account? Login</a>
				</div>
			</div>
		</form>
	</div>
</div>
