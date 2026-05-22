<script lang="ts">
	type Category = 'announcement' | 'discussion' | 'question' | 'event' | 'policy' | null;
	
	let { category }: { category: Category } = $props();
</script>

{#if category}
	<span class="category-badge {category}">
		{category}
	</span>
{/if}

<style>
	.category-badge {
		font-size: var(--text-xs);
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		background: var(--bg-secondary);
		color: var(--text-muted);
		text-transform: capitalize;
		font-weight: var(--weight-medium);
	}

	.category-badge.announcement {
		background: var(--blue-100);
		color: var(--blue-700);
	}

	.category-badge.discussion {
		background: var(--purple-100);
		color: var(--purple-700);
	}

	.category-badge.question {
		background: var(--amber-100);
		color: var(--amber-700);
	}

	.category-badge.event {
		background: var(--green-100);
		color: var(--green-700);
	}

	.category-badge.policy {
		background: var(--red-100);
		color: var(--red-700);
	}
</style>
