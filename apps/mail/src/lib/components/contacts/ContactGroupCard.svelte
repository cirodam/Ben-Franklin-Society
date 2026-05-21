<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Input } from '@bfs/ui';

	interface Member {
		handle_cache: string;
	}

	interface ContactGroup {
		uuid: string;
		name: string;
		members: Member[];
	}

	let {
		group,
		isEditing = false,
		onEdit,
		onCancelEdit
	}: {
		group: ContactGroup;
		isEditing?: boolean;
		onEdit: () => void;
		onCancelEdit: () => void;
	} = $props();

	let groupName = $state(group.name);
	let groupMembers = $state(group.members.map((m) => '@' + m.handle_cache).join(', '));
</script>

<div class="group-card">
	{#if isEditing}
		<!-- Edit Mode -->
		<form
			method="POST"
			action="?/update"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						onCancelEdit();
					}
				};
			}}
			class="edit-form"
		>
			<input type="hidden" name="uuid" value={group.uuid} />
			<h3>Edit Group</h3>
			<div class="form-group">
				<label for="edit-name-{group.uuid}">Group Name</label>
				<Input id="edit-name-{group.uuid}" name="name" type="text" bind:value={groupName} required />
			</div>
			<div class="form-group">
				<label for="edit-members-{group.uuid}">Members</label>
				<textarea
					id="edit-members-{group.uuid}"
					name="members"
					bind:value={groupMembers}
					rows={3}
					required
				></textarea>
			</div>
			<div class="form-actions">
				<Button type="submit">Save</Button>
				<Button type="button" variant="secondary" onclick={onCancelEdit}>Cancel</Button>
			</div>
		</form>
	{:else}
		<!-- View Mode -->
		<div class="group-header">
			<h3>{group.name}</h3>
			<div class="group-actions">
				<button type="button" onclick={onEdit} class="action-btn">Edit</button>
				<form method="POST" action="?/delete" use:enhance>
					<input type="hidden" name="uuid" value={group.uuid} />
					<button
						type="submit"
						class="action-btn action-btn--delete"
						onclick={(e) => {
							if (!confirm(`Delete group "${group.name}"?`)) {
								e.preventDefault();
							}
						}}
					>
						Delete
					</button>
				</form>
			</div>
		</div>
		<div class="group-members">
			<div class="members-label">
				{group.members.length} member{group.members.length === 1 ? '' : 's'}:
			</div>
			<div class="members-list">
				{#each group.members as member}
					<span class="member-badge">@{member.handle_cache}</span>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.group-card {
		background: white;
		border: 2px solid var(--border-strong);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
	}

	.group-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-3);
	}

	.group-header h3 {
		margin: 0;
		font-family: var(--font-sans);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--ink-navy);
	}

	.group-actions {
		display: flex;
		gap: var(--space-2);
	}

	.action-btn {
		padding: 0.375rem 0.75rem;
		background: white;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--postal-blue);
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-btn:hover {
		background: var(--paper-light-blue);
		border-color: var(--postal-blue-mid);
	}

	.action-btn--delete {
		color: #c00;
	}

	.action-btn--delete:hover {
		background: #fee;
		border-color: #fcc;
	}

	.group-members {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.members-label {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--ink-charcoal);
	}

	.members-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.member-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background: var(--paper-light-blue);
		border: 1px solid var(--postal-blue-mid);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--postal-blue-dark);
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.edit-form h3 {
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

	.form-actions {
		display: flex;
		gap: var(--space-2);
	}
</style>
