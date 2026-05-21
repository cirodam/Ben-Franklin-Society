<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@bfs/ui';

	interface Label {
		uuid: string;
		name: string;
		color: string | null;
		thread_count: number;
	}

	let { label, onEdit }: { label: Label; onEdit: () => void } = $props();
</script>

<div class="label-card">
	<div class="label-info">
		<div class="label-preview">
			<span class="label-color" style="background-color: {label.color || '#999'}"></span>
			<span class="label-name">{label.name}</span>
		</div>
		<span class="label-count"
			>{label.thread_count} thread{label.thread_count !== 1 ? 's' : ''}</span
		>
	</div>
	<div class="label-actions">
		<Button size="sm" onclick={onEdit}>Edit</Button>
		<form method="POST" action="?/delete" use:enhance>
			<input type="hidden" name="uuid" value={label.uuid} />
			<Button
				type="submit"
				size="sm"
				variant="danger"
				onclick={(e) => {
					if (!confirm(`Delete label "${label.name}"?`)) e.preventDefault();
				}}
			>
				Delete
			</Button>
		</form>
		<a href="/labels/{label.uuid}">
			<Button size="sm" variant="secondary">View Threads</Button>
		</a>
	</div>
</div>

<style>
	.label-card {
		border: 1px solid var(--border-color, #ddd);
		border-radius: 6px;
		padding: 1.5rem;
		background: var(--card-background, white);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.label-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.label-preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.label-color {
		width: 20px;
		height: 20px;
		border-radius: 4px;
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.label-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.label-count {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-family: var(--font-mono);
	}

	.label-actions {
		display: flex;
		gap: 0.5rem;
	}

	.label-actions form {
		display: inline;
	}
</style>
