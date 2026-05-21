<script lang="ts">
	import '@bfs/ui/src/theme.css';
	import '../../mail-theme.css';
	import { AppShell, Sidebar, SidebarLink, SidebarDivider, Button } from '@bfs/ui';
	import ContextSwitcher from '$lib/components/ContextSwitcher.svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const { isModerator, unreadCount, session, availableContexts, governanceUrl } = $derived(data);
	const hasContexts = $derived(availableContexts && availableContexts.length > 0);
</script>

<AppShell maxWidth="lg">
	{#snippet sidebar()}
		<Sidebar>
			{#snippet brand()}
				<div class="brand-wrapper">
					<span class="brand-icon">✉</span>
					<div class="brand-text">
						<div class="brand-primary">Epistle</div>
						<div class="brand-secondary">Ben Franklin Society</div>
					</div>
				</div>
			{/snippet}

			{#snippet nav()}
				<div class="compose-wrapper">
					<Button href="/compose" fullWidth class="compose-btn">✍ Compose</Button>
				</div>

				<SidebarLink href="/" badge={(unreadCount && unreadCount > 0) ? unreadCount : undefined}>
					Inbox
				</SidebarLink>
				<SidebarLink href="/sent">Sent</SidebarLink>
				<SidebarLink href="/drafts">Drafts</SidebarLink>
				<SidebarLink href="/archive">Archive</SidebarLink>
				<SidebarLink href="/trash">Trash</SidebarLink>
				
				<SidebarDivider />
				<SidebarLink href="/search">Search</SidebarLink>
				<SidebarLink href="/labels">Labels</SidebarLink>
				<SidebarLink href="/contacts">Contacts</SidebarLink>
				<SidebarLink href="/settings">Settings</SidebarLink>
				<SidebarLink href="/templates">Templates</SidebarLink>

				{#if isModerator}
					<SidebarDivider />
					<SidebarLink href="/moderator" variant="accent">
						Moderation
					</SidebarLink>
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
					<span style="font-size: var(--text-xs); color: var(--color-text-muted); font-family: var(--font-mono);">
						@{session.handle}
					</span>
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
	/* Refined sidebar styling */
	:global(.sidebar) {
		background: linear-gradient(180deg, var(--postal-blue) 0%, var(--postal-blue-dark) 100%);
		border-right: 1px solid rgba(0, 0, 0, 0.15);
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
	}

	:global(.sidebar__brand) {
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		padding: var(--space-5) var(--space-4);
	}

	.brand-wrapper {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.brand-icon {
		font-size: 1.75rem;
		line-height: 1;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.brand-primary {
		font-family: var(--font-serif);
		font-size: 1.375rem;
		font-weight: 600;
		color: white;
		line-height: 1.2;
		letter-spacing: 0.02em;
	}

	.brand-secondary {
		font-family: var(--font-serif);
		font-size: var(--text-xs);
		font-weight: 400;
		color: rgba(255, 255, 255, 0.75);
		line-height: 1.2;
		letter-spacing: 0.03em;
	}

	.compose-wrapper {
		padding: var(--space-4);
		padding-bottom: var(--space-3);
	}

	.compose-wrapper :global(.compose-btn) {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
		color: white !important;
		font-weight: 600 !important;
		font-size: 0.9375rem !important;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25) !important;
		transition: all 0.2s ease !important;
		border: none !important;
		padding: var(--space-3) var(--space-4) !important;
		justify-content: center !important;
	}

	.compose-wrapper :global(.compose-btn:hover) {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4) !important;
		transform: translateY(-1px) !important;
	}

	:global(.sidebar__footer) {
		border-top: 1px solid rgba(255, 255, 255, 0.12);
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
		letter-spacing: 0.01em;
	}

	/* Refined sidebar link styling */
	:global(.sidebar-link) {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: rgba(255, 255, 255, 0.92);
		transition: all 0.2s ease;
	}

	:global(.sidebar-link:hover) {
		background: rgba(255, 255, 255, 0.12);
		color: white;
		box-shadow: inset 3px 0 0 rgba(255, 255, 255, 0.5);
	}
	
	:global(.sidebar-link--active) {
		background: rgba(255, 255, 255, 0.18);
		color: white;
		font-weight: 600;
		box-shadow: inset 3px 0 0 white;
	}
	
	:global(.sidebar-link--accent) {
		color: var(--stamp-green-light);
		font-weight: 600;
		background: rgba(255, 255, 255, 0.1);
	}
	
	:global(.sidebar-link--accent:hover) {
		background: rgba(255, 255, 255, 0.15);
		color: white;
		box-shadow: inset 3px 0 0 var(--stamp-green-light);
	}
	
	:global(.sidebar-link--danger) {
		color: rgba(255, 255, 255, 0.7);
	}
	
	:global(.sidebar-link--danger:hover) {
		background: rgba(185, 28, 28, 0.2);
		color: var(--wax-red-light);
	}

	:global(.sidebar-link__badge) {
		background: white;
		color: var(--postal-blue-dark);
		font-size: 11px;
		font-weight: 700;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	:global(.sidebar-group__label) {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.motto {
		font-family: var(--font-serif);
		font-size: var(--text-sm);
		letter-spacing: 0.12em;
		text-align: center;
		color: var(--postal-blue);
		text-transform: uppercase;
		font-weight: 600;
	}
</style>
