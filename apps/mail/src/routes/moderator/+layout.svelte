<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const nav = [
		{ href: '/moderator',           label: 'Reports' },
		{ href: '/moderator/mailboxes', label: 'Mailboxes' },
	];
</script>

<div class="mod-shell">
	<header class="mod-header">
		<span class="mod-header__label">Moderation</span>
		<nav class="mod-header__nav">
			{#each nav as item}
				<a href={item.href} class="mod-nav-link">{item.label}</a>
			{/each}
		</nav>
		<a href="/" class="mod-header__back">← Back to Mail</a>
	</header>

	<div class="mod-content">
		{@render children()}
	</div>
</div>

<style>
	.mod-shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.mod-header {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-3) var(--space-8);
		background: #1a2e1a;
		color: #d4edda;
		font-size: var(--text-sm);
	}

	.mod-header__label {
		font-weight: var(--weight-bold);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: var(--text-xs);
		color: #9ecfa6;
	}

	.mod-header__nav {
		display: flex;
		gap: var(--space-4);
		flex: 1;
	}

	.mod-nav-link {
		color: #d4edda;
		text-decoration: none;
		font-size: var(--text-sm);
	}
	.mod-nav-link:hover { text-decoration: underline; color: #fff; }

	.mod-header__back {
		color: #9ecfa6;
		text-decoration: none;
		font-size: var(--text-xs);
	}
	.mod-header__back:hover { color: #d4edda; }

	.mod-content {
		flex: 1;
		padding: var(--space-8);
	}
</style>
