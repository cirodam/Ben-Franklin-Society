<script lang="ts">
	import '@bfs/ui/src/theme.css';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const nav = [
		{ href: '/',         label: 'My Account' },
		{ href: '/history',  label: 'History' },
		{ href: '/send',     label: 'Send Franks' },
		{ href: '/ledger',   label: 'Public Ledger' },
		{ href: '/treasury', label: 'Treasury & SIF' },
	];

	const { isTeller, isAdmin } = $derived(data);
</script>

<div class="shell">
	<aside class="sidebar">
		<div class="sidebar__brand">BFS Community Bank</div>
		<nav class="sidebar__nav">
			{#each nav as item}
				<a href={item.href} class="sidebar__link">{item.label}</a>
			{/each}
			{#if isTeller}
				<hr class="sidebar__divider" />
				<a href="/teller" class="sidebar__link sidebar__link--teller">Teller Mode</a>
			{/if}
			{#if isAdmin}
				{#if !isTeller}<hr class="sidebar__divider" />{/if}
				<a href="/admin" class="sidebar__link sidebar__link--admin">Administration</a>
			{/if}
		</nav>
		{#if data.session}
			<div class="sidebar__footer">
				<div class="sidebar__identity">
					<span class="sidebar__handle">@{data.session.handle}</span>
				</div>
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
		width: 220px;
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
		padding: var(--space-3) 0;
		gap: 2px;
	}

	.sidebar__link {
		display: block;
		font-size: var(--text-sm);
		color: var(--color-text);
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius);
		margin: 0 var(--space-2);
		text-decoration: none;
	}
	.sidebar__link:hover {
		background: var(--color-accent-subtle);
		color: var(--color-accent);
	}
	.sidebar__link--teller { color: #2d4a2d; font-weight: var(--weight-medium); }
	.sidebar__link--teller:hover { background: #d4edda; color: #1a2e1a; }
	.sidebar__link--admin { color: #2d2d4a; font-weight: var(--weight-medium); }
	.sidebar__link--admin:hover { background: #e0e0f4; color: #1a1a2e; }

	.sidebar__divider { border: none; border-top: 1px solid var(--color-border-faint); margin: var(--space-2) var(--space-4); }

	.sidebar__footer {
		border-top: 1px solid var(--color-border-faint);
		padding: var(--space-4);
	}

	.sidebar__handle {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.main {
		flex: 1;
		min-width: 0;
		padding: var(--space-8);
	}
</style>
