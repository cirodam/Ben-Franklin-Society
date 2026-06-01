<script lang="ts">
	import { AppShell, Sidebar, SidebarLink, SidebarDivider, SidebarGroup } from '@bfs/ui';
	import { PLATFORM_NAME } from '@bfs/types';
	import ContextSwitcher from '$lib/components/ContextSwitcher.svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
	
	const hasContexts = $derived(data.availableContexts && data.availableContexts.length > 0);
</script>

<AppShell maxWidth="xl">
	{#snippet sidebar()}
		<Sidebar>
			{#snippet brand()}
				{PLATFORM_NAME}
			{/snippet}

			{#snippet nav()}
			<SidebarLink href="/">Home</SidebarLink>
			<SidebarLink href="/me">My Profile</SidebarLink>

			<SidebarGroup label="Governance">
				<SidebarLink href="/library">Society Code</SidebarLink>
				<SidebarLink href="/encyclopedia">Encyclopedia</SidebarLink>
				<SidebarLink href="/governance/referenda">Petitions and Referenda</SidebarLink>
				<SidebarLink href="/governance/general-assembly">General Assembly</SidebarLink>
				<SidebarLink href="/organization/committees">Committees</SidebarLink>
			</SidebarGroup>

			<SidebarGroup label="Organization">
				<SidebarLink href="/organization/directory">Directory</SidebarLink>
				<SidebarLink href="/organization/services">Services</SidebarLink>
				<SidebarLink href="/organization/colleges">Colleges</SidebarLink>
			</SidebarGroup>

			<SidebarGroup label="Communications">
				<SidebarLink href="/communications/calendar">Calendar</SidebarLink>
				<SidebarLink href="/communications/record">The Record</SidebarLink>
		</SidebarGroup>

		<SidebarGroup label="Federation">
			<SidebarLink href="/federation">Federation</SidebarLink>
		</SidebarGroup>

			<SidebarGroup label="Administration">
				<SidebarLink href="/admin/settings/oidc-clients">OIDC Clients</SidebarLink>
				<SidebarLink href="/admin/config">Settings</SidebarLink>			<SidebarLink href="/admin/emergency/skills">Emergency Skills</SidebarLink>
			<SidebarLink href="/admin/emergency/tools">Emergency Tools</SidebarLink>			</SidebarGroup>
		{/snippet}

		{#snippet footer()}
				<div class="footer-location">
					{data.societyLocation}
				</div>
				{#if hasContexts}
					<div class="footer-context-switcher">
						<ContextSwitcher 
							currentContext={data.actingAsUuid}
							availableContexts={data.availableContexts}
							personUuid={data.person.uuid}
						/>
					</div>
				{:else}
					<div class="footer-identity">
						<span class="footer-name">
							{data.person.given_name} {data.person.family_name}
						</span>
						<span class="footer-handle">
							{data.person.handle}
						</span>
					</div>
				{/if}
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
		font-family: var(--font-label);
		font-size: var(--text-sm);
		letter-spacing: 0.25em;
		text-align: center;
		color: var(--gold);
		text-transform: uppercase;
	}
	
	.footer-context-switcher {
		padding: var(--space-3);
	}
	
	.footer-location {
		padding: var(--space-3);
		font-family: var(--font-label);
		font-size: var(--text-sm);
		text-align: center;
		color: rgba(255, 255, 255, 0.7);
	}
	
	.footer-identity {
		padding: var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	
	.footer-name {
		font-size: var(--text-sm);
		font-weight: 500;
		color: rgba(255, 255, 255, 0.95);
	}
	
	.footer-handle {
		font-size: var(--text-xs);
		font-family: var(--font-mono);
		color: rgba(255, 255, 255, 0.7);
	}
	
	.footer-signout-form {
		padding: 0 var(--space-3) var(--space-3);
	}
	
	.footer-signout-button {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 0;
		font-family: var(--font-label);
		font-size: var(--text-sm);
		font-weight: 500;
		color: rgba(255, 255, 255, 0.85);
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.footer-signout-button:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.25);
		color: rgba(255, 255, 255, 0.95);
	}
</style>

