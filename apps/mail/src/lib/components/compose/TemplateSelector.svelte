<script lang="ts">
	interface Template {
		uuid: string;
		name: string;
		subject: string;
		body: string;
	}

	let {
		templates,
		selectedTemplate = $bindable(''),
		onTemplateSelect
	}: {
		templates: Template[];
		selectedTemplate?: string;
		onTemplateSelect?: (template: Template | null) => void;
	} = $props();

	$effect(() => {
		if (selectedTemplate && onTemplateSelect) {
			const template = templates.find((t) => t.uuid === selectedTemplate);
			onTemplateSelect(template || null);
		} else if (!selectedTemplate && onTemplateSelect) {
			onTemplateSelect(null);
		}
	});
</script>

{#if templates.length > 0}
	<div class="template-selector">
		<label for="template-select" class="label">Use Template (optional)</label>
		<select id="template-select" bind:value={selectedTemplate} class="template-select">
			<option value="">-- No template --</option>
			{#each templates as template}
				<option value={template.uuid}>{template.name}</option>
			{/each}
		</select>
	</div>
{/if}

<style>
	.template-selector {
		padding: var(--space-4);
		background: var(--paper-light-blue);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-base);
	}

	.label {
		display: block;
		margin-bottom: var(--space-2);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--ink-charcoal);
	}

	.template-select {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--border-base);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-base);
		background: white;
		cursor: pointer;
	}

	.template-select:focus {
		outline: 2px solid var(--postal-primary);
		outline-offset: 2px;
	}
</style>
