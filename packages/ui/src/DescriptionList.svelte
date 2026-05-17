<script lang="ts">
	interface DescriptionItem {
		label: string;
		value: string | number | null | undefined;
	}

	let {
		items,
		gap = 'var(--space-3)'
	}: {
		items: DescriptionItem[];
		gap?: string;
	} = $props();
</script>

<div class="description-list" style="--list-gap: {gap};">
	{#each items as item}
		{#if item.value != null}
			<div class="description-item">
				<span class="description-item__label">{item.label}:</span>
				<span class="description-item__value">{item.value}</span>
			</div>
		{/if}
	{/each}
</div>

<style>
	.description-list {
		display: flex;
		flex-direction: column;
		gap: var(--list-gap);
	}

	.description-item {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		font-size: var(--text-sm);
	}

	.description-item__label {
		color: var(--color-text-muted);
		font-weight: var(--weight-medium);
	}

	.description-item__value {
		color: var(--color-text);
	}
</style>
