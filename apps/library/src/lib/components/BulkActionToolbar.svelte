<!--
  @component BulkActionToolbar
  Displays bulk action controls when files/folders are selected.
  Allows bulk move (files only) and bulk delete operations.
  
  @prop {Set<number>} selectedFileIds - Currently selected file IDs
  @prop {Set<number>} selectedFolderIds - Currently selected folder IDs
  @prop {Array<{id: number, name: string}>} folders - Available folders for move destination
  @prop {() => void} onClearSelection - Clear all selections
  @prop {() => Promise<void>} onBulkMove - Execute bulk move operation
  @prop {() => Promise<void>} onBulkDelete - Execute bulk delete operation
  @prop {number | null | 'placeholder'} bulkMoveDestination - Current move destination selection
-->
<script lang="ts">
	interface Props {
		selectedFileIds: Set<number>;
		selectedFolderIds: Set<number>;
		folders: Array<{ id: number; name: string }>;
		onClearSelection: () => void;
		onBulkMove: () => Promise<void>;
		onBulkDelete: () => Promise<void>;
		bulkMoveDestination: number | null | 'placeholder';
	}
	
	let {
		selectedFileIds,
		selectedFolderIds,
		folders,
		onClearSelection,
		onBulkMove,
		onBulkDelete,
		bulkMoveDestination = $bindable()
	}: Props = $props();
	
	let totalSelected = $derived(selectedFileIds.size + selectedFolderIds.size);
</script>

<div style="padding: 1rem; background: var(--paper-dark); border: 1px solid var(--border); display: flex; gap: 1rem; align-items: center; justify-content: space-between;">
	<div style="display: flex; gap: 1rem; align-items: center;">
		<span class="t-label">
			{totalSelected} item{totalSelected !== 1 ? 's' : ''} selected
		</span>
		<button onclick={onClearSelection} class="btn btn--secondary" style="font-size: 0.875rem;">
			Clear Selection
		</button>
	</div>
	<div style="display: flex; gap: 0.5rem; align-items: center;">
		{#if selectedFileIds.size > 0 && selectedFolderIds.size === 0}
			<select 
				bind:value={bulkMoveDestination} 
				style="padding: 0.5rem; font-family: inherit;"
			>
				<option value="placeholder">Move to...</option>
				<option value={null}>Root</option>
				{#each folders as folder}
					<option value={folder.id}>{folder.name}</option>
				{/each}
			</select>
			<button 
				onclick={onBulkMove} 
				class="btn btn--primary"
				disabled={bulkMoveDestination === 'placeholder'}
			>
				Move Selected
			</button>
		{/if}
		<button onclick={onBulkDelete} class="btn btn--secondary" style="background: var(--danger); color: white;">
			Delete Selected
		</button>
	</div>
</div>
