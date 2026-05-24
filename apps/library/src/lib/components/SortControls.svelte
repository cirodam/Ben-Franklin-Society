<!--
  @component SortControls
  Sorting controls for file/folder lists with visual indicators for active sort.
  
  @prop {'name' | 'size' | 'date'} sortBy - Currently active sort column
  @prop {'asc' | 'desc'} sortDir - Sort direction
  @prop {(column: 'name' | 'size' | 'date') => void} onToggleSort - Callback when sort changes
-->
<script lang="ts">
	interface Props {
		sortBy: 'name' | 'size' | 'date';
		sortDir: 'asc' | 'desc';
		onToggleSort: (column: 'name' | 'size' | 'date') => void;
	}
	
	let { sortBy, sortDir, onToggleSort }: Props = $props();
</script>

<div style="display: flex; gap: 0.5rem; align-items: center; color: var(--ink-muted); font-size: 0.875rem;">
	<span>Sort by:</span>
	<button 
		onclick={() => onToggleSort('name')} 
		class="btn btn--secondary"
		style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
	>
		Name {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
	</button>
	<button 
		onclick={() => onToggleSort('size')} 
		class="btn btn--secondary"
		style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
	>
		Size {sortBy === 'size' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
	</button>
	<button 
		onclick={() => onToggleSort('date')} 
		class="btn btn--secondary"
		style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
	>
		Date {sortBy === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
	</button>
</div>
