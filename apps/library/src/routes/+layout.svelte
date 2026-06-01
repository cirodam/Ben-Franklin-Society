<script lang="ts">
	import '@bfs/ui/src/theme.css';
	import '../library-theme.css';
	import { AppShell, Sidebar, SidebarLink, SidebarDivider } from '@bfs/ui';
	import { PLATFORM_NAME } from '@bfs/types';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const { session, governanceUrl } = $derived(data);
</script>

<AppShell maxWidth="xl">
	{#snippet sidebar()}
		<Sidebar>
			{#snippet brand()}
				<div class="brand-wrapper">
					<div class="brand-text">
						<div class="brand-primary">Library</div>
					<div class="brand-secondary">{PLATFORM_NAME}</div>
					</div>
				</div>
			{/snippet}

			{#snippet nav()}
				<SidebarLink href="/">Files</SidebarLink>
			{/snippet}

			{#snippet footer()}
				{#if session}
					<div class="sidebar-footer-content">
						<div class="sidebar-handle">
							@{session.handle}
						</div>
						<form method="POST" action="/auth/logout" class="sidebar-logout-form">
							<button type="submit" class="sidebar-logout-button">
								Sign out
							</button>
						</form>
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
	/* Sidebar branding */
	.brand-wrapper {
		display: flex;
		flex-direction: column;
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
		color: var(--sidebar-text);
		line-height: 1.2;
	}

	.brand-secondary {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		color: var(--sidebar-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Sidebar footer */
	.sidebar-footer-content {
		padding: var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.sidebar-handle {
		font-size: var(--text-sm);
		color: var(--sidebar-text-muted);
		font-family: var(--font-mono);
	}

	.sidebar-logout-form {
		width: 100%;
	}

	.sidebar-logout-button {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: 1px solid var(--sidebar-border);
		border-radius: var(--radius-md);
		color: var(--sidebar-text-muted);
		font-size: var(--text-sm);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.sidebar-logout-button:hover {
		background: var(--sidebar-hover);
		color: var(--sidebar-text);
		border-color: var(--sidebar-text-muted);
	}

	/* Footer motto */
	.motto {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.25em;
		text-align: center;
		color: #7a5c1a;
		text-transform: uppercase;
	}
</style>

