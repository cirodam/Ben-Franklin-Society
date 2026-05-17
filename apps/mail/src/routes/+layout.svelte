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
