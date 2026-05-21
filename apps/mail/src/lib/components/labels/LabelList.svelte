<script lang="ts">
	import { EmptyState } from '@bfs/ui';
	import LabelCard from './LabelCard.svelte';

	interface Label {
		uuid: string;
		name: string;
		color: string | null;
		thread_count: number;
	}

	let { labels, onEdit }: { labels: Label[]; onEdit: (label: Label) => void } = $props();
</script>

{#if labels.length === 0}
	<EmptyState
		icon="🏷️"
		title="No labels yet"
		message="Create your first label to organize your messages"
	/>
{:else}
	<div class="labels-list">
		{#each labels as label}
			<LabelCard {label} onEdit={() => onEdit(label)} />
		{/each}
	</div>
{/if}

<style>
	.labels-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
