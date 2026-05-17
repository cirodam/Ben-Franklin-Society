<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="admin-shell">
	<header class="admin-header">
		<div class="admin-header__brand">Bank Administration</div>
		<nav class="admin-header__nav">
			<a href="/admin" class="admin-nav-link">Accounts</a>
			<a href="/admin/grouped-transfers" class="admin-nav-link">Grouped Transfers</a>
			<a href="/admin/cb-operations" class="admin-nav-link">CB Operations</a>
			<a href="/" class="admin-nav-link admin-nav-link--exit">← Member View</a>
		</nav>
	</header>

	<main class="admin-main">
		{@render children()}
	</main>
</div>

<style>
	.admin-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--color-bg);
	}

	.admin-header {
		background: #1a1a2e;
		color: #d4d4f0;
		display: flex;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-3) var(--space-6);
		border-bottom: 2px solid #2d2d4a;
	}

	.admin-header__brand {
		font-weight: var(--weight-bold);
		font-size: var(--text-sm);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #a3a3c9;
	}

	.admin-header__nav {
		display: flex;
		gap: var(--space-4);
		align-items: center;
	}

	.admin-nav-link {
		font-size: var(--text-sm);
		color: #d4d4f0;
		text-decoration: none;
	}
	.admin-nav-link:hover { text-decoration: underline; }
	.admin-nav-link--exit { margin-left: var(--space-4); color: #a3a3c9; }

	.admin-main {
		flex: 1;
		padding: var(--space-8);
		max-width: 1000px;
	}
</style>
