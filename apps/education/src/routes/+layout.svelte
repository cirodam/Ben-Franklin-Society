<script lang="ts">
	import '../app.css';
	import { PLATFORM_NAME } from '@bfs/types';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();
</script>

<header>
	<nav class="container">
		<div style="display: flex; justify-content: space-between; align-items: center;">
			<h2 style="margin: 0;">Education</h2>
			<div style="display: flex; gap: 2rem; align-items: center;">
				{#if data.user}
					<a href="/">Dashboard</a>
					<a href="/courses">Browse Courses</a>
					<a href="/my-courses">My Courses</a>
					<a href="/teaching">Teaching</a>
					<span style="color: var(--color-secondary);">|</span>
					<span>{data.user.displayName}</span>
					<form method="POST" action="/logout" style="display: inline;">
						<button type="submit" style="background: none; border: none; color: inherit; cursor: pointer; text-decoration: underline;">
							Logout
						</button>
					</form>
				{:else}
					<a href="/login">Login</a>
					<a href="/register">Register</a>
				{/if}
			</div>
		</div>
	</nav>
</header>

<main class="container">
	{@render children()}
</main>

<footer>
	<div class="container">
		<p style="text-align: center; color: var(--color-secondary);">
			{PLATFORM_NAME} Education System
		</p>
	</div>
</footer>

<style>
	header {
		border-bottom: 1px solid var(--color-border);
		padding: 1rem 0;
		margin-bottom: 2rem;
	}

	main {
		min-height: calc(100vh - 200px);
		padding: 2rem 0;
	}

	footer {
		border-top: 1px solid var(--color-border);
		margin-top: 4rem;
		padding: 2rem 0;
	}
</style>
