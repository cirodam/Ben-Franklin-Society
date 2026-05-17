<script lang="ts">
	import { Card } from '@bfs/ui';

	interface Role {
		uuid: string;
		title: string;
		description: string | null;
		compensation_franks: number;
		section_uuid: string | null;
	}

	interface Props {
		vacantRoles: Role[];
		associationUuid: string;
	}

	let { vacantRoles, associationUuid }: Props = $props();

	function formatCompensation(franks: number): string {
		return `ƒ${franks.toLocaleString()}`;
	}
</script>

{#if vacantRoles.length > 0}
	<Card class="vacancies">
		<div class="card-header">
			<h2>
				<span class="icon">📋</span>
				Vacant Positions
				<span class="count">{vacantRoles.length}</span>
			</h2>
		</div>

		<div class="vacancy-list">
			{#each vacantRoles as role}
				<div class="vacancy-item">
					<div class="vacancy-info">
						<h3 class="vacancy-title">{role.title}</h3>
						{#if role.description}
							<p class="vacancy-description">{role.description}</p>
						{/if}
						<div class="vacancy-meta">
							<span class="vacancy-compensation">{formatCompensation(role.compensation_franks)}</span>
							{#if role.section_uuid}
								<span class="vacancy-section">Section: {role.section_uuid}</span>
							{/if}
						</div>
					</div>
					<div class="vacancy-action">
						<a href="#assign-{role.uuid}" class="btn btn-sm btn-primary">Assign Member</a>
					</div>
				</div>
			{/each}
		</div>

		<p class="vacancy-note">
			💡 Use the Role Management section below to assign members to vacant positions.
		</p>
	</Card>
{/if}

<style>
	.vacancies {
		border-left: 4px solid var(--color-warning, #ffc107);
		background: var(--bg-warning-light, #fff8e1);
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
	}

	.card-header h2 {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.25rem;
	}

	.icon {
		font-size: 1.5rem;
	}

	.count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.75rem;
		height: 1.75rem;
		padding: 0 0.5rem;
		background: var(--color-warning, #ffc107);
		color: var(--text-on-warning, #000);
		border-radius: 1rem;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.vacancy-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.vacancy-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem;
		background: var(--bg-white, #fff);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 0.5rem;
	}

	.vacancy-info {
		flex: 1;
	}

	.vacancy-title {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary, #000);
	}

	.vacancy-description {
		margin: 0 0 0.5rem 0;
		font-size: 0.95rem;
		color: var(--text-secondary, #555);
	}

	.vacancy-meta {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.vacancy-compensation {
		font-weight: 600;
		color: var(--color-primary, #0066cc);
		font-size: 1rem;
	}

	.vacancy-section {
		font-size: 0.85rem;
		color: var(--text-muted, #666);
	}

	.vacancy-action {
		flex-shrink: 0;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: 1px solid var(--border-color, #ccc);
		border-radius: 0.25rem;
		background: var(--bg-white, #fff);
		cursor: pointer;
		font-family: inherit;
		text-decoration: none;
		display: inline-block;
		font-size: 0.9rem;
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.85rem;
	}

	.btn-primary {
		background: var(--color-primary, #0066cc);
		color: white;
		border-color: var(--color-primary, #0066cc);
	}

	.btn:hover {
		opacity: 0.9;
	}

	.vacancy-note {
		margin: 1rem 0 0 0;
		padding: 0.75rem;
		background: var(--bg-info-light, #e3f2fd);
		border-left: 3px solid var(--color-info, #2196f3);
		border-radius: 0.25rem;
		font-size: 0.9rem;
		color: var(--text-secondary, #555);
	}
</style>
