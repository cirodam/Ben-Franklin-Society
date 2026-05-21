<script lang="ts">
	let {
		senderFilter = $bindable(''),
		fromDate = $bindable(''),
		toDate = $bindable(''),
		sentOnly = $bindable(false),
		receivedOnly = $bindable(false),
		onClear
	}: {
		senderFilter?: string;
		fromDate?: string;
		toDate?: string;
		sentOnly?: boolean;
		receivedOnly?: boolean;
		onClear: () => void;
	} = $props();
</script>

<details class="search-filters">
	<summary class="filters-toggle">Advanced Filters</summary>
	<div class="filters-grid">
		<div class="filter-field">
			<label for="sender">From Handle</label>
			<input
				id="sender"
				type="text"
				bind:value={senderFilter}
				placeholder="@handle"
				class="filter-input"
			/>
		</div>

		<div class="filter-field">
			<label for="from-date">From Date</label>
			<input id="from-date" type="date" bind:value={fromDate} class="filter-input" />
		</div>

		<div class="filter-field">
			<label for="to-date">To Date</label>
			<input id="to-date" type="date" bind:value={toDate} class="filter-input" />
		</div>

		<div class="filter-field">
			<label>
				<input type="checkbox" bind:checked={sentOnly} />
				Sent by me only
			</label>
		</div>

		<div class="filter-field">
			<label>
				<input type="checkbox" bind:checked={receivedOnly} />
				Received by me only
			</label>
		</div>

		<button type="button" onclick={onClear} class="clear-filters">Clear Filters</button>
	</div>
</details>

<style>
	.search-filters {
		background: var(--parchment);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: var(--space-4);
	}

	.filters-toggle {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--postal-blue);
		cursor: pointer;
		list-style: none;
	}

	.filters-toggle::-webkit-details-marker {
		display: none;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
		margin-top: var(--space-4);
	}

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.filter-field label {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--ink-charcoal);
	}

	.filter-input {
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: white;
	}

	.clear-filters {
		padding: var(--space-2) var(--space-4);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		background: none;
		color: var(--ink-slate);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		cursor: pointer;
		align-self: start;
	}

	.clear-filters:hover {
		background: var(--border-faint);
	}
</style>
