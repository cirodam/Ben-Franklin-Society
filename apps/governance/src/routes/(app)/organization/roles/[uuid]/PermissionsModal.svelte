<script lang="ts">
	import { Button, Modal, Checkbox } from '@bfs/ui';
	import { enhance } from '$app/forms';

	interface Props {
		open: boolean;
		currentPermissions: Array<{ app: string; permission: string }>;
		availablePermissions: Array<{
			app: string;
			label: string;
			permissions: Array<{ value: string; label: string }>;
		}>;
		onclose: () => void;
	}

	let { open = $bindable(), currentPermissions, availablePermissions, onclose }: Props = $props();

	let selectedPermissions = $state<Set<string>>(new Set());

	$effect(() => {
		if (open) {
			// Initialize selected permissions from current role permissions
			selectedPermissions = new Set(currentPermissions.map(p => `${p.app}:${p.permission}`));
		}
	});

	function togglePermission(app: string, permission: string) {
		const key = `${app}:${permission}`;
		if (selectedPermissions.has(key)) {
			selectedPermissions.delete(key);
		} else {
			selectedPermissions.add(key);
		}
		selectedPermissions = selectedPermissions; // Trigger reactivity
	}

	function getPermissionsArray() {
		return Array.from(selectedPermissions).map(key => {
			const [app, permission] = key.split(':');
			return { app, permission };
		});
	}

	function handleClose() {
		open = false;
		onclose();
	}
</script>

<Modal bind:open title="Edit Permissions" size="lg">
	<form method="POST" action="?/update_permissions" use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				handleClose();
			}
		};
	}}>
		<input type="hidden" name="permissions" value={JSON.stringify(getPermissionsArray())} />
		
		<div class="permissions-selector">
			<p class="selector-description">
				Select the permissions this role should have. Permissions are organized by application.
			</p>
			
			{#each availablePermissions as appGroup}
				<div class="app-group">
					<h4 class="app-group-title">{appGroup.label}</h4>
					<div class="permissions-checkboxes">
						{#each appGroup.permissions as perm}
							<Checkbox
								checked={selectedPermissions.has(`${appGroup.app}:${perm.value}`)}
								onchange={() => togglePermission(appGroup.app, perm.value)}
							>
								{perm.label}
							</Checkbox>
						{/each}
					</div>
				</div>
			{/each}

			<div class="selected-summary">
				<strong>{selectedPermissions.size}</strong> permission{selectedPermissions.size !== 1 ? 's' : ''} selected
			</div>
		</div>

		<div class="modal-actions">
			<Button type="submit">Save Changes</Button>
			<Button type="button" variant="secondary" onclick={handleClose}>
				Cancel
			</Button>
		</div>
	</form>
</Modal>

<style>
	.permissions-selector {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.selector-description {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #374340;
		margin: 0;
		padding-bottom: var(--space-3);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.app-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.app-group-title {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-lg);
		font-weight: 400;
		color: #151c1a;
		margin: 0;
		padding-bottom: var(--space-2);
		border-bottom: 1px solid rgba(45, 90, 79, 0.1);
	}

	.permissions-checkboxes {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: var(--space-2);
	}

	.permissions-checkboxes :global(.checkbox-wrapper) {
		padding: var(--space-2);
		transition: background 0.2s;
	}

	.permissions-checkboxes :global(.checkbox-wrapper:hover) {
		background: rgba(250, 250, 247, 0.7);
	}

	.permissions-checkboxes :global(.checkbox-label) {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #151c1a;
	}

	.selected-summary {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: #7a5c1a;
		padding: var(--space-3);
		background: rgba(122, 92, 26, 0.05);
		border: 1px solid rgba(122, 92, 26, 0.2);
		text-align: center;
	}

	.selected-summary strong {
		font-weight: 600;
		font-size: var(--text-lg);
	}

	.modal-actions {
		display: flex;
		gap: var(--space-2);
		justify-content: flex-end;
		margin-top: var(--space-5);
		padding-top: var(--space-4);
		border-top: 1px solid rgba(45, 90, 79, 0.15);
	}
</style>
