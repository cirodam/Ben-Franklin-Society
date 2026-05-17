<script lang="ts">
	let { ...rest }: { [key: string]: unknown } = $props();
</script>

<hr class="sidebar-divider" {...rest} />

<style>
	.sidebar-divider {
		border: none;
		border-top: 1px solid var(--color-border-faint);
		margin: var(--space-2) var(--space-4);
	}
</style>
