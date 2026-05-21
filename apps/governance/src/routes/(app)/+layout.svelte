<script lang="ts">
	import { AppShell, Sidebar, SidebarLink, SidebarDivider, SidebarGroup } from '@bfs/ui';
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
			<SidebarLink href="/">Home</SidebarLink>
			<SidebarLink href="/library">Library</SidebarLink>

			<SidebarGroup label="Governance">
				<SidebarLink href="/governance/referenda">Petitions and Referenda</SidebarLink>
				<SidebarLink href="/governance/general-assembly">General Assembly</SidebarLink>
			</SidebarGroup>

			<SidebarGroup label="Organization">
				<SidebarLink href="/organization/committees">Committees</SidebarLink>
				<SidebarLink href="/organization/directory">Directory</SidebarLink>
				<SidebarLink href="/organization/services">Services</SidebarLink>
				<SidebarLink href="/organization/colleges">Colleges</SidebarLink>
			</SidebarGroup>

			<SidebarGroup label="Communications">
				<SidebarLink href="/communications/record">The Record</SidebarLink>
			</SidebarGroup>

			<SidebarLink href="/federation/lineage">Federation</SidebarLink>

			<SidebarDivider />

			<SidebarGroup label="Administration">
				<SidebarLink href="/admin/settings/oidc-clients">OIDC Clients</SidebarLink>
				<SidebarLink href="/admin/config">Settings</SidebarLink>
			</SidebarGroup>
		{/snippet}

		{#snippet footer()}
				<div class="footer-identity">
					<span class="footer-name">
						{data.person.given_name} {data.person.family_name}
					</span>
					<span class="footer-handle">
						{data.person.handle}
					</span>
				</div>
				<form method="POST" action="/logout" class="footer-signout-form">
					<button type="submit" class="footer-signout-button">
						Sign out
					</button>
				</form>
			{/snippet}
		</Sidebar>
	{/snippet}

	{#snippet footer()}
		<div class="motto">Human Flourishing Is The Point</div>
	{/snippet}

	{@render children()}
</AppShell>

<style>
	.motto {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.25em;
		text-align: center;
		color: #7a5c1a;
		text-transform: uppercase;
	}
</style>

