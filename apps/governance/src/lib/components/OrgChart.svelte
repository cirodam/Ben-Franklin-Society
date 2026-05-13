<script lang="ts">
	type RoleNode = {
		uuid: string;
		name: string;
		level: number | null;
		section_name: string | null;
		salary_monthly: number | null;
		daily_rate: number | null;
		term_days: number | null;
		children: RoleNode[];
	};

	let { roleHierarchy }: { roleHierarchy: RoleNode[] } = $props();

	function formatSection(sectionName: string | null): string {
		if (!sectionName) return '';
		if (sectionName === 'Assembly' || sectionName === 'Committee' || sectionName === 'Support') {
			return sectionName; // Don't add "Section" to body sections
		}
		return `${sectionName} Section`;
	}

	function formatCompensation(role: RoleNode): string {
		if (role.salary_monthly) {
			return `${role.salary_monthly.toLocaleString()}F/month`;
		} else if (role.daily_rate) {
			return `${role.daily_rate}F/day`;
		}
		return '';
	}

	function formatTerm(days: number | null): string {
		if (!days) return 'As-needed';
		if (days >= 365) return `${Math.round(days / 365)}yr term`;
		if (days >= 30) return `${Math.round(days / 30)}mo term`;
		return `${days}d term`;
	}
</script>

{#if roleHierarchy.length > 0}
	<section class="card">
		<h2>Organization</h2>
		<div class="org-chart">
			{#each roleHierarchy as role}
				{@render roleTree(role, 0)}
			{/each}
		</div>
	</section>
{/if}

{#snippet roleTree(role: RoleNode, depth: number)}
	<div class="role-node" style="margin-left: {depth * 2}rem">
		<div class="role-card">
			<div class="role-header">
				<h3 class="role-name">{role.name}</h3>
				{#if role.level}
					<span class="role-level">Level {role.level}</span>
				{/if}
			</div>
			<div class="role-details">
				{#if role.section_name}
					<span class="role-division">{formatSection(role.section_name)}</span>
				{/if}
				{#if role.salary_monthly || role.daily_rate}
					<span class="role-comp">{formatCompensation(role)}</span>
				{/if}
				{#if role.term_days !== null}
					<span class="role-term">{formatTerm(role.term_days)}</span>
				{/if}
			</div>
		</div>
		{#if role.children.length > 0}
			<div class="role-children">
				{#each role.children as child}
					{@render roleTree(child, depth + 1)}
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<style>
	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}

	.card h2 {
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		margin-bottom: var(--space-4);
	}

	.org-chart {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.role-node {
		position: relative;
	}

	.role-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-3);
		margin-bottom: var(--space-2);
	}

	.role-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.role-name {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		margin: 0;
		color: var(--color-text);
	}

	.role-level {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		padding: 1px 8px;
	}

	.role-details {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.role-division::before {
		content: '📋 ';
	}

	.role-comp::before {
		content: '💰 ';
	}

	.role-term::before {
		content: '⏱️ ';
	}

	.role-children {
		border-left: 2px solid var(--color-border);
		padding-left: var(--space-3);
		margin-left: var(--space-2);
	}
</style>
