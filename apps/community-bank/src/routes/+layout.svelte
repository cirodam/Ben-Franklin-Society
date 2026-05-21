<script lang="ts">
	import '@bfs/ui/src/theme.css';
	import '../community-bank-theme.css';
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
				<div class="brand-text">
					<div class="brand-primary">Community Bank</div>
					<div class="brand-secondary">Ben Franklin Society</div>
				</div>
			{/snippet}

			{#snippet nav()}
				<SidebarLink href="/">My Account</SidebarLink>
				<SidebarLink href="/history">Transaction History</SidebarLink>
				<SidebarLink href="/send">Send Franks</SidebarLink>

				{#if isTeller}
					<SidebarDivider />
					<SidebarLink href="/teller" class="teller-link">Teller Desk</SidebarLink>
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

	{#snippet footer()}
		<div class="motto">Human Flourishing Is The Point</div>
	{/snippet}

	{@render children()}
</AppShell>

<style>
	/* Brand styling */
	.brand-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	
	.brand-primary {
		font-family: var(--font-sans);
		font-weight: 600;
		font-size: var(--text-base);
		color: var(--copper);
		letter-spacing: -0.01em;
	}
	
	.brand-secondary {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ink-mid);
	}

	/* Sidebar structure styling */
	:global(.sidebar) {
		background: var(--ledger);
		border-right: 1px solid var(--border);
	}

	:global(.sidebar__brand) {
		border-bottom: 1px solid var(--border-faint);
	}

	:global(.sidebar__footer) {
		border-top: 1px solid var(--border-faint);
	}

	/* Default sidebar link styling */
	:global(.sidebar-link) {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--ink);
		transition: background 0.15s, color 0.15s;
	}

	:global(.sidebar-link:hover) {
		background: var(--copper-light);
		color: var(--copper);
	}
	
	:global(.sidebar-link--active) {
		background: var(--copper-light);
		color: var(--copper);
		font-weight: 600;
	}

	/* Custom teller/admin link styling */
	:global(.teller-link) {
		color: var(--olive) !important;
		font-weight: 500 !important;
	}
	
	:global(.teller-link:hover),
	:global(.teller-link.sidebar-link--active) {
		background: var(--olive-light) !important;
		color: var(--olive) !important;
	}
	
	:global(.admin-link) {
		color: var(--ink-mid) !important;
		font-weight: 500 !important;
	}
	
	:global(.admin-link:hover),
	:global(.admin-link.sidebar-link--active) {
		background: var(--ledger-lined) !important;
		color: var(--ink) !important;
	}

	.sidebar-identity {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-3);
	}
	
	.handle {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--ink-faint);
	}

	.motto {
		font-family: var(--font-serif);
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		text-align: center;
		color: var(--copper);
		text-transform: uppercase;
		font-weight: 500;
	}
</style>
