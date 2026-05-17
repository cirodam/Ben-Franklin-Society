<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';

	let {
		href,
		active = undefined,
		badge = undefined,
		variant = 'default',
		children,
		...rest
	}: {
		href: string;
		active?: boolean;
		badge?: string | number;
		variant?: 'default' | 'accent' | 'danger';
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	// Auto-detect active state if not explicitly provided
	const isActive = $derived(
		active !== undefined 
			? active 
			: $page.url.pathname === href || 
			  (href !== '/' && $page.url.pathname.startsWith(href))
	);
</script>

<a 
	{href} 
	class="sidebar-link sidebar-link--{variant}"
	class:sidebar-link--active={isActive}
	{...rest}
>
	{@render children()}
	{#if badge !== undefined}
		<span class="sidebar-link__badge">{badge}</span>
	{/if}
</a>

<style>
	.sidebar-link {
		display: flex;
		align-items: center;
		font-size: var(--text-sm);
		color: var(--color-text);
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius);
		margin: 0 var(--space-2);
		text-decoration: none;
		transition: background-color 0.15s, color 0.15s;
	}

	.sidebar-link:hover {
		background: var(--color-accent-subtle);
		color: var(--color-accent);
		text-decoration: none;
	}

	.sidebar-link--active {
		background: var(--color-accent-subtle);
		color: var(--color-accent);
		font-weight: var(--weight-medium);
	}

	/* Variant: accent (for special sections like admin/moderation) */
	.sidebar-link--accent {
		color: var(--color-accent);
		font-weight: var(--weight-medium);
	}
	.sidebar-link--accent:hover {
		background: var(--color-accent-subtle);
	}

	/* Variant: danger (for logout, delete, etc.) */
	.sidebar-link--danger {
		color: var(--color-text-muted);
	}
	.sidebar-link--danger:hover {
		background: var(--color-danger-subtle);
		color: var(--color-danger);
	}

	/* Badge (for counts, notifications) */
	.sidebar-link__badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 4px;
		border-radius: 9px;
		background: var(--color-accent);
		color: #fff;
		font-size: 11px;
		font-weight: var(--weight-bold);
		margin-left: auto;
	}

	.sidebar-link--active .sidebar-link__badge {
		background: var(--color-accent);
	}
</style>
