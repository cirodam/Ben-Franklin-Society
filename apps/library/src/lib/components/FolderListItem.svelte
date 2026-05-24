<!--
  @component FolderListItem
  Table row for a single folder with selection, rename, navigation, and delete actions.
  
  @prop {{id: number, name: string, created_at: string}} folder - Folder data
  @prop {boolean} isSelected - Whether folder is selected
  @prop {boolean} isRenaming - Whether folder is being renamed
  @prop {string} renameValue - Current rename input value
  @prop {() => void} onToggleSelection - Toggle folder selection
  @prop {() => void} onNavigate - Navigate into folder
  @prop {() => void} onStartRename - Start renaming folder
  @prop {() => void} onSaveRename - Save folder rename
  @prop {() => void} onCancelRename - Cancel folder rename
  @prop {() => void} onDelete - Delete folder
-->
<script lang="ts">
	import { formatDate } from '$lib/utils.js';
	
	interface Props {
		folder: { id: number; name: string; created_at: string };
		isSelected: boolean;
		isRenaming: boolean;
		renameValue: string;
		onToggleSelection: () => void;
		onNavigate: () => void;
		onStartRename: () => void;
		onSaveRename: () => void;
		onCancelRename: () => void;
		onDelete: () => void;
	}
	
	let {
		folder,
		isSelected,
		isRenaming,
		renameValue = $bindable(),
		onToggleSelection,
		onNavigate,
		onStartRename,
		onSaveRename,
		onCancelRename,
		onDelete
	}: Props = $props();
</script>

<tr style="border-bottom: 1px solid var(--border);">
	<td style="padding: 0.5rem; text-align: center;">
		<input 
			type="checkbox" 
			checked={isSelected}
			onchange={onToggleSelection}
			style="cursor: pointer;"
		/>
	</td>
	<td style="padding: 0.5rem;">
		{#if isRenaming}
			<div style="display: flex; gap: 0.25rem; align-items: center;">
				<input 
					type="text" 
					bind:value={renameValue}
					style="padding: 0.25rem; flex: 1;"
					onkeydown={(e) => {
						if (e.key === 'Enter') onSaveRename();
						if (e.key === 'Escape') onCancelRename();
					}}
				/>
				<button onclick={onSaveRename} class="btn btn--primary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Save</button>
				<button onclick={onCancelRename} class="btn btn--secondary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cancel</button>
			</div>
		{:else}
			<button 
				onclick={onNavigate} 
				style="background: none; border: none; color: var(--gold); cursor: pointer; padding: 0; font-family: inherit; text-align: left;"
			>
				📁 {folder.name}
			</button>
		{/if}
	</td>
	<td style="padding: 0.5rem;" class="t-label">Folder</td>
	<td style="padding: 0.5rem;">{formatDate(folder.created_at)}</td>
	<td style="padding: 0.5rem; text-align: right;">
		{#if !isRenaming}
			<div class="row" style="justify-content: flex-end; gap: 0.5rem;">
				<button 
					onclick={onStartRename} 
					class="btn btn--secondary" 
					style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
				>
					Rename
				</button>
				<button 
					onclick={onDelete} 
					class="btn btn--secondary" 
					style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
				>
					Delete
				</button>
			</div>
		{/if}
	</td>
</tr>
