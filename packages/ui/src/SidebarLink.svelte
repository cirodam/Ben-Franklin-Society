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
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius);
		margin: 0 var(--space-2);
		text-decoration: none;
		transition: background-color 0.15s, color 0.15s;
	}

	.sidebar-link:hover {
		text-decoration: none;
	}

	/* Variant: accent (for special sections like admin/moderation) */
	.sidebar-link--accent {
		/* Styled by app themes */
	}

	/* Variant: danger (for logout, delete, etc.) */
	.sidebar-link--danger {
		/* Styled by app themes */
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
		margin-left: auto;
	}
</style>
