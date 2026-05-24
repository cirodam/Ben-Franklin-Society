<!--
  @component FileListTable
  Table displaying files and folders with selection, sorting, and bulk operations.
  
  @prop {Array} files - Array of file metadata
  @prop {Array} folders - Array of folder metadata
  @prop {Array} allFolders - All folders (for move dropdown)
  @prop {Set<number>} selectedFileIds - Selected file IDs
  @prop {Set<number>} selectedFolderIds - Selected folder IDs
  @prop {boolean} allVisibleSelected - Whether all visible items are selected
  @prop {number | null} renamingFileId - ID of file being renamed
  @prop {number | null} renamingFolderId - ID of folder being renamed
  @prop {string} renameValue - Current rename input value
  @prop {number | null} movingFileId - ID of file being moved
  @prop {number | null} moveDestinationFolderId - Destination folder for move
  @prop {() => void} onToggleAllSelection - Toggle all visible selections
  @prop {(id: number) => void} onToggleFileSelection - Toggle file selection
  @prop {(id: number) => void} onToggleFolderSelection - Toggle folder selection
  @prop {(id: number) => void} onNavigateToFolder - Navigate to folder
  @prop {(id: number, name: string) => void} onStartRenamingFile - Start renaming file
  @prop {(id: number, name: string) => void} onStartRenamingFolder - Start renaming folder
  @prop {() => void} onSaveRename - Save rename
  @prop {() => void} onCancelRename - Cancel rename
  @prop {(id: number) => void} onStartMovingFile - Start moving file
  @prop {() => void} onSaveMove - Save move
  @prop {() => void} onCancelMove - Cancel move
  @prop {(id: number) => void} onDeleteFile - Delete file
  @prop {(id: number) => void} onDeleteFolder - Delete folder
-->
<script lang="ts">
	import FileListItem from './FileListItem.svelte';
	import FolderListItem from './FolderListItem.svelte';
	
	interface FileMetadata {
		id: number;
		filename: string;
		document_title?: string;
		document_type?: string;
		uploaded_at: string;
	}
	
	interface FolderMetadata {
		id: number;
		name: string;
		created_at: string;
	}
	
	interface Props {
		files: FileMetadata[];
		folders: FolderMetadata[];
		allFolders: Array<{ id: number; name: string }>;
		selectedFileIds: Set<number>;
		selectedFolderIds: Set<number>;
		allVisibleSelected: boolean;
		renamingFileId: number | null;
		renamingFolderId: number | null;
		renameValue: string;
		movingFileId: number | null;
		moveDestinationFolderId: number | null;
		onToggleAllSelection: () => void;
		onToggleFileSelection: (id: number) => void;
		onToggleFolderSelection: (id: number) => void;
		onNavigateToFolder: (id: number) => void;
		onStartRenamingFile: (id: number, name: string) => void;
		onStartRenamingFolder: (id: number, name: string) => void;
		onSaveRename: () => void;
		onCancelRename: () => void;
		onStartMovingFile: (id: number) => void;
		onSaveMove: () => void;
		onCancelMove: () => void;
		onDeleteFile: (id: number) => void;
		onDeleteFolder: (id: number) => void;
	}
	
	let {
		files,
		folders,
		allFolders,
		selectedFileIds,
		selectedFolderIds,
		allVisibleSelected,
		renamingFileId,
		renamingFolderId,
		renameValue = $bindable(),
		movingFileId,
		moveDestinationFolderId = $bindable(),
		onToggleAllSelection,
		onToggleFileSelection,
		onToggleFolderSelection,
		onNavigateToFolder,
		onStartRenamingFile,
		onStartRenamingFolder,
		onSaveRename,
		onCancelRename,
		onStartMovingFile,
		onSaveMove,
		onCancelMove,
		onDeleteFile,
		onDeleteFolder
	}: Props = $props();
</script>

<table style="width: 100%; border-collapse: collapse;">
	<thead>
		<tr style="border-bottom: 1px solid var(--border-heavy);">
			<th style="text-align: center; padding: 0.5rem; width: 40px;">
				<input 
					type="checkbox" 
					checked={allVisibleSelected}
					onchange={onToggleAllSelection}
					style="cursor: pointer;"
				/>
			</th>
			<th style="text-align: left; padding: 0.5rem;" class="t-label">Name</th>
			<th style="text-align: left; padding: 0.5rem;" class="t-label">Type</th>
			<th style="text-align: left; padding: 0.5rem;" class="t-label">Date</th>
			<th style="text-align: right; padding: 0.5rem;" class="t-label">Actions</th>
		</tr>
	</thead>
	<tbody>
		<!-- Folders -->
		{#each folders as folder}
			<FolderListItem 
				{folder}
				isSelected={selectedFolderIds.has(folder.id)}
				isRenaming={renamingFolderId === folder.id}
				bind:renameValue
				onToggleSelection={() => onToggleFolderSelection(folder.id)}
				onNavigate={() => onNavigateToFolder(folder.id)}
				onStartRename={() => onStartRenamingFolder(folder.id, folder.name)}
				onSaveRename={onSaveRename}
				onCancelRename={onCancelRename}
				onDelete={() => onDeleteFolder(folder.id)}
			/>
		{/each}
		
		<!-- Files -->
		{#each files as file}
			<FileListItem 
				{file}
				isSelected={selectedFileIds.has(file.id)}
				isRenaming={renamingFileId === file.id}
				isMoving={movingFileId === file.id}
				bind:renameValue
				bind:moveDestination={moveDestinationFolderId}
				folders={allFolders}
				onToggleSelection={() => onToggleFileSelection(file.id)}
				onStartRename={() => onStartRenamingFile(file.id, file.filename)}
				onSaveRename={onSaveRename}
				onCancelRename={onCancelRename}
				onStartMove={() => onStartMovingFile(file.id)}
				onSaveMove={onSaveMove}
				onCancelMove={onCancelMove}
				onDelete={() => onDeleteFile(file.id)}
			/>
		{/each}
	</tbody>
</table>
