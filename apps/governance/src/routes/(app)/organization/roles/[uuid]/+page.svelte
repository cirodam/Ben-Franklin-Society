<script lang="ts">
	import { Button, Card } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { role, association, section, parentRole, holders, childRoles, permissions, history, canManage } = $derived(data);

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatCompensation(franks: number): string {
		if (franks === 0) return 'Uncompensated';
		return `${franks.toLocaleString()} Franks`;
	}
</script>

<div class="page">
	<div class="page-header">
		<a href="/organization/{association.type === 'service' ? 'services' : association.type === 'college' ? 'colleges' : association.type === 'committee' ? 'committees' : 'associations'}/{association.uuid}" class="back-link">
			← Back to {association.name}
		</a>
		<div class="title-section">
			<h1>{role.title}</h1>
			<div class="role-meta">
				<span class="association-name">{association.name}</span>
				{#if section}
					<span>•</span>
					<span class="section-name">{section.name}</span>
				{/if}
			</div>
		</div>
		{#if canManage}
			<div class="actions">
				<Button variant="secondary" size="sm" href="/organization/roles/{role.uuid}/edit">
					Edit Role
				</Button>
			</div>
		{/if}
	</div>

	<div class="content">
		<div class="primary-column">
			<!-- Description -->
			{#if role.description}
				<section class="role-section">
					<h2>Description</h2>
					<div class="description-text">
						{role.description}
					</div>
				</section>
			{/if}

			<!-- Current Holders -->
			<section class="role-section">
				<h2>Current Holder{holders.length !== 1 ? 's' : ''}</h2>
				{#if holders.length === 0}
					<p class="empty-state">This role is currently vacant.</p>
				{:else}
					<ul class="holders-list">
						{#each holders as holder}
							<li class="holder-item">
								<a href="/organization/people/{holder.uuid}" class="holder-link">
									<span class="holder-name">
										{holder.given_name} {holder.family_name}
									</span>
									<span class="holder-handle">@{holder.handle}</span>
								</a>
								<span class="holder-since">since {formatDate(holder.assigned_at)}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<!-- Child Roles -->
			{#if childRoles.length > 0}
				<section class="role-section">
					<h2>Reports</h2>
					<ul class="child-roles-list">
						{#each childRoles as child}
							<li class="child-role-item">
								<a href="/organization/roles/{child.uuid}" class="child-role-link">
									{child.title}
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<!-- History -->
			{#if history.length > 0}
				<section class="role-section">
					<h2>Assignment History</h2>
					<ul class="history-list">
						{#each history as entry}
							<li class="history-item">
								<div class="history-person">
									<a href="/organization/people/{entry.person_uuid}" class="person-link">
										{entry.given_name} {entry.family_name}
									</a>
								</div>
								<div class="history-dates">
									{formatDate(entry.assigned_at)}
									{#if entry.removed_at}
										<span class="date-separator">–</span>
										{formatDate(entry.removed_at)}
									{:else}
										<span class="current-badge">Current</span>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>

		<div class="sidebar-column">
			<!-- Role Details Card -->
			<div class="details-card">
				<h3>Details</h3>
				<dl class="details-list">
					{#if parentRole}
						<div class="detail-item">
							<dt>Reports To</dt>
							<dd>
								<a href="/organization/roles/{parentRole.uuid}" class="detail-link">
									{parentRole.title}
								</a>
							</dd>
						</div>
					{/if}
					<div class="detail-item">
						<dt>Compensation</dt>
						<dd>{formatCompensation(role.compensation_franks)}</dd>
					</div>
					{#if permissions.length > 0}
						<div class="detail-item">
							<dt>Permissions</dt>
							<dd>
								<ul class="permissions-list">
									{#each permissions as perm}
										<li class="permission-item">
											<code>{perm.app}:{perm.permission}</code>
										</li>
									{/each}
								</ul>
							</dd>
						</div>
					{/if}
				</dl>
			</div>
		</div>
	</div>
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-6);
	}

	.page-header {
		margin-bottom: var(--space-6);
	}

	.back-link {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #7a5c1a;
		text-decoration: none;
		display: inline-block;
		margin-bottom: var(--space-3);
	}

	.back-link:hover {
		color: #d4a24a;
		text-decoration: underline;
	}

	.title-section {
		margin-bottom: var(--space-3);
	}

	.page-header h1 {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-3xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0 0 var(--space-2) 0;
		line-height: 1.2;
	}

	.role-meta {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		color: #7a5c1a;
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}

	.actions {
		margin-top: var(--space-3);
	}

	.content {
		display: grid;
		grid-template-columns: 1fr 350px;
		gap: var(--space-6);
		align-items: start;
	}

	@media (max-width: 900px) {
		.content {
			grid-template-columns: 1fr;
		}
	}

	.primary-column {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.role-section {
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		padding: var(--space-5);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
	}

	.role-section h2 {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: #151c1a;
		margin: 0 0 var(--space-4) 0;
		padding-bottom: var(--space-3);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.description-text {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		line-height: 1.7;
		color: #151c1a;
		white-space: pre-wrap;
	}

	.empty-state {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		font-style: italic;
		color: #374340;
	}

	.holders-list,
	.child-roles-list,
	.history-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.holder-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-3);
		border: 1px solid rgba(45, 90, 79, 0.15);
		background: rgba(250, 250, 247, 0.5);
	}

	.holder-link {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		text-decoration: none;
		flex: 1;
	}

	.holder-name {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		font-weight: 600;
		color: #151c1a;
	}

	.holder-handle {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #7a5c1a;
	}

	.holder-link:hover .holder-name {
		color: #7a5c1a;
	}

	.holder-link:hover .holder-handle {
		color: #d4a24a;
	}

	.holder-since {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #374340;
	}

	.child-role-item {
		padding: var(--space-2) 0;
		border-bottom: 1px solid rgba(45, 90, 79, 0.1);
	}

	.child-role-item:last-child {
		border-bottom: none;
	}

	.child-role-link {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: #7a5c1a;
		text-decoration: none;
	}

	.child-role-link:hover {
		color: #d4a24a;
		text-decoration: underline;
	}

	.history-item {
		padding: var(--space-3);
		border-left: 2px solid rgba(45, 90, 79, 0.2);
		padding-left: var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.history-person {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		font-weight: 600;
	}

	.person-link {
		color: #151c1a;
		text-decoration: none;
	}

	.person-link:hover {
		color: #7a5c1a;
	}

	.history-dates {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #374340;
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}

	.current-badge {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		color: #86c392;
		padding: 2px var(--space-2);
		border: 1px solid #86c392;
		background: #f0f9f4;
	}

	.details-card {
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		padding: var(--space-5);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
		position: sticky;
		top: var(--space-6);
	}

	.details-card h3 {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-lg);
		font-weight: 400;
		color: #151c1a;
		margin: 0 0 var(--space-4) 0;
		padding-bottom: var(--space-3);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.details-list {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.detail-item dt {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		color: #374340;
		font-weight: 400;
	}

	.detail-item dd {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #151c1a;
		margin: 0;
	}

	.detail-link {
		color: #7a5c1a;
		text-decoration: none;
	}

	.detail-link:hover {
		color: #d4a24a;
		text-decoration: underline;
	}

	.permissions-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.permission-item {
		font-family: monospace;
		font-size: var(--text-xs);
		color: #374340;
	}

	.permission-item code {
		background: rgba(45, 90, 79, 0.05);
		padding: 2px var(--space-1);
		border: 1px solid rgba(45, 90, 79, 0.1);
	}
</style>
