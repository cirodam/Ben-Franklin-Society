<script lang="ts">
	import '@bfs/ui/src/theme.css';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const { isAdministrator } = $derived(data);
</script>

<div class="shell">
	<aside class="sidebar">
		<div class="sidebar__brand">BFS Market</div>

		<nav class="sidebar__nav">
			<a href="/"            class="sidebar__link">Browse</a>
			<a href="/classifieds" class="sidebar__link">Classifieds</a>
			<a href="/services"    class="sidebar__link">Services</a>
			<a href="/markets"     class="sidebar__link">Markets</a>
			<hr class="sidebar__divider" />
			<a href="/my-listings" class="sidebar__link">My Listings</a>
			<a href="/sell"        class="sidebar__link sidebar__link--sell">+ Sell</a>
			{#if isAdministrator}
				<hr class="sidebar__divider" />
				<a href="/administrator" class="sidebar__link sidebar__link--admin">Administration</a>
			{/if}
		</nav>

		{#if data.session}
			<div class="sidebar__footer">
				<span class="sidebar__handle">@{data.session.handle}</span>
			</div>
		{/if}
	</aside>

	<main class="main">
		{@render children()}
	</main>
</div>

<style>
	.shell {
		display: flex;
		min-height: 100vh;
	}

	.sidebar {
		width: 200px;
		flex-shrink: 0;
		background: var(--color-surface);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		position: sticky;
		top: 0;
		height: 100vh;
	}

	.sidebar__brand {
		font-weight: var(--weight-bold);
		font-size: var(--text-sm);
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		padding: var(--space-5) var(--space-4);
		border-bottom: 1px solid var(--color-border-faint);
	}

	.sidebar__nav {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: var(--space-2) 0;
		gap: 2px;
	}

	.sidebar__link {
		display: block;
		font-size: var(--text-sm);
		color: var(--color-text);
		text-decoration: none;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm);
		margin: 0 var(--space-2);
	}
	.sidebar__link:hover { background: var(--color-surface-hover, #f3f4f6); }

	.sidebar__link--sell {
		color: var(--color-accent);
		font-weight: var(--weight-medium);
	}

	.sidebar__link--admin {
		color: #b45309;
	}

	.sidebar__divider {
		border: none;
		border-top: 1px solid var(--color-border-faint);
		margin: var(--space-2) var(--space-4);
	}

	.sidebar__footer {
		padding: var(--space-4);
		border-top: 1px solid var(--color-border-faint);
	}

	.sidebar__handle {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.main {
		flex: 1;
		padding: var(--space-8);
		min-width: 0;
	}
</style>
