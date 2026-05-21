<script lang="ts">
	import { enhance } from '$app/forms';

	interface Label {
		uuid: string;
		name: string;
		color: string | null;
	}

	let {
		availableLabels,
		threadLabels
	}: {
		availableLabels: Label[];
		threadLabels: Label[];
	} = $props();

	const unassignedLabels = $derived(
		availableLabels.filter((l) => !threadLabels.some((tl) => tl.uuid === l.uuid))
	);
</script>

{#if availableLabels.length > 0}
	<div class="labels-section">
		<div class="labels-header">
			<span class="labels-title">Labels:</span>
			{#if threadLabels.length === 0}
				<span class="no-labels">None</span>
			{/if}
		</div>
		<div class="labels-content">
			<div class="current-labels">
				{#each threadLabels as label}
					<form method="POST" action="?/remove_label" use:enhance class="label-tag">
						<input type="hidden" name="label_uuid" value={label.uuid} />
						<span class="label-color" style="background-color: {label.color || '#999'}"></span>
						<span class="label-name">{label.name}</span>
						<button type="submit" class="label-remove" title="Remove label">×</button>
					</form>
				{/each}
			</div>
			<details class="add-label-dropdown">
				<summary class="add-label-btn">+ Add Label</summary>
				<div class="add-label-menu">
					{#each unassignedLabels as label}
						<form method="POST" action="?/add_label" use:enhance>
							<input type="hidden" name="label_uuid" value={label.uuid} />
							<button type="submit" class="label-option">
								<span class="label-color" style="background-color: {label.color || '#999'}"></span>
								<span class="label-name">{label.name}</span>
							</button>
						</form>
					{/each}
					{#if unassignedLabels.length === 0}
						<div class="no-more-labels">All labels applied</div>
					{/if}
				</div>
			</details>
		</div>
	</div>
{/if}

<style>
	.labels-section {
		padding: var(--space-4) var(--space-6);
		background: var(--parchment);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-4);
	}

	.labels-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.labels-title {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--ink-charcoal);
	}

	.no-labels {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--text-secondary);
		font-style: italic;
	}

	.labels-content {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.current-labels {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.label-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		background: white;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-xs);
	}

	.label-color {
		width: 12px;
		height: 12px;
		border-radius: 2px;
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.label-name {
		font-weight: 500;
		color: var(--text-primary);
	}

	.label-remove {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: var(--text-base);
		padding: 0 0.125rem;
		line-height: 1;
		transition: color 0.2s;
	}

	.label-remove:hover {
		color: var(--error-color, #c00);
	}

	.add-label-dropdown {
		position: relative;
	}

	.add-label-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		background: white;
		border: 1px dashed var(--border);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--postal-blue);
		cursor: pointer;
		list-style: none;
		transition: all 0.2s;
	}

	.add-label-btn:hover {
		border-color: var(--postal-blue);
		background: var(--paper-light-blue);
	}

	.add-label-btn::-webkit-details-marker {
		display: none;
	}

	.add-label-menu {
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 0.25rem;
		background: white;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 150px;
		max-height: 200px;
		overflow-y: auto;
		z-index: 10;
	}

	.add-label-menu form {
		display: block;
	}

	.label-option {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: none;
		border: none;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
		transition: background 0.2s;
	}

	.label-option:hover {
		background: var(--paper-light-blue);
	}

	.no-more-labels {
		padding: 0.75rem;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--text-secondary);
		font-style: italic;
		text-align: center;
	}
</style>
