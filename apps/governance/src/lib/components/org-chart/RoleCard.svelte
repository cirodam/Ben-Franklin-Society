<script lang="ts">
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
		role: RoleNode;
		depth?: number;
		canManage?: boolean;
		onAddChild?: (roleUuid: string) => void;
	}

	let { role, depth = 0, canManage = false, onAddChild }: Props = $props();
</script>

<div class="role-node">
	<a href="/organization/roles/{role.uuid}" class="role-item">
		<h3 class="role-title">{role.title}</h3>
		<div class="role-right">
			<div class="role-holders">
				{#if role.holders && role.holders.length > 0}
					{#each role.holders as holder}
						<span class="holder-name">
							{holder.given_name} {holder.family_name}
						</span>
					{/each}
				{:else}
					<span class="holder-vacant">Vacant</span>
				{/if}
			</div>
			{#if canManage}
				<button
					class="btn-add"
					onclick={(e) => {
						e.preventDefault();
						onAddChild?.(role.uuid);
					}}
					title="Add role reporting to {role.title}"
				>
					+
				</button>
			{/if}
		</div>
	</a>

	{#if role.children.length > 0}
		<div class="role-children">
			{#each role.children as child}
				<svelte:self role={child} depth={depth + 1} {canManage} {onAddChild} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.role-node {
		position: relative;
	}

	.role-node + .role-node {
		margin-top: var(--space-3);
	}

	.role-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		border: 1px solid rgba(45, 90, 79, 0.2);
		border-left: 3px solid rgba(45, 90, 79, 0.3);
		background: white;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.role-item:hover {
		background-color: rgba(122, 92, 26, 0.03);
		border-color: rgba(122, 92, 26, 0.3);
	}

	.role-item:hover .role-title {
		color: #7a5c1a;
	}

	.role-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		font-weight: 600;
		color: #151c1a;
		margin: 0;
		transition: color 0.2s;
		flex-shrink: 0;
	}

	.role-right {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex: 1;
		justify-content: flex-end;
		min-width: 0;
	}

	.role-holders {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-xs);
		color: #374340;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		justify-content: flex-end;
		text-align: right;
	}

	.holder-name {
		color: #374340;
	}

	.holder-name:not(:last-child)::after {
		content: ',';
		margin-right: var(--space-1);
	}

	.holder-vacant {
		font-style: italic;
		color: #9ca3af;
	}

	.btn-add {
		background: none;
		border: 1px solid rgba(45, 90, 79, 0.2);
		cursor: pointer;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		padding: var(--space-1) var(--space-2);
		color: #7a5c1a;
		min-width: 2rem;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.btn-add:hover {
		background: #7a5c1a;
		border-color: #7a5c1a;
		color: white;
	}

	.role-children {
		padding-left: var(--space-6);
		margin-top: var(--space-3);
		margin-bottom: var(--space-3);
	}
</style>
