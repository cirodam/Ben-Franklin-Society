<script lang="ts">
	import { EmptyState } from '@bfs/ui';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	
	let currentView = $state<'enacted' | 'under-consideration' | 'archived'>(
		data.currentView === 'under-consideration' ? 'under-consideration' :
		data.currentView === 'archived' ? 'archived' : 'enacted'
	);

	function switchView(view: 'enacted' | 'under-consideration' | 'archived') {
		currentView = view;
		goto(`/library?view=${view}`, { replaceState: true });
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		});
	}

	const allDocs = $derived(() => {
		if (currentView === 'enacted') return data.enacted;
		if (currentView === 'under-consideration') return data.underConsideration;
		return data.archived;
	});
</script>

<div class="page">
	<header class="header">
		<h1 class="page-title">Society Code</h1>
		<p class="subtitle">Official governing documents of the society</p>
		<div class="header-actions">
			<a href="/library/new" class="create-btn">
				Create New Document
			</a>
		</div>
	</header>

	<div class="tabs">
		<button 
			class="tab"
			class:active={currentView === 'enacted'}
			onclick={() => switchView('enacted')}
		>
			Enacted
			<span class="count">{data.enacted.length}</span>
		</button>
		<button 
			class="tab"
			class:active={currentView === 'under-consideration'}
			onclick={() => switchView('under-consideration')}
		>
			Under Consideration
			<span class="count">{data.underConsideration.length}</span>
		</button>
		<button 
			class="tab"
			class:active={currentView === 'archived'}
			onclick={() => switchView('archived')}
		>
			Archived
			<span class="count">{data.archived.length}</span>
		</button>
	</div>

	{#if allDocs().length === 0}
		<EmptyState 
			title="No documents in this category"
			description={
				currentView === 'enacted' ? 'No enacted laws yet' :
				currentView === 'under-consideration' ? 'No documents under consideration' :
				'No archived documents'
			}
		/>
	{:else}
		<div class="document-list">
			{#each allDocs() as doc}
				<a href="/library/{doc.slug}" class="document-row">
					<div class="document-main">
						<div class="document-header-row">
							<h2 class="document-title">{doc.title}</h2>
						</div>
						<div class="document-meta-line">
							<span class="document-type">
								{doc.type === 'governing' ? 'Governing Document' : 'Motion'}
							</span>
							{#if doc.type === 'governing' && doc.content.seniority}
								<span class="meta-dot">•</span>
								<span class="document-seniority">{doc.content.seniority}</span>
							{/if}
						</div>
					</div>
					<span class="document-date">{formatDate(doc.updated_at)}</span>
				</a>
			{/each}
		</div>
	{/if}
</div>

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
		margin: 0 0 var(--space-2) 0;
		line-height: 1.3;
	}

	.subtitle {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: var(--ink-mid);
		margin: 0 0 var(--space-6) 0;
		font-style: italic;
	}

	.header-actions {
		display: flex;
		justify-content: center;
		margin-top: var(--space-4);
	}

	.create-btn {
		padding: var(--space-2) var(--space-4);
		border: 2px solid var(--accent);
		background: var(--accent);
		color: var(--paper);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.08em;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s;
		border-radius: 4px;
		display: inline-block;
	}

	.create-btn:hover {
		background: var(--accent-hover);
		border-color: var(--accent-hover);
	}

	.tabs {
		display: flex;
		gap: var(--space-2);
		justify-content: center;
		border-bottom: 2px solid var(--border);
		margin-bottom: var(--space-6);
	}

	.tab {
		padding: var(--space-3) var(--space-5);
		border: none;
		background: transparent;
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base);
		letter-spacing: 0.08em;
		color: var(--ink-mid);
		cursor: pointer;
		position: relative;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.tab:hover {
		color: var(--ink);
		background: var(--tint-green-light);
	}

	.tab.active {
		color: var(--accent);
		font-weight: 500;
	}

	.tab.active::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--accent);
	}

	.count {
		font-size: var(--text-sm);
		padding: 0.125rem 0.5rem;
		background: var(--tint-green-mid);
		border-radius: 12px;
		font-variant-numeric: oldstyle-nums;
	}

	.tab.active .count {
		background: rgba(45, 90, 79, 0.2);
		color: var(--accent);
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
		border-color: var(--accent);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 4px 8px rgba(0, 0, 0, 0.08);
	}

	.document-main {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		flex: 1;
		min-width: 0;
	}

	.document-header-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.document-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: var(--ink);
		margin: 0;
		line-height: 1.3;
		flex: 1;
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
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-faint);
	}
	.document-seniority {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-faint);
		text-transform: capitalize;
	}

	.document-type {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-faint);
	}

	.meta-dot {
		font-size: var(--text-sm);
		color: var(--accent);
	}

	.document-date {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-faint);
		white-space: nowrap;
		font-variant-numeric: oldstyle-nums;
	}
</style>

