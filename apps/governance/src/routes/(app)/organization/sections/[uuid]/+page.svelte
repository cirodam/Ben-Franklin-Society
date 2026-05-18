<script lang="ts">
	import { Breadcrumb, Button, Card, EmptyState } from '@bfs/ui';
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
		<Breadcrumb items={[
			{ label: association.name, href: `/associations/${association.uuid}` },
			{ label: 'Sections' },
			{ label: section.name }
		]} />
		
		<div class="page-header__top">
			<h1>{section.name}</h1>
			{#if canManage}
				<Button variant="secondary" href="/organization/sections/{section.uuid}/edit" size="sm">✏️ Edit</Button>
			{/if}
		</div>

		{#if section.description}
			<p class="section-description">{section.description}</p>
		{/if}

		<Card padding="md">
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
		</Card>
	</div>

	{#if roleHierarchy.length > 0}
		<OrgChart {roleHierarchy} associationUuid={association.uuid} canManage={canManage} />
	{:else}
		<Card>
			<EmptyState 
				icon="📋"
				title="No roles defined"
				description="No roles have been defined in this section yet."
			/>
		</Card>
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

	.section-description {
		color: var(--color-text-muted);
		font-size: var(--text-base);
		line-height: 1.6;
		margin: 0;
	}

	.section-stats {
		display: flex;
		gap: var(--space-6);
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
</style>
