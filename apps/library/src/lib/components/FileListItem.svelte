<!--
  @component FileListItem
  Table row for a single file with selection, rename, move, download, open, and delete actions.
  
  @prop {{id: number, filename: string, document_title?: string, document_type?: string, uploaded_at: string}} file - File data
  @prop {boolean} isSelected - Whether file is selected
  @prop {boolean} isRenaming - Whether file is being renamed
  @prop {boolean} isMoving - Whether file is being moved
  @prop {string} renameValue - Current rename input value
  @prop {number | null} moveDestination - Current move destination folder ID
  @prop {Array<{id: number, name: string}>} folders - Available folders for move
  @prop {() => void} onToggleSelection - Toggle file selection
  @prop {() => void} onStartRename - Start renaming file
  @prop {() => void} onSaveRename - Save file rename
  @prop {() => void} onCancelRename - Cancel file rename
  @prop {() => void} onStartMove - Start moving file
  @prop {() => void} onSaveMove - Save file move
  @prop {() => void} onCancelMove - Cancel file move
  @prop {() => void} onDelete - Delete file
-->
<script lang="ts">
	import { formatDate } from '$lib/utils.js';
	
	interface Props {
		file: {
			id: number;
			filename: string;
			document_title?: string;
			document_type?: string;
			uploaded_at: string;
		};
		isSelected: boolean;
		isRenaming: boolean;
		isMoving: boolean;
		renameValue: string;
		moveDestination: number | null;
		folders: Array<{ id: number; name: string }>;
		onToggleSelection: () => void;
		onStartRename: () => void;
		onSaveRename: () => void;
		onCancelRename: () => void;
		onStartMove: () => void;
		onSaveMove: () => void;
		onCancelMove: () => void;
		onDelete: () => void;
	}
	
	let {
		file,
		isSelected,
		isRenaming,
		isMoving,
		renameValue = $bindable(),
		moveDestination = $bindable(),
		folders,
		onToggleSelection,
		onStartRename,
		onSaveRename,
		onCancelRename,
		onStartMove,
		onSaveMove,
		onCancelMove,
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
			<div style="display: flex; align-items: center; gap: 0.5rem;">
				<span>{file.document_title || file.filename}</span>
			</div>
		{/if}
	</td>
	<td style="padding: 0.5rem;">
		{#if file.document_type}
			<span class="document-type-badge">{file.document_type}</span>
		{:else}
			—
		{/if}
	</td>
	<td style="padding: 0.5rem;">{formatDate(file.uploaded_at)}</td>
	<td style="padding: 0.5rem; text-align: right;">
		{#if isMoving}
			<div style="display: flex; gap: 0.25rem; align-items: center; justify-content: flex-end;">
				<select bind:value={moveDestination} style="padding: 0.25rem;">
					<option value={null}>Root</option>
					{#each folders as folder}
						<option value={folder.id}>{folder.name}</option>
					{/each}
				</select>
				<button onclick={onSaveMove} class="btn btn--primary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Move</button>
				<button onclick={onCancelMove} class="btn btn--secondary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cancel</button>
			</div>
		{:else if !isRenaming}
			<div class="row" style="justify-content: flex-end; gap: 0.5rem;">
				<a href="/api/files/{file.id}" class="btn btn--secondary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
					Download
				</a>
				{#if file.filename.endsWith('.json')}
					<a href="/documents/{file.id}" class="btn btn--primary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
						Open
					</a>
				{/if}
				<button 
					onclick={onStartRename} 
					class="btn btn--secondary" 
					style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
				>
					Rename
				</button>
			</div>
		{/if}
	</td>
</tr>

<style>
	.document-type-badge {
		font-family: var(--font-label);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.125rem var(--space-2);
		background: var(--tint-green);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--ink-muted);
		white-space: nowrap;
		flex-shrink: 0;
	}
</style>
