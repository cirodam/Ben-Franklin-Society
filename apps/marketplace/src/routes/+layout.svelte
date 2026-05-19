<script lang="ts">
	import '@bfs/ui/src/theme.css';
	import { AppShell, Sidebar, SidebarLink, SidebarDivider } from '@bfs/ui';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const { isAdministrator } = $derived(data);
</script>

<AppShell>
	<Sidebar brand="BFS Market">
		<SidebarLink href="/">Browse</SidebarLink>
		<SidebarLink href="/classifieds">Classifieds</SidebarLink>
		<SidebarLink href="/services">Services</SidebarLink>
		<SidebarLink href="/markets">Markets</SidebarLink>
		<SidebarDivider />
		<SidebarLink href="/my-listings">My Listings</SidebarLink>
		<SidebarLink href="/sell" class="sell-link">+ Sell</SidebarLink>
		{#if isAdministrator}
			<SidebarDivider />
			<SidebarLink href="/administrator" class="admin-link">Administration</SidebarLink>
		{/if}

		{#snippet footer()}
			{#if data.session}
				<span class="sidebar__handle">@{data.session.handle}</span>
			{/if}
		{/snippet}
	</Sidebar>

	{@render children()}
</AppShell>

<style>
	/* Sidebar structure styling */
	:global(.sidebar) {
		background: var(--color-surface);
		border-right-color: var(--color-border);
	}

	:global(.sidebar__brand) {
		font-weight: var(--weight-semibold);
		font-size: var(--text-sm);
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		border-bottom-color: var(--color-border-faint);
	}

	:global(.sidebar__footer) {
		border-top-color: var(--color-border-faint);
	}

	/* Default sidebar link styling */
	:global(.sidebar-link) {
		font-size: var(--text-sm);
		color: var(--color-text);
	}

	:global(.sidebar-link:hover) {
		background: var(--color-accent-subtle);
		color: var(--color-accent);
	}
	:global(.sidebar-link--active) {
		background: var(--color-accent-subtle);
		color: var(--color-accent);
		font-weight: var(--weight-medium);
	}
	:global(.sidebar-link--accent) {
		color: var(--color-accent);
		font-weight: var(--weight-medium);
	}
	:global(.sidebar-link--accent:hover) {
		background: var(--color-accent-subtle);
	}
	:global(.sidebar-link--danger) {
		color: var(--color-text-muted);
	}
	:global(.sidebar-link--danger:hover) {
		background: var(--color-danger-subtle);
		color: var(--color-danger);
	}

	:global(.sidebar-link__badge) {
		background: var(--color-accent);
		color: #fff;
		font-size: 11px;
		font-weight: var(--weight-bold);
	}

	:global(.sidebar-group__label) {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}
</style>

<style>
	:global(.sell-link) {
		color: var(--color-accent);
		font-weight: var(--weight-medium);
	}

	:global(.admin-link) {
		color: #b45309;
	}

	.sidebar__handle {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}
</style>
