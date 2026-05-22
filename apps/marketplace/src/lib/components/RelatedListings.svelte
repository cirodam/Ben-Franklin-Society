<script lang="ts">
	interface RelatedSection {
		label: string;
		items: Array<{ uuid: string; title: string }>;
		basePath: string;
	}

	interface Props {
		sections: RelatedSection[];
	}

	let { sections }: Props = $props();
</script>

<aside class="sidebar">
	{#each sections as section}
		{#if section.items.length > 0}
			<div class="sidebar-section">
				<div class="sidebar-label">{section.label}</div>
				{#each section.items as item}
					<a href="{section.basePath}/{item.uuid}" class="sidebar-link">{item.title}</a>
				{/each}
			</div>
		{/if}
	{/each}
</aside>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.sidebar-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.sidebar-label {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-1);
	}

	.sidebar-link {
		font-size: var(--text-sm);
		color: var(--color-text);
		text-decoration: none;
		padding: var(--space-1) 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
	}

	.sidebar-link:hover {
		text-decoration: underline;
	}
</style>
