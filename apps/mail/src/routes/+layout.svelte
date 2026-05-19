<script lang="ts">
	import '@bfs/ui/src/theme.css';
	import { AppShell, Sidebar, SidebarLink, SidebarDivider, Button } from '@bfs/ui';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const { isModerator, unreadCount } = $derived(data);
</script>

<AppShell maxWidth="md">
	{#snippet sidebar()}
		<Sidebar>
			{#snippet brand()}
				BFS Mail
			{/snippet}

			{#snippet nav()}
				<div style="padding: var(--space-3);">
					<Button href="/compose" fullWidth>+ Compose</Button>
				</div>

				<SidebarLink href="/" badge={(unreadCount && unreadCount > 0) ? unreadCount : undefined}>
					Inbox
				</SidebarLink>
				<SidebarLink href="/sent">Sent</SidebarLink>
				<SidebarLink href="/drafts">Drafts</SidebarLink>
				<SidebarLink href="/trash">Trash</SidebarLink>

				{#if isModerator}
					<SidebarDivider />
					<SidebarLink href="/moderator" variant="accent">
						Moderation
					</SidebarLink>
				{/if}
			{/snippet}

			{#snippet footer()}
				{#if data.session}
					<span style="font-size: var(--text-xs); color: var(--color-text-muted); font-family: var(--font-mono);">
						@{data.session.handle}
					</span>
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
</style>
