<script lang="ts">
	import '../app.css';
	import { PLATFORM_NAME } from '@bfs/types';

	let { children } = $props();
</script>

<header>
	<nav class="container">
		<div class="nav-links">
			<a href="/">Home</a>
			<a href="/faq">FAQ</a>
			<a href="/resources">Resources</a>
		</div>
	</nav>
</header>

<main class="container">
	{@render children()}
</main>

<footer>
	<div class="container">
		<p>&copy; {new Date().getFullYear()} {PLATFORM_NAME}</p>
	</div>
</footer>

<style>
	header {
		border-bottom: 1px solid var(--color-border);
		padding: 1rem 0;
		margin-bottom: 3rem;
	}

	.nav-links {
		display: flex;
		justify-content: center;
		gap: 2rem;
	}

	.nav-links a {
		color: var(--color-text);
		text-decoration: none;
		position: relative;
	}

	.nav-links a:hover {
		color: var(--color-secondary);
	}

	.nav-links a:not(:last-child)::after {
		content: '·';
		position: absolute;
		right: -1.2rem;
		color: var(--color-secondary);
	}

	main {
		min-height: calc(100vh - 200px);
		padding: 2rem 0;
	}

	footer {
		border-top: 1px solid var(--color-border);
		margin-top: 4rem;
		padding: 2rem 0;
		color: var(--color-secondary);
		text-align: center;
	}
</style>
