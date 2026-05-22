<script lang="ts">
	import '@bfs/ui/src/theme.css';
	import '../../mail-theme.css';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

{@render children()}
