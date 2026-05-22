<script lang="ts">
	import { page } from '$app/stores';

	let { 
		tabs,
		currentPath = $page.url.pathname
	}: { 
		tabs: Array<{ href: string; label: string; }>;
		currentPath?: string;
	} = $props();

	function isActive(href: string): boolean {
		// Exact match for the association overview
		if (href.endsWith('/bulletin') || href.endsWith('/members') || href.endsWith('/roles')) {
			return currentPath === href;
		}
		// For overview tab, only match if no other tabs are active
		return currentPath === href;
	}
</script>

<nav class="tabs">
	{#each tabs as tab}
		<a 
			href={tab.href} 
			class="tab"
			class:active={isActive(tab.href)}
		>
			{tab.label}
		</a>
	{/each}
</nav>

<style>
	.tabs {
		display: flex;
		gap: var(--space-1);
		border-bottom: 2px solid var(--border);
		margin-bottom: var(--space-6);
		overflow-x: auto;
	}

	.tab {
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--text-muted);
		text-decoration: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.tab:hover {
		color: var(--text);
		background: var(--bg-secondary);
	}

	.tab.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}
</style>
