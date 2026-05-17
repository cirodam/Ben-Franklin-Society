<script lang="ts">
	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	let { items }: { items: BreadcrumbItem[] } = $props();
</script>

<nav class="breadcrumb">
	{#each items as item, i}
		{#if i > 0}
			<span class="breadcrumb__separator">›</span>
		{/if}
		{#if item.href}
			<a href={item.href} class="breadcrumb__link">{item.label}</a>
		{:else}
			<span class="breadcrumb__current">{item.label}</span>
		{/if}
	{/each}
</nav>

<style>
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
	}

	.breadcrumb__link {
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.breadcrumb__link:hover {
		text-decoration: underline;
	}

	.breadcrumb__separator {
		color: var(--color-text-muted);
	}

	.breadcrumb__current {
		color: var(--color-text);
	}
</style>
