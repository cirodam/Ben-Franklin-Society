<script lang="ts">
	import type { ContractDocument } from '$lib/server/documents/library-types.js';
	import DocumentView from './DocumentView.svelte';

	let { document: doc }: { document: ContractDocument } = $props();
</script>

<DocumentView>
	{#snippet header()}
		<div class="document-title-block">
			<div class="document-letterhead">
				<div class="letterhead-body">The Ben Franklin Society</div>
				<div class="letterhead-doc-number">
					{doc.document_id || `#${doc.uuid.slice(0, 8)}`}
				</div>
			</div>
			<h1 class="document-title">{doc.title}</h1>
			<div class="document-meta">
				<span class="type-badge">🤝 Contract</span>
				<span class="status-badge status--{doc.content.status}">
					{doc.content.status}
				</span>
			</div>
		</div>
		
		<div class="contract-parties">
			<div class="party">
				<div class="party-header">Party A</div>
				<div class="party-name">{doc.content.party_a.principal_name || 'Not specified'}</div>
				<div class="party-role">{doc.content.party_a.role || 'Role not specified'}</div>
			</div>
			<div class="party-divider">↔</div>
			<div class="party">
				<div class="party-header">Party B</div>
				<div class="party-name">{doc.content.party_b.principal_name || 'Not specified'}</div>
				<div class="party-role">{doc.content.party_b.role || 'Role not specified'}</div>
			</div>
		</div>

		{#if doc.content.effective_date || doc.content.expiry_date || doc.content.acknowledged_at}
			<div class="document-dates">
				{#if doc.content.effective_date}
					<div class="date-line">
						<span class="date-label">Effective:</span>
						<span class="date-value">{doc.content.effective_date.slice(0, 10)}</span>
					</div>
				{/if}
				{#if doc.content.expiry_date}
					<div class="date-line">
						<span class="date-label">Expires:</span>
						<span class="date-value">{doc.content.expiry_date.slice(0, 10)}</span>
					</div>
				{/if}
				{#if doc.content.acknowledged_at}
					<div class="date-line">
						<span class="date-label">Acknowledged:</span>
						<span class="date-value">{doc.content.acknowledged_at.slice(0, 10)}</span>
					</div>
				{/if}
			</div>
		{/if}
	{/snippet}

	{#snippet body()}
		<div class="contract-body">
			<div class="contract-text">
				{#if doc.content.body}
					{#each doc.content.body.split('\n\n') as paragraph}
						<p>{paragraph}</p>
					{/each}
				{:else}
					<p class="empty-state">Contract text not yet written</p>
				{/if}
			</div>
		</div>
	{/snippet}
</DocumentView>

<style>
	/* Document letterhead */
	.document-letterhead {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-4);
		font-family: 'IM Fell English SC', serif;
	}

	.letterhead-body {
		font-size: var(--text-xs);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	.letterhead-doc-number {
		font-size: var(--text-xs);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	.contract-parties {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		margin: var(--space-6) 0;
		padding: var(--space-5);
		background: rgba(91, 140, 184, 0.05);
		border: 1px solid rgba(91, 140, 184, 0.2);
		border-radius: var(--radius-md);
	}

	.party {
		flex: 1;
		text-align: center;
	}

	.party-header {
		font-size: var(--text-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: var(--space-2);
	}

	.party-name {
		font-size: var(--text-lg);
		font-weight: 600;
		margin-bottom: var(--space-1);
	}

	.party-role {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.party-divider {
		font-size: var(--text-2xl);
		color: var(--color-text-muted);
	}

	.contract-body {
		font-family: 'Libre Baskerville', Georgia, serif;
	}

	.contract-text p {
		margin-bottom: var(--space-4);
	}

	.empty-state {
		color: var(--color-text-muted);
		font-style: italic;
		text-align: center;
		padding: var(--space-8);
	}

	@media (max-width: 768px) {
		.contract-parties {
			flex-direction: column;
		}

		.party-divider {
			transform: rotate(90deg);
		}
	}
</style>
