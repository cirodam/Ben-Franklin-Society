<script lang="ts">
	let {
		query = $bindable(''),
		onSubmit
	}: {
		query?: string;
		onSubmit: () => void;
	} = $props();

	function handleSubmit(event: Event) {
		event.preventDefault();
		onSubmit();
	}
</script>

<form class="search-main" onsubmit={handleSubmit}>
	<input
		type="search"
		bind:value={query}
		placeholder="Search messages..."
		class="search-input"
		autofocus
	/>
	<button type="submit" class="search-button">Search</button>
</form>

<style>
	.search-main {
		display: flex;
		gap: var(--space-3);
	}

	.search-input {
		flex: 1;
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-sans);
		font-size: var(--text-base);
		border: 2px solid var(--border-strong);
		border-radius: var(--radius);
		background: white;
		color: var(--ink-navy);
		transition: border-color 0.2s;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--postal-blue);
		box-shadow: 0 0 0 3px var(--postal-blue-light);
	}

	.search-button {
		padding: var(--space-3) var(--space-6);
		font-family: var(--font-sans);
		font-size: var(--text-base);
		font-weight: 600;
		background: var(--postal-blue);
		color: white;
		border: none;
		border-radius: var(--radius);
		cursor: pointer;
		transition: background 0.2s;
	}

	.search-button:hover {
		background: var(--postal-blue-dark);
	}
</style>
