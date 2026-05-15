<script lang="ts">
	import Badge from '@bfs/ui/src/Badge.svelte';
	import OrgChart from '$lib/components/OrgChart.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { section, association, roleHierarchy, roles, canManage } = $derived(data);

	const totalCompensation = $derived(
		roles.reduce((sum, r) => sum + r.compensation_franks, 0)
	);

	const vacantCount = $derived(
		roles.filter(r => r.holders.length === 0).length
	);
</script>

<div class="page">
	<div class="page-header">
		<div class="breadcrumb">
			<a href="/associations/{association.uuid}" class="breadcrumb-link">{association.name}</a>
			<span class="breadcrumb-separator">→</span>
			<span class="breadcrumb-current">Sections</span>
			<span class="breadcrumb-separator">→</span>
			<span class="breadcrumb-current">{section.name}</span>
		</div>
		
		<div class="page-header__top">
			<h1>{section.name}</h1>
			{#if canManage}
				<a href="/sections/{section.uuid}/edit" class="btn btn--secondary">✏️ Edit</a>
			{/if}
		</div>

		{#if section.description}
			<p class="section-description">{section.description}</p>
		{/if}

		<div class="section-stats">
			<div class="stat">
				<span class="stat-label">Roles</span>
				<span class="stat-value">{roles.length}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Filled</span>
				<span class="stat-value">{roles.length - vacantCount}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Vacant</span>
				<span class="stat-value stat-value--warning">{vacantCount}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Total Compensation</span>
				<span class="stat-value">ƒ{totalCompensation.toLocaleString()}</span>
			</div>
		</div>
	</div>

	{#if roleHierarchy.length > 0}
		<OrgChart {roleHierarchy} associationUuid={association.uuid} canManage={canManage} />
	{:else}
		<section class="card">
			<p class="empty">No roles defined in this section yet.</p>
		</section>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.breadcrumb-link {
		color: var(--color-primary, #0066cc);
		text-decoration: none;
	}

	.breadcrumb-link:hover {
		text-decoration: underline;
	}

	.breadcrumb-separator {
		color: var(--color-text-muted);
	}

	.breadcrumb-current {
		color: var(--color-text);
	}

	.page-header__top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
	}

	.page-header__top h1 {
		margin: 0;
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
	}

	.btn {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		white-space: nowrap;
	}

	.btn--secondary {
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text);
	}

	.btn--secondary:hover {
		background: var(--color-surface);
	}

	.section-description {
		color: var(--color-text-muted);
		font-size: var(--text-base);
		line-height: 1.6;
		margin: 0;
	}

	.section-stats {
		display: flex;
		gap: var(--space-6);
		padding: var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.stat-label {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: var(--weight-medium);
	}

	.stat-value {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.stat-value--warning {
		color: var(--color-warning, #ffc107);
	}

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}

	.empty {
		color: var(--color-text-muted);
		text-align: center;
		padding: var(--space-6);
		margin: 0;
	}
</style>
