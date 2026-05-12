<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { bodies, people, canAssign, enactedMotions } = $derived(data);
</script>

<div class="page">
	<header class="page-header">
		<h1>Roles</h1>
		<p class="subtitle">Role assignments and permissions across all bodies.</p>
	</header>

	{#each bodies as body}
		<section class="card body-section">
			<h2 class="body-heading">
				<a href="/associations/{body.association.uuid}">{body.association.name}</a>
			</h2>

			{#if body.roles.length === 0}
				<p class="empty">No roles defined.</p>
			{:else}
				<div class="roles-list">
					{#each body.roles as role}
						<div class="role-card">
							<div class="role-header">
								<span class="role-name">{role.name}</span>
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
											{#if body.canAssign}
												<form method="POST" action="?/revokeRole" use:enhance>
													<input type="hidden" name="person_uuid" value={holder.uuid} />
													<input type="hidden" name="role_uuid" value={role.uuid} />
													<input type="hidden" name="association_uuid" value={body.association.uuid} />												<select name="motion_uuid" class="select select--xs" required>
													<option value="">— Motion —</option>
													{#each enactedMotions as m}
														<option value={m.uuid}>[{m.body_name}] {m.title}</option>
													{/each}
												</select>													<button type="submit" class="btn-revoke">Revoke</button>
												</form>
											{/if}
										</li>
									{/each}
								</ul>
							{:else}
								<p class="no-holders">No current holders.</p>
							{/if}

							{#if body.canAssign && body.members.length > 0}
								<form method="POST" action="?/assignRole" use:enhance class="assign-form">
									<input type="hidden" name="role_uuid" value={role.uuid} />
									<input type="hidden" name="association_uuid" value={body.association.uuid} />								<select name="motion_uuid" required class="select">
									<option value="">— Enacted motion —</option>
									{#each enactedMotions as m}
										<option value={m.uuid}>[{m.body_name}] {m.title}</option>
									{/each}
								</select>									<select name="person_uuid" required class="select">
										<option value="">Assign member…</option>
										{#each body.members as member}
											{#if !role.holders.find((h) => h.uuid === member.person_uuid)}
												<option value={member.person_uuid}>{member.handle ?? member.person_uuid}</option>
											{/if}
										{/each}
									</select>
									<button type="submit" class="btn btn--primary btn--sm">Assign</button>
								</form>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			{#if body.canAssign}
				<details class="create-role-details">
					<summary>Create new role</summary>
					<form method="POST" action="?/createRole" use:enhance class="create-role-form">
						<input type="hidden" name="association_uuid" value={body.association.uuid} />
						<input type="text" name="name" placeholder="Role name" required class="input" />
						<button type="submit" class="btn btn--secondary btn--sm">Create</button>
					</form>
				</details>
			{/if}
		</section>
	{/each}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-8); }
	.page-header h1 { margin: 0 0 var(--space-1); }
	.subtitle { color: var(--color-text-muted); font-size: var(--text-sm); margin: 0; }

	.body-heading { margin: 0 0 var(--space-5); font-size: var(--text-lg); }
	.body-heading a { color: inherit; text-decoration: none; }
	.body-heading a:hover { text-decoration: underline; }

	.roles-list { display: flex; flex-direction: column; gap: var(--space-4); }

	.role-card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-4);
	}
	.role-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}
	.role-name { font-weight: var(--weight-semibold); font-size: var(--text-base); }
	.perms-count {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		background: var(--color-surface-raised);
		padding: 2px 8px;
		border-radius: 999px;
	}

	.holders-list { list-style: none; margin: 0 0 var(--space-3); padding: 0; display: flex; flex-direction: column; gap: var(--space-2); }
	.holder-item { display: flex; align-items: center; gap: var(--space-3); font-size: var(--text-sm); }
	.holder-link { color: var(--color-text); text-decoration: none; display: flex; align-items: center; gap: var(--space-1); }
	.holder-link:hover { text-decoration: underline; }
	.holder-name { color: var(--color-text-muted); font-size: var(--text-xs); }
	.no-holders { font-size: var(--text-sm); color: var(--color-text-muted); margin: 0 0 var(--space-3); }

	.btn-revoke {
		font-size: var(--text-xs);
		padding: 2px 8px;
		background: #fee2e2;
		color: #991b1b;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.btn-revoke:hover { background: #fecaca; }

	.assign-form { display: flex; gap: var(--space-2); align-items: center; }
	.select {
		font-size: var(--text-sm);
		padding: var(--space-1) var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.create-role-details { margin-top: var(--space-5); font-size: var(--text-sm); }
	.create-role-details summary { cursor: pointer; color: var(--color-text-muted); }
	.create-role-form { display: flex; gap: var(--space-2); margin-top: var(--space-3); align-items: center; }
	.input {
		font-size: var(--text-sm);
		padding: var(--space-1) var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		flex: 1;
	}

	.btn--sm { padding: var(--space-1) var(--space-3); font-size: var(--text-sm); }
	.empty { font-size: var(--text-sm); color: var(--color-text-muted); }
</style>
