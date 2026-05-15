<script lang="ts">
	import { enhance } from '$app/forms';

	type Role = {
		uuid: string;
		title: string;
		section_name: string | null;
		holders: Array<{
			uuid: string;
			handle: string;
			given_name: string;
			family_name: string;
		}>;
		permissions: Array<{ name: string }>;
	};

	type Member = {
		person_uuid: string;
		person: {
			uuid: string;
			handle: string;
			given_name: string;
			family_name: string;
		} | null;
	};

	type Motion = {
		uuid: string;
		title: string;
		body_name: string;
	};

	let {
		roles,
		members,
		canAssign = false,
		enactedMotions = []
	}: {
		roles: Role[];
		members: Member[];
		canAssign?: boolean;
		enactedMotions?: Motion[];
	} = $props();

	// Group roles by section
	const rolesBySection = $derived.by(() => {
		const groups = new Map<string, Role[]>();
		for (const role of roles) {
			const key = role.section_name ?? 'Other';
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key)!.push(role);
		}
		return groups;
	});

	// Sort sections - body sections first, then support, then others
	const sortedSections = $derived.by(() => {
		const divs = Array.from(rolesBySection.keys());
		return divs.sort((a, b) => {
			const order = ['Assembly', 'Committee', 'Support'];
			const aIdx = order.indexOf(a);
			const bIdx = order.indexOf(b);
			if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
			if (aIdx !== -1) return -1;
			if (bIdx !== -1) return 1;
			return a.localeCompare(b);
		});
	});
</script>

<section class="card">
	<h2>Roles <span class="count">{roles.length}</span></h2>
	{#if roles.length === 0}
		<p class="empty">No roles defined.</p>
	{:else}
		{#each sortedSections as section}
			<div class="division-group">
				<h3 class="division-label">{section}</h3>
				<div class="roles-list">
					{#each rolesBySection.get(section) ?? [] as role}
						<div class="role-card-detail">
							<div class="role-header-detail">
								<span class="role-name-detail">{role.title}</span>
								{#if role.permissions.length > 0}
									<span class="perms-count">{role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}</span>
								{/if}
							</div>

							{#if role.holders.length > 0}
								<ul class="holders-list">
									{#each role.holders as holder}
										<li class="holder-item">
											<a href="/people/{holder.uuid}" class="holder-link">
												@{holder.handle}
												{#if holder.given_name || holder.family_name}
													<span class="holder-name">({holder.given_name} {holder.family_name})</span>
												{/if}
											</a>
											{#if canAssign}
												<form method="POST" action="?/revokeRole" use:enhance>
													<input type="hidden" name="person_uuid" value={holder.uuid} />
													<input type="hidden" name="role_uuid" value={role.uuid} />
													<select name="motion_uuid" class="select select--xs" required>
														<option value="">— Motion —</option>
														{#each enactedMotions as m}
															<option value={m.uuid}>[{m.body_name}] {m.title}</option>
														{/each}
													</select>
													<button type="submit" class="btn-revoke">Revoke</button>
												</form>
											{/if}
										</li>
									{/each}
								</ul>
							{:else}
								<p class="no-holders">No current holders.</p>
							{/if}

							{#if canAssign && members.length > 0}
								<form method="POST" action="?/assignRole" use:enhance class="assign-form">
									<input type="hidden" name="role_uuid" value={role.uuid} />
									<select name="motion_uuid" required class="select">
										<option value="">— Enacted motion —</option>
										{#each enactedMotions as m}
											<option value={m.uuid}>[{m.body_name}] {m.title}</option>
										{/each}
									</select>
									<select name="person_uuid" required class="select">
										<option value="">Assign member…</option>
										{#each members as member}
											{#if !role.holders.find((h) => h.uuid === member.person?.uuid)}
												<option value={member.person?.uuid}>{member.person?.handle ?? member.person_uuid}</option>
											{/if}
										{/each}
									</select>
									<button type="submit" class="btn btn--primary btn--sm">Assign</button>
								</form>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/if}

	{#if canAssign}
		<details class="create-role-details">
			<summary>Create new role</summary>
			<form method="POST" action="?/createRole" use:enhance class="create-role-form">
				<input type="text" name="name" placeholder="Role name" required class="input" />
				<button type="submit" class="btn btn--secondary btn--sm">Create</button>
			</form>
		</details>
	{/if}
</section>

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
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.count {
		font-size: var(--text-xs);
		font-weight: var(--weight-normal);
		color: var(--color-text-muted);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		padding: 1px 8px;
	}

	.empty {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.division-group {
		margin-bottom: var(--space-5);
	}

	.division-group:last-of-type {
		margin-bottom: 0;
	}

	.division-label {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-3);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--color-border);
	}

	.roles-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.role-card-detail {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-4);
	}

	.role-header-detail {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.role-name-detail {
		font-weight: var(--weight-semibold);
		font-size: var(--text-base);
	}

	.perms-count {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		background: var(--color-surface-raised);
		padding: 2px 8px;
		border-radius: 999px;
	}

	.holders-list {
		list-style: none;
		margin: 0 0 var(--space-3);
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.holder-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		font-size: var(--text-sm);
	}

	.holder-link {
		color: var(--color-text);
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.holder-link:hover {
		text-decoration: underline;
	}

	.holder-name {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}

	.no-holders {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-3);
	}

	.btn-revoke {
		font-size: var(--text-xs);
		padding: 2px 8px;
		background: #fee2e2;
		color: #991b1b;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.btn-revoke:hover {
		background: #fecaca;
	}

	.assign-form {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		flex-wrap: wrap;
	}

	.select {
		font-size: var(--text-sm);
		padding: var(--space-1) var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.select--xs {
		font-size: var(--text-xs);
		padding: 1px 6px;
	}

	.create-role-details {
		margin-top: var(--space-5);
		font-size: var(--text-sm);
	}

	.create-role-details summary {
		cursor: pointer;
		color: var(--color-text-muted);
	}

	.create-role-form {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-3);
		align-items: center;
	}

	.input {
		font-size: var(--text-sm);
		padding: var(--space-1) var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		flex: 1;
	}

	.btn--sm {
		padding: var(--space-1) var(--space-3);
		font-size: var(--text-sm);
	}
</style>
