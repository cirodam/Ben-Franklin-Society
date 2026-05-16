<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const nav = [
		{ href: '/', label: '🏛️ Home' },
		{ href: '/my/documents', label: '📝 My Documents' },
		{ href: '/my/motions', label: '📋 My Motions' },
		{ href: '/referenda', label: '📢 Community Referenda' },
		{ href: '/general-assembly', label: '🏛️ General Assembly' },
		{ href: '/committees', label: '📋 Committees' },
		{ href: '/directory', label: '📇 Directory' },
		{ href: '/services', label: '🏢 Services' },
		{ href: '/colleges', label: '🎓 Colleges' },
		{ href: '/documents', label: '📄 Documents' },
		{ href: '/record', label: '📝 The Record' },
		{ href: '/federation/lineage', label: '🔗 Federation' },
		{ href: '/settings/oidc-clients', label: '🔑 OIDC Clients' },
		{ href: '/config', label: '⚙️ Settings' },
	];
</script>

<div class="shell">
	<aside class="sidebar">
		<div class="sidebar__brand">BFS Governance</div>
		<nav class="sidebar__nav">
			{#each nav as item}
				<a href={item.href} class="sidebar__link">{item.label}</a>
			{/each}
		</nav>
		<div class="sidebar__footer">
			<div class="sidebar__identity">
				<span class="sidebar__name">{data.person.given_name} {data.person.family_name}</span>
				<span class="sidebar__handle">@{data.person.handle}</span>
			</div>
			<form method="POST" action="/logout">
				<button type="submit" class="sidebar__signout">Sign out</button>
			</form>
		</div>
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
		text-decoration: none;
	}

	.sidebar__footer {
		border-top: 1px solid var(--color-border-faint);
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.sidebar__identity {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.sidebar__name {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	.sidebar__handle {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.sidebar__signout {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		text-align: left;
	}
	.sidebar__signout:hover {
		color: var(--color-danger);
	}

	.main {
		flex: 1;
		min-width: 0;
		padding: var(--space-8);
	}
</style>

