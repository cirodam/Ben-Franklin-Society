<script lang="ts">
	import '@bfs/ui/src/theme.css';
	import { AppShell, Sidebar, SidebarLink, SidebarDivider } from '@bfs/ui';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const { isTeller, isAdmin } = $derived(data);
</script>

<AppShell maxWidth="md">
	{#snippet sidebar()}
		<Sidebar>
			{#snippet brand()}
				BFS Community Bank
			{/snippet}

			{#snippet nav()}
				<SidebarLink href="/">My Account</SidebarLink>
				<SidebarLink href="/history">History</SidebarLink>
				<SidebarLink href="/send">Send Franks</SidebarLink>

				{#if isTeller}
					<SidebarDivider />
					<SidebarLink href="/teller" class="teller-link">Teller Mode</SidebarLink>
				{/if}
				{#if isAdmin}
					{#if !isTeller}<SidebarDivider />{/if}
					<SidebarLink href="/admin" class="admin-link">Administration</SidebarLink>
				{/if}
			{/snippet}

			{#snippet footer()}
				{#if data.session}
					<div class="sidebar-identity">
						<span class="handle">@{data.session.handle}</span>
					</div>
				{/if}
			{/snippet}
		</Sidebar>
	{/snippet}

	{@render children()}
</AppShell>

<style>
	:global(.teller-link) {
		color: #2d4a2d !important;
		font-weight: var(--weight-medium) !important;
	}
	:global(.teller-link:hover) {
		background: #d4edda !important;
		color: #1a2e1a !important;
	}
	:global(.admin-link) {
		color: #2d2d4a !important;
		font-weight: var(--weight-medium) !important;
	}
	:global(.admin-link:hover) {
		background: #e0e0f4 !important;
		color: #1a1a2e !important;
	}

	.sidebar-identity {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.handle {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}
</style>
