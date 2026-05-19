<script lang="ts">
	import { Button, EmptyState, PageHeader } from '@bfs/ui';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import { documentTypes } from '$lib/documents';
	import CreateDocumentDialog from './CreateDocumentDialog.svelte';

	let { data }: { data: PageData } = $props();

	let query = $state(data.filters.query);
	let typeFilter = $state<string[]>(data.filters.types);
	let myDocuments = $state(data.filters.owner !== 'all');
	
	let showCreateDialog = $state(false);

	const allTypes = documentTypes.getAllTypes();

	// Update URL when filters change
	function updateFilters() {
		const params = new URLSearchParams();
		if (typeFilter.length > 0 && typeFilter.length < allTypes.length) {
			params.set('type', typeFilter.join(','));
		}
		if (query.trim()) {
			params.set('q', query.trim());
		}
		if (!myDocuments) {
			params.set('owner', 'all');
		}
		const url = params.toString() ? `?${params}` : '';
		goto(`/library${url}`, { replaceState: true, keepFocus: true });
	}

	function handleSearch() {
		updateFilters();
	}

	function handleTypeChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		if (select.value === 'all') {
			typeFilter = [];
		} else {
			typeFilter = [select.value];
		}
		updateFilters();
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { 
			year: 'numeric', 
			month: 'short', 
			day: 'numeric' 
		});
	}

	const selectedType = $derived(typeFilter.length === 1 ? typeFilter[0] : 'all');
</script>

<div class="page">
	<PageHeader title="Library">
		{#snippet actions()}
			<Button onclick={() => showCreateDialog = true}>Create document</Button>
		{/snippet}
	</PageHeader>

	<div class="search-row">
		<input
			class="search-input"
			type="search"
			placeholder="Search documents..."
			bind:value={query}
			onchange={handleSearch}
		/>
		<select class="type-select" value={selectedType} onchange={handleTypeChange}>
			<option value="all">All types</option>
			{#each allTypes as type}
				{@const typeConfig = documentTypes.get(type)}
				<option value={type}>{typeConfig.label}</option>
			{/each}
		</select>
		<div class="owner-toggle">
			<button
				class="owner-toggle-btn"
				class:active={myDocuments}
				onclick={() => { myDocuments = true; updateFilters(); }}
			>
				Mine
			</button>
			<button
				class="owner-toggle-btn"
				class:active={!myDocuments}
				onclick={() => { myDocuments = false; updateFilters(); }}
			>
				Public
			</button>
		</div>
	</div>

	{#if data.items.length === 0}
		<EmptyState 
			icon="📚"
			title="No documents found"
			description="Try adjusting your search or filters"
		/>
	{:else}
		<div class="document-list">
			{#each data.items as item}
				<a href={documentTypes.getDetailRoute(item)} class="document-row">
					<div class="document-main">
						<h2 class="document-title t-display">{item.title}</h2>
						<div class="document-meta-line">
							<span class="document-author t-label">{item.given_name} {item.family_name}</span>
							<span class="meta-dot">•</span>
							<span class="document-type t-label">{documentTypes.get(item.type).label}</span>
						</div>
					</div>
					<span class="document-date t-label">{formatDate(item.updated_at)}</span>
				</a>
			{/each}
		</div>
	{/if}
</div>

<CreateDocumentDialog 
	bind:open={showCreateDialog}
	person={data.person}
	onClose={() => showCreateDialog = false}
/>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.search-row {
		display: flex;
		gap: var(--space-3);
		align-items: center;
	}

	.search-input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		letter-spacing: 0.08em;
		color: var(--ink);
		background: var(--paper);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.search-input::placeholder {
		color: var(--ink-faint);
	}

	.type-select {
		padding: 0.75rem 1rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		letter-spacing: 0.08em;
		color: var(--ink);
		background: var(--paper);
		cursor: pointer;
		min-width: 180px;
	}

	.type-select:focus {
		outline: none;
		border-color: var(--accent);
	}

	.owner-toggle {
		display: flex;
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.owner-toggle-btn {
		padding: 0.75rem 1.25rem;
		border: none;
		background: transparent;
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.08em;
		color: var(--ink-mid);
		cursor: pointer;
		transition: all 0.15s;
		border-right: 1px solid var(--rule);
	}

	.owner-toggle-btn:last-child {
		border-right: none;
	}

	.owner-toggle-btn:hover {
		background: var(--surface-dk);
	}

	.owner-toggle-btn.active {
		background: var(--accent);
		color: var(--paper);
	}

	.document-list {
		display: flex;
		flex-direction: column;
		background: var(--paper);
		border-radius: var(--radius);
		box-shadow: var(--shadow-elevated);
		overflow: hidden;
	}

	.document-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		padding: 1.5rem 2rem;
		border-bottom: 1px solid var(--rule);
		text-decoration: none;
		color: inherit;
		transition: background 0.15s;
	}

	.document-row:last-child {
		border-bottom: none;
	}

	.document-row:hover {
		background: var(--surface-dk);
	}

	.document-main {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		min-width: 0;
	}

	.document-title {
		font-size: var(--text-lg);
		color: var(--ink);
		margin: 0;
		line-height: 1.3;
	}

	.document-row:hover .document-title {
		color: var(--accent);
	}

	.document-meta-line {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.document-author {
		font-size: var(--text-sm);
		color: var(--ink-faint);
	}

	.document-type {
		font-size: var(--text-sm);
		color: var(--ink-faint);
	}

	.meta-dot {
		font-size: var(--text-sm);
		color: var(--ink-faint);
	}

	.document-date {
		font-size: var(--text-sm);
		color: var(--ink-faint);
		white-space: nowrap;
	}
</style>

