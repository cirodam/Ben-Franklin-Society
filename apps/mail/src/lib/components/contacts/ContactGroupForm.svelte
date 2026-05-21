<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Input } from '@bfs/ui';

	let {
		groupName = $bindable(''),
		groupMembers = $bindable(''),
		onCancel
	}: {
		groupName: string;
		groupMembers: string;
		onCancel: () => void;
	} = $props();
</script>

<form
	method="POST"
	action="?/create"
	use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				onCancel();
			}
		};
	}}
	class="create-form"
>
	<h3>Create New Group</h3>
	<div class="form-group">
		<label for="create-name">Group Name</label>
		<Input
			id="create-name"
			name="name"
			type="text"
			bind:value={groupName}
			placeholder="e.g., City Council"
			required
		/>
	</div>
	<div class="form-group">
		<label for="create-members">Members (comma-separated handles)</label>
		<textarea
			id="create-members"
			name="members"
			bind:value={groupMembers}
			placeholder="e.g., @alice, @bob, @charlie"
			rows={3}
			required
		></textarea>
		<div class="help-text">Enter handles with @, separated by commas</div>
	</div>
	<div class="form-actions">
		<Button type="submit">Create Group</Button>
		<Button type="button" variant="secondary" onclick={onCancel}>Cancel</Button>
	</div>
</form>

<style>
	.create-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-5);
		background: white;
		border: 2px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
	}

	.create-form h3 {
		margin: 0;
		font-family: var(--font-sans);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--ink-navy);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-group label {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--ink-charcoal);
	}

	.form-group textarea {
		width: 100%;
		padding: var(--space-3);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		font-family: var(--font-sans);
		font-size: var(--text-base);
		line-height: 1.5;
		resize: vertical;
	}

	.form-group textarea:focus {
		outline: none;
		border-color: var(--postal-blue);
		box-shadow: 0 0 0 3px var(--paper-light-blue);
	}

	.help-text {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		color: var(--text-secondary);
		font-style: italic;
	}

	.form-actions {
		display: flex;
		gap: var(--space-2);
	}
</style>
