<script lang="ts">
	import RoleCard from './RoleCard.svelte';

	type RoleNode = {
		uuid: string;
		title: string;
		reports_to_role_uuid: string | null;
		holders?: Array<{
			uuid: string;
			handle: string;
			given_name: string;
			family_name: string;
		}>;
		children: RoleNode[];
	};

	interface Props {
		title: string;
		description?: string | null;
		roles: RoleNode[];
		canManage?: boolean;
		onAddChild?: (roleUuid: string) => void;
		payroll?: number | null;
	}

	let { title, description = null, roles, canManage = false, onAddChild, payroll = null }: Props = $props();

	// Calculate stats recursively
	function calculateStats(roleNodes: RoleNode[]): { total: number; filled: number } {
		let total = 0;
		let filled = 0;

		function traverse(node: RoleNode) {
			total++;
			if (node.holders && node.holders.length > 0) {
				filled++;
			}
			node.children.forEach(traverse);
		}

		roleNodes.forEach(traverse);
		return { total, filled };
	}

	const stats = $derived(calculateStats(roles));
</script>

<div class="section-card">
	<div class="section-header">
		<div class="section-title-row">
			<h3>{title}</h3>
			<div class="section-stats">
				<span class="stat">{stats.filled} / {stats.total} roles filled</span>
				{#if payroll !== null}
					<span class="stat">payroll {payroll.toLocaleString()} franks</span>
				{/if}
			</div>
		</div>
		{#if description}
			<p class="section-description">{description}</p>
		{/if}
	</div>
	<div class="org-chart">
		{#each roles as role}
			<RoleCard {role} {canManage} {onAddChild} />
		{/each}
	</div>
</div>

<style>
	.section-card {
		background: var(--paper);
		border: 1px solid var(--border);
		padding: var(--space-4);
		margin-bottom: var(--space-4);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
	}

	.section-header {
		margin-bottom: var(--space-4);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}

	.section-title-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-4);
		margin-bottom: var(--space-2);
	}

	.section-header h3 {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-lg);
		font-weight: 400;
		color: var(--ink);
		margin: 0;
	}

	.section-stats {
		display: flex;
		gap: var(--space-4);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: lowercase;
	}

	.stat {
		color: var(--ink-mid);
	}

	.section-description {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-mid);
		margin: 0;
		line-height: 1.6;
	}

	.org-chart {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
</style>
