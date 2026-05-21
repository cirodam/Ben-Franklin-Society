<script lang="ts">
	import { EmptyState } from '@bfs/ui';
	import TemplateCard from './TemplateCard.svelte';

	interface Template {
		uuid: string;
		name: string;
		subject: string;
		body: string;
	}

	let {
		templates,
		previewUuid = $bindable(null),
		onEdit
	}: {
		templates: Template[];
		previewUuid: string | null;
		onEdit: (template: Template) => void;
	} = $props();

	function togglePreview(uuid: string) {
		previewUuid = previewUuid === uuid ? null : uuid;
	}
</script>

{#if templates.length === 0}
	<EmptyState
		icon="📝"
		title="No templates yet"
		message="Create your first template to get started"
	/>
{:else}
	<div class="templates-list">
		{#each templates as template}
			<TemplateCard
				{template}
				showPreview={previewUuid === template.uuid}
				onTogglePreview={() => togglePreview(template.uuid)}
				onEdit={() => onEdit(template)}
			/>
		{/each}
	</div>
{/if}

<style>
	.templates-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
