<script lang="ts">
	import { AppShell, Sidebar, SidebarLink, SidebarDivider } from '@bfs/ui';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<AppShell>
	{#snippet sidebar()}
		<Sidebar>
			{#snippet brand()}
				BFS Governance
			{/snippet}

			{#snippet nav()}
				<SidebarLink href="/">🏛️ Home</SidebarLink>
				<SidebarLink href="/my/library">📝 My Library</SidebarLink>
				<SidebarLink href="/my/motions">📋 My Motions</SidebarLink>
				<SidebarLink href="/referenda">📢 Community Referenda</SidebarLink>
				<SidebarLink href="/general-assembly">🏛️ General Assembly</SidebarLink>
				<SidebarLink href="/committees">📋 Committees</SidebarLink>
				<SidebarLink href="/directory">📇 Directory</SidebarLink>
				<SidebarLink href="/services">🏢 Services</SidebarLink>
				<SidebarLink href="/colleges">🎓 Colleges</SidebarLink>
				<SidebarLink href="/library">📄 Library</SidebarLink>
				<SidebarLink href="/record">📝 The Record</SidebarLink>
				<SidebarLink href="/federation/lineage">🔗 Federation</SidebarLink>

				<SidebarDivider />

				<SidebarLink href="/settings/oidc-clients">🔑 OIDC Clients</SidebarLink>
				<SidebarLink href="/config">⚙️ Settings</SidebarLink>
			{/snippet}

			{#snippet footer()}
				<div style="display: flex; flex-direction: column; gap: 1px;">
					<span style="font-size: var(--text-sm); font-weight: var(--weight-medium);">
						{data.person.given_name} {data.person.family_name}
					</span>
					<span style="font-size: var(--text-xs); color: var(--color-text-muted); font-family: var(--font-mono);">
						@{data.person.handle}
					</span>
				</div>
				<form method="POST" action="/logout" style="margin-top: var(--space-2);">
					<button 
						type="submit"
						style="font-family: var(--font-sans); font-size: var(--text-xs); color: var(--color-text-muted); background: none; border: none; cursor: pointer; padding: 0; text-align: left;"
						onmouseover={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
						onmouseout={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
					>
						Sign out
					</button>
				</form>
			{/snippet}
		</Sidebar>
	{/snippet}

	{@render children()}
</AppShell>

