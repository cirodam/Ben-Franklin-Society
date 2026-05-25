<script lang="ts">
	import '@bfs/ui/src/theme.css';
	import { page } from '$app/stores';
	
	let { children } = $props();
</script>

<div class="app">
	<header class="header">
		<div class="header-content">
			<h1 class="title">
				<a href="/">Federation Registry</a>
			</h1>
			<nav class="nav">
				<a href="/" class:active={$page.url.pathname === '/'}>Dashboard</a>
				<a href="/societies" class:active={$page.url.pathname === '/societies'}>Societies</a>
				<a href="/stats" class:active={$page.url.pathname === '/stats'}>Statistics</a>
			</nav>
		</div>
	</header>

	<main class="main">
		{@render children()}
	</main>

	<footer class="footer">
		<p>Federation Registry - Ben Franklin Society Network</p>
	</footer>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--color-background);
	}

	.header {
		background: var(--color-surface);
		border-bottom: 2px solid var(--color-border);
		padding: 1.5rem 2rem;
	}

	.header-content {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.title a {
		color: var(--color-text);
		text-decoration: none;
	}

	.title a:hover {
		color: var(--color-primary);
	}

	.nav {
		display: flex;
		gap: 2rem;
	}

	.nav a {
		color: var(--color-text-secondary);
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.nav a:hover {
		color: var(--color-text);
		background: var(--color-surface-elevated);
	}

	.nav a.active {
		color: var(--color-primary);
		background: var(--color-primary-subtle);
	}

	.main {
		flex: 1;
		max-width: 1400px;
		width: 100%;
		margin: 0 auto;
		padding: 2rem;
	}

	.footer {
		border-top: 1px solid var(--color-border);
		padding: 2rem;
		text-align: center;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}

	.footer p {
		margin: 0;
	}
</style>
