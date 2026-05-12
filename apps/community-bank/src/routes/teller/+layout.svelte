<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="teller-shell">
	<header class="teller-header">
		<div class="teller-header__brand">Teller Mode</div>
		<nav class="teller-header__nav">
			<a href="/teller" class="teller-nav-link">Account Lookup</a>
			<a href="/teller/slip" class="teller-nav-link">Enter Slip</a>
			<a href="/" class="teller-nav-link teller-nav-link--exit">← Member View</a>
		</nav>
	</header>

	<main class="teller-main">
		{@render children()}
	</main>
</div>

<style>
	.teller-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--color-bg);
	}

	.teller-header {
		background: #1a2e1a;
		color: #d4edda;
		display: flex;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-3) var(--space-6);
		border-bottom: 2px solid #2d4a2d;
	}

	.teller-header__brand {
		font-weight: var(--weight-bold);
		font-size: var(--text-sm);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #a3c9a8;
	}

	.teller-header__nav {
		display: flex;
		gap: var(--space-4);
		align-items: center;
	}

	.teller-nav-link {
		font-size: var(--text-sm);
		color: #d4edda;
		text-decoration: none;
	}
	.teller-nav-link:hover { text-decoration: underline; }
	.teller-nav-link--exit { margin-left: var(--space-4); color: #a3c9a8; }

	.teller-main {
		flex: 1;
		padding: var(--space-8);
		max-width: 900px;
	}
</style>
