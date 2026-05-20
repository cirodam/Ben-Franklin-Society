<script lang="ts">
	import { Button, EmptyState } from '@bfs/ui';
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
			month: 'long', 
			day: 'numeric' 
		});
	}

	const selectedType = $derived(typeFilter.length === 1 ? typeFilter[0] : 'all');
</script>

<div class="page">
	<header class="header">
		<h1 class="page-title">Library</h1>
		<div class="header-actions">
			<Button onclick={() => showCreateDialog = true}>+ Create document</Button>
		</div>
	</header>

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
			title="No documents found"
			description="Try adjusting your search or filters"
		/>
	{:else}
		<div class="document-list">
			{#each data.items as item}
				<a href={documentTypes.getDetailRoute(item)} class="document-row">
					<div class="document-main">
						<h2 class="document-title">{item.title}</h2>
						<div class="document-meta-line">
							<span class="document-author">{item.owner_name}</span>
							<span class="meta-dot">•</span>
							<span class="document-type">{documentTypes.get(item.type).label}</span>
						</div>
					</div>
					<span class="document-date">{formatDate(item.updated_at)}</span>
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
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.header {
		text-align: center;
		margin-bottom: var(--space-6);
	}

	.page-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: clamp(2.25rem, 4.5vw, 3.5rem);
		font-weight: 400;
		color: var(--ink);
		margin: 0 0 var(--space-6) 0;
		line-height: 1.3;
	}

	.header-actions {
		display: flex;
		justify-content: center;
	}

	.search-row {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		margin-bottom: var(--space-4);
	}

	.search-input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border-strong);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		letter-spacing: 0.08em;
		color: var(--ink);
		background: var(--paper);
		transition: border-color 0.2s;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--gold-hover);
	}

	.search-input::placeholder {
		color: var(--ink-mid);
		opacity: 0.6;
	}

	.type-select {
		padding: 0.75rem 1rem;
		border: 1px solid var(--border-strong);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		letter-spacing: 0.08em;
		color: var(--ink);
		background: var(--paper);
		cursor: pointer;
		min-width: 180px;
		transition: border-color 0.2s;
	}

	.type-select:focus {
		outline: none;
		border-color: var(--gold-hover);
	}

	.owner-toggle {
		display: flex;
		border: 1px solid var(--border-strong);
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
		transition: all 0.2s;
		border-right: 1px solid var(--border-strong);
	}

	.owner-toggle-btn:last-child {
		border-right: none;
	}

	.owner-toggle-btn:hover {
		background: var(--tint-green-mid);
		color: var(--ink);
	}

	.owner-toggle-btn.active {
		background: rgba(212, 162, 74, 0.15);
		color: var(--gold);
		border-color: var(--gold-hover);
	}

	.document-list {
		display: flex;
		flex-direction: column;
		background: var(--paper);
		border: 1px solid var(--border);
		overflow: hidden;
	}

	.document-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--border-subtle);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.document-row:last-child {
		border-bottom: none;
	}

	.document-row:hover {
		border-color: var(--gold-hover);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 4px 8px rgba(0, 0, 0, 0.08);
	}

	.document-main {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		min-width: 0;
	}

	.document-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: var(--ink);
		margin: 0;
		line-height: 1.3;
	}

	.document-row:hover .document-title {
		color: var(--gold);
	}

	.document-meta-line {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.document-author {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-faint);
	}

	.document-type {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-faint);
	}

	.meta-dot {
		font-size: var(--text-sm);
		color: var(--gold);
	}

	.document-date {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-faint);
		white-space: nowrap;
		font-variant-numeric: oldstyle-nums;
	}
</style>

