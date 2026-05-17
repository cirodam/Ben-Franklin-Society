<script lang="ts">
	import { Button, Card, EmptyState, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="me-page">
	<PageHeader title="My Profile" />

	<Card>
		<h2>Personal Information</h2>
		<dl class="profile-info">
			<dt>Name</dt>
			<dd>{data.person.given_name} {data.person.family_name}</dd>
			
			<dt>Email</dt>
			<dd>{data.person.email}</dd>
			
			<dt>Date of Birth</dt>
			<dd>{new Date(data.person.date_of_birth).toLocaleDateString()}</dd>
			
			<dt>Member Since</dt>
			<dd>{new Date(data.person.created_at).toLocaleDateString()}</dd>
		</dl>
	</Card>

	<Card>
		<div class="section-header">
			<h2>Household</h2>
			<div class="household-actions">
				<Button variant="secondary" disabled>Create Household</Button>
				<Button variant="secondary" disabled>Join Household</Button>
			</div>
		</div>

		{#if data.households.length === 0}
			<div class="household-empty">
				<p class="no-household">You are not currently a member of any household.</p>
				<p class="help-text">
					Households are optional organizational units that help with resource allocation for food, housing, and other services.
					You can create a household for your family or join an existing one.
				</p>
			</div>
		{:else}
			{#each data.households as { household, members, dependents }}
				<div class="household-card">
					<div class="household-header">
						<h3>Household</h3>
						<span class="household-created">
							Created {new Date(household.created_at).toLocaleDateString()}
						</span>
					</div>

					<div class="household-members">
						<h4>Members ({members.length})</h4>
						<ul class="member-list">
							{#each members as member}
								<li>
									<span class="member-name">Member</span>
									<span class="member-date">
										Joined {new Date(member.joined_at).toLocaleDateString()}
									</span>
								</li>
							{/each}
						</ul>
					</div>

					{#if dependents.length > 0}
						<div class="household-dependents">
							<h4>Dependents ({dependents.length})</h4>
							<ul class="dependent-list">
								{#each dependents as dependent}
									<li>
										<span class="dependent-name">
											{dependent.given_name} {dependent.family_name}
										</span>
										<span class="dependent-info">
											{dependent.relationship} • Born {new Date(dependent.date_of_birth).toLocaleDateString()}
										</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					<div class="household-footer">
						<button class="btn-text" disabled>Leave Household</button>
						<button class="btn-text" disabled>Add Dependent</button>
					</div>
				</div>
			{/each}
		{/if}
	</Card>
</div>

<style>
	.me-page {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
	}

	h2 {
		margin: 0;
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	h3 {
		margin: 0;
		font-size: var(--text-lg);
		color: var(--color-text);
	}

	h4 {
		margin: 0 0 var(--space-3) 0;
		font-size: var(--text-base);
		color: var(--color-text);
		font-weight: var(--weight-semibold);
	}

	.profile-info {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-3) var(--space-6);
	}

	dt {
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	dd {
		margin: 0;
		color: var(--color-text);
		font-size: var(--text-sm);
	}

	.household-actions {
		display: flex;
		gap: var(--space-3);
	}

	.household-empty {
		margin-top: var(--space-4);
	}

	.no-household {
		color: var(--color-text-muted);
		margin-bottom: var(--space-3);
		font-size: var(--text-sm);
	}

	.help-text {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: 1.6;
		margin: 0;
	}

	.household-card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-5);
		margin-bottom: var(--space-4);
	}

	.household-card:last-child {
		margin-bottom: 0;
	}

	.household-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-6);
		padding-bottom: var(--space-4);
		border-bottom: 1px solid var(--color-border);
	}

	.household-created {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.household-members,
	.household-dependents {
		margin-bottom: var(--space-6);
	}

	.member-list,
	.dependent-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.member-list li,
	.dependent-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--color-border-faint);
	}

	.member-list li:last-child,
	.dependent-list li:last-child {
		border-bottom: none;
	}

	.member-name,
	.dependent-name {
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	.member-date,
	.dependent-info {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.household-footer {
		display: flex;
		gap: var(--space-4);
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
	}

	.btn-text {
		padding: 0;
		background: none;
		border: none;
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-accent);
		cursor: pointer;
		transition: color 0.2s;
	}

	.btn-text:hover:not(:disabled) {
		color: var(--color-accent);
		text-decoration: underline;
	}

	.btn-text:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
