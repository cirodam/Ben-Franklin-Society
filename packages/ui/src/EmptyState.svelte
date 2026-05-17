<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		icon = undefined,
		title,
		description = undefined,
		actions = undefined
	}: {
		icon?: string;
		title: string;
		description?: string;
		actions?: Snippet;
	} = $props();
</script>

<div class="empty-state">
	{#if icon}
		<div class="empty-state-icon" aria-hidden="true">{icon}</div>
	{/if}
	<h2 class="empty-state-title">{title}</h2>
	{#if description}
		<p class="empty-state-description">{description}</p>
	{/if}
	{#if actions}
		<div class="empty-state-actions">
			{@render actions()}
		</div>
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: var(--space-12) var(--space-6);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-muted);
		min-height: 300px;
	}

	.empty-state-icon {
		font-size: var(--text-4xl);
		margin-bottom: var(--space-4);
		opacity: 0.5;
	}

	.empty-state-title {
		margin: 0 0 var(--space-2);
		font-size: var(--text-lg);
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	.empty-state-description {
		margin: 0 0 var(--space-6);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		max-width: 400px;
		line-height: 1.5;
	}

	.empty-state-actions {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
		justify-content: center;
	}
</style>
