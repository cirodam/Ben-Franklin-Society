<script lang="ts">
	import '@bfs/ui/src/theme.css';
	import '../community-bank-theme.css';
	import { AppShell, Sidebar, SidebarLink, SidebarDivider } from '@bfs/ui';
	import ContextSwitcher from '$lib/components/ContextSwitcher.svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const { isTeller, isAdmin, session, availableContexts, governanceUrl } = $derived(data);
	
	const hasContexts = $derived(availableContexts && availableContexts.length > 0);
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
				<SidebarLink href="/">My Accounts</SidebarLink>
				<SidebarLink href="/history">Transaction History</SidebarLink>
				<SidebarLink href="/send">Send Franks</SidebarLink>

				{#if isTeller}
					<SidebarDivider />
					<SidebarLink href="/teller" class="teller-link">Teller Desk</SidebarLink>
				{/if}
				{#if isAdmin}
					{#if !isTeller}<SidebarDivider />{/if}
					<SidebarLink href="/admin">Administration</SidebarLink>
				{/if}
			{/snippet}

			{#snippet footer()}
				{#if session && hasContexts}
					<div class="sidebar-footer-content">
						<ContextSwitcher 
							currentContext={session.acting_as_uuid}
							availableContexts={availableContexts}
							personUuid={session.person_uuid}
							governanceUrl={governanceUrl}
						/>
					</div>
				{:else if session}
					<div class="sidebar-identity">
						<span class="handle">@{session.handle}</span>
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
		font-size: 1.375rem;
		color: var(--copper);
		letter-spacing: -0.01em;
	}
	
	.brand-secondary {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 400;
		letter-spacing: 0.03em;
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
		padding: 0;
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


	/* Custom teller link styling */
	:global(.teller-link) {
		color: var(--olive) !important;
		font-weight: 500 !important;
	}
	
	:global(.teller-link:hover),
	:global(.teller-link.sidebar-link--active) {
		background: var(--olive-light) !important;
		color: var(--olive) !important;
	}
	
	.sidebar-footer-content {
		padding: var(--space-3);
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
		text-align: center;
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
