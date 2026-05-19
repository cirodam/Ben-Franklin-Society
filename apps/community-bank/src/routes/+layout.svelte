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

	/* Custom teller/admin link styling */
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
