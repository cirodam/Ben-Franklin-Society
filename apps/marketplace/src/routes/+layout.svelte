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
