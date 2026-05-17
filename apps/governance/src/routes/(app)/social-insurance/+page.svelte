<script lang="ts">
	import { Card, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<PageHeader 
		title="Social Insurance Fund"
		description="Provides income protection and benefits to society members."
	/>

	<div class="stats">
		<Card>
			<div class="stat__value">{data.members.length}</div>
			<div class="stat__label">Members</div>
		</Card>
		<Card>
			<div class="stat__value">{data.association.created_at.slice(0, 10)}</div>
			<div class="stat__label">Established</div>
		</Card>
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}
	.stats {
		display: flex;
		gap: var(--space-6);
	}
	.stat__value {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
	}
	.stat__label {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: var(--space-1);
	}
</style>
