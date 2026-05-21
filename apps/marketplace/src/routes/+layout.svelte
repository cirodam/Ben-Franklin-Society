<script lang="ts">
	import '@bfs/ui/src/theme.css';
	import '../marketplace-theme.css';
	import { AppShell, Sidebar, SidebarLink, SidebarDivider } from '@bfs/ui';
	import ContextSwitcher from '$lib/components/ContextSwitcher.svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const { isAdministrator, session, availableContexts, governanceUrl } = $derived(data);
	const hasContexts = $derived(availableContexts && availableContexts.length > 0);
</script>

<AppShell>
	{#snippet sidebar()}
		<Sidebar>
			{#snippet brand()}
				<div class="brand-wrapper">
					<span class="brand-icon">🧺</span>
					<div class="brand-text">
						<div class="brand-primary">Market</div>
						<div class="brand-secondary">Ben Franklin Society</div>
					</div>
				</div>
			{/snippet}

			{#snippet nav()}
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
			{/snippet}

			{#snippet footer()}
				{#if session && hasContexts}
					<div class="sidebar-footer-content">
						<ContextSwitcher 
							currentContext={session.acting_as_uuid}
							availableContexts={availableContexts}
							personUuid={session.person_uuid}						governanceUrl={governanceUrl}						/>
					</div>
				{:else if session}
				<div class="sidebar-handle">
					@{session.handle}
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
	/* Sidebar structure styling */
	:global(.sidebar) {
		background: var(--deep-forest);
		border-right-color: var(--deep-forest);
	}

	:global(.sidebar__brand) {
		border-bottom-color: rgba(255, 255, 255, 0.15);
	}

	.brand-wrapper {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.brand-icon {
		font-size: var(--text-2xl);
		line-height: 1;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.brand-primary {
		font-family: var(--font-serif);
		font-size: var(--text-xl);
		font-weight: 600;
		color: white;
		line-height: 1.2;
	}

	.brand-secondary {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 400;
		color: rgba(255, 255, 255, 0.85);
		line-height: 1.2;
	}

	:global(.sidebar__footer) {
		border-top-color: rgba(255, 255, 255, 0.15);
	}

	/* Sidebar link styling for market theme */
	:global(.sidebar-link) {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
	}

	:global(.sidebar-link:hover) {
		background: rgba(255, 255, 255, 0.15);
		color: white;
	}
	
	:global(.sidebar-link--active) {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		font-weight: 600;
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

	:global(.sell-link) {
		color: var(--market-green-light);
		font-weight: 600;
	}
	
	:global(.sell-link:hover) {
		background: rgba(74, 124, 89, 0.2);
		color: white;
	}

	:global(.admin-link) {
		color: rgba(255, 255, 255, 0.75);
		font-weight: 500;
	}
	
	:global(.admin-link:hover) {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	:global(.sidebar__footer) {
		border-top-color: rgba(255, 255, 255, 0.15);
		padding: 0;
	}

	.sidebar-footer-content {
		padding: var(--space-3);
	}

	.sidebar-handle {
		padding: var(--space-3);
		font-size: var(--text-xs);
		font-family: var(--font-mono);
		font-weight: 500;
		color: rgba(255, 255, 255, 0.75);
		text-align: center;
	}

	.motto {
		font-family: var(--font-serif);
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		text-align: center;
		color: var(--market-green);
		text-transform: uppercase;
		font-weight: 500;
	}
</style>
