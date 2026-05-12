<script lang="ts">
	import '@bfs/ui/src/theme.css';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const { isModerator, unreadCount } = $derived(data);
</script>

<div class="shell">
	<aside class="sidebar">
		<div class="sidebar__brand">BFS Mail</div>

		<div class="sidebar__compose">
			<a href="/compose" class="compose-btn">+ Compose</a>
		</div>

		<nav class="sidebar__nav">
			<a href="/" class="sidebar__link">
				Inbox
				{#if unreadCount > 0}<span class="sidebar__badge">{unreadCount}</span>{/if}
			</a>
			<a href="/sent"   class="sidebar__link">Sent</a>
			<a href="/drafts" class="sidebar__link">Drafts</a>
			<a href="/trash"  class="sidebar__link">Trash</a>
			{#if isModerator}
				<hr class="sidebar__divider" />
				<a href="/moderator" class="sidebar__link sidebar__link--mod">Moderation</a>
			{/if}
		</nav>

		{#if data.session}
			<div class="sidebar__footer">
				<span class="sidebar__handle">@{data.session.handle}</span>
			</div>
		{/if}
	</aside>

	<main class="main">
		{@render children()}
	</main>
</div>

<style>
	.shell {
		display: flex;
		min-height: 100vh;
	}

	.sidebar {
		width: 200px;
		flex-shrink: 0;
		background: var(--color-surface);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		position: sticky;
		top: 0;
		height: 100vh;
	}

	.sidebar__brand {
		font-weight: var(--weight-bold);
		font-size: var(--text-sm);
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		padding: var(--space-5) var(--space-4);
		border-bottom: 1px solid var(--color-border-faint);
	}

	.sidebar__compose {
		padding: var(--space-3) var(--space-3);
	}

	.compose-btn {
		display: block;
		text-align: center;
		background: var(--color-accent);
		color: #fff;
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius);
		text-decoration: none;
	}
	.compose-btn:hover { opacity: 0.9; }

	.sidebar__nav {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: var(--space-2) 0;
		gap: 2px;
	}

	.sidebar__link {
		display: block;
		font-size: var(--text-sm);
		color: var(--color-text);
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius);
		margin: 0 var(--space-2);
		text-decoration: none;
	}
	.sidebar__link:hover {
		background: var(--color-accent-subtle);
		color: var(--color-accent);
	}
	.sidebar__link--mod { color: #1a2e1a; font-weight: var(--weight-medium); }
	.sidebar__link--mod:hover { background: #d4edda; color: #0f1f0f; }

	.sidebar__badge {
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
		margin-left: var(--space-2);
	}

	.sidebar__divider {
		border: none;
		border-top: 1px solid var(--color-border-faint);
		margin: var(--space-2) var(--space-4);
	}

	.sidebar__footer {
		border-top: 1px solid var(--color-border-faint);
		padding: var(--space-4);
	}

	.sidebar__handle {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.main {
		flex: 1;
		min-width: 0;
		padding: var(--space-8);
		max-width: 860px;
	}
</style>
