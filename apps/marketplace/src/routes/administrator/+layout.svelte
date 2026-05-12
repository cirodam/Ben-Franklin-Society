<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children }: { children: Snippet } = $props();
</script>

<div class="admin-shell">
	<header class="admin-header">
		<span class="admin-brand">Marketplace Administration</span>
		<nav class="admin-nav">
			<a href="/administrator">Reports</a>
			<a href="/administrator/sellers">Sellers</a>
			<a href="/administrator/markets">Markets</a>
		</nav>
		<a href="/" class="back-link">← Back to Marketplace</a>
	</header>

	<main class="admin-content">
		{@render children()}
	</main>
</div>

<style>
	.admin-shell { display: flex; flex-direction: column; min-height: 100vh; }

	.admin-header {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-3) var(--space-6);
		background: #1e3a5f;
		color: #fff;
	}

	.admin-brand { font-size: var(--text-sm); font-weight: var(--weight-bold); letter-spacing: 0.02em; white-space: nowrap; }

	.admin-nav { display: flex; gap: var(--space-4); flex: 1; }
	.admin-nav a {
		font-size: var(--text-sm);
		color: rgba(255,255,255,0.8);
		text-decoration: none;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-md);
	}
	.admin-nav a:hover { color: #fff; background: rgba(255,255,255,0.1); }

	.back-link { font-size: var(--text-xs); color: rgba(255,255,255,0.6); text-decoration: none; white-space: nowrap; }
	.back-link:hover { color: #fff; }

	.admin-content { padding: var(--space-8) var(--space-6); flex: 1; }
</style>
