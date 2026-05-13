<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="me-page">
	<h1>My Profile</h1>

	<section class="profile-section">
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
	</section>

	<section class="household-section">
		<div class="section-header">
			<h2>Household</h2>
			<div class="household-actions">
				<button class="btn-secondary" disabled>Create Household</button>
				<button class="btn-secondary" disabled>Join Household</button>
			</div>
		</div>

		{#if data.households.length === 0}
			<p class="no-household">You are not currently a member of any household.</p>
			<p class="help-text">
				Households are optional organizational units that help with resource allocation for food, housing, and other services.
				You can create a household for your family or join an existing one.
			</p>
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
	</section>
</div>

<style>
	.me-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	h1 {
		margin-bottom: 2rem;
		font-size: 2rem;
	}

	section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	h2 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		color: #111827;
	}

	h3 {
		margin: 0;
		font-size: 1.25rem;
		color: #111827;
	}

	h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: #374151;
		font-weight: 600;
	}

	.profile-info {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.75rem 1.5rem;
	}

	dt {
		font-weight: 600;
		color: #6b7280;
	}

	dd {
		margin: 0;
		color: #111827;
	}

	.household-actions {
		display: flex;
		gap: 0.75rem;
	}

	.no-household {
		color: #6b7280;
		margin-bottom: 1rem;
	}

	.help-text {
		color: #9ca3af;
		font-size: 0.875rem;
		line-height: 1.5;
		margin: 0;
	}

	.household-card {
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 1.25rem;
		margin-bottom: 1rem;
	}

	.household-card:last-child {
		margin-bottom: 0;
	}

	.household-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.household-created {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.household-members,
	.household-dependents {
		margin-bottom: 1.5rem;
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
		padding: 0.5rem 0;
		border-bottom: 1px solid #f3f4f6;
	}

	.member-list li:last-child,
	.dependent-list li:last-child {
		border-bottom: none;
	}

	.member-name,
	.dependent-name {
		font-weight: 500;
		color: #111827;
	}

	.member-date,
	.dependent-info {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.household-footer {
		display: flex;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.btn-secondary {
		padding: 0.5rem 1rem;
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-text {
		padding: 0.5rem 0;
		background: none;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6366f1;
		cursor: pointer;
		transition: color 0.2s;
	}

	.btn-text:hover:not(:disabled) {
		color: #4f46e5;
		text-decoration: underline;
	}

	.btn-text:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
