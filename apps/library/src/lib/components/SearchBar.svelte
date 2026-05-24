<!--
  @component SearchBar
  Search input field for filtering files and folders.
  
  @prop {string} value - Current search query
  @prop {(value: string) => void} oninput - Callback when search value changes
  @prop {string} [placeholder='Search files...'] - Input placeholder text
-->
<script lang="ts">
	interface Props {
		value: string;
		oninput: (value: string) => void;
		placeholder?: string;
	}
	
	let { value = $bindable(), placeholder = 'Search files...' }: Props = $props();
</script>

<input 
	type="text"
	bind:value
	{placeholder}
	style="padding: 0.25rem 0.5rem; width: 200px;"
/>
