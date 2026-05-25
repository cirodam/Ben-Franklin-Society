<script lang="ts">
	import { Card } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	function formatNumber(num: number): string {
		return num.toLocaleString();
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp * 1000).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="dashboard">
	<div class="dashboard-header">
		<h1>Federation Dashboard</h1>
		<p class="subtitle">Network-wide statistics and activity</p>
	</div>

	<div class="stats-grid">
		<Card>
			<div class="stat-card">
				<div class="stat-value">{formatNumber(data.stats.total_societies)}</div>
				<div class="stat-label">Active Societies</div>
			</div>
		</Card>

		<Card>
			<div class="stat-card">
				<div class="stat-value">{formatNumber(data.stats.root_societies)}</div>
				<div class="stat-label">Root Societies</div>
			</div>
		</Card>

		<Card>
			<div class="stat-card">
				<div class="stat-value">{formatNumber(data.stats.total_people)}</div>
				<div class="stat-label">Total Members</div>
			</div>
		</Card>

		<Card>
			<div class="stat-card">
				<div class="stat-value">{formatNumber(data.stats.total_florens_issued)}</div>
				<div class="stat-label">Florens Issued</div>
			</div>
		</Card>
	</div>

	<div class="content-grid">
		<div class="section">
			<Card>
				<h2>Recent Activity</h2>
				<div class="activity-stats">
					<div class="activity-item">
						<span class="activity-value">{data.stats.recent_registrations_24h}</span>
						<span class="activity-label">registrations in last 24 hours</span>
					</div>
					<div class="activity-item">
						<span class="activity-value">{data.stats.recent_registrations_7d}</span>
						<span class="activity-label">registrations in last 7 days</span>
					</div>
					<div class="activity-item">
						<span class="activity-value">{data.stats.recent_registrations_30d}</span>
						<span class="activity-label">registrations in last 30 days</span>
					</div>
				</div>
			</Card>
		</div>

		<div class="section">
			<Card>
				<h2>Recent Registrations</h2>
				{#if data.recentRegistrations.length === 0}
					<p class="empty-state">No societies registered yet</p>
				{:else}
					<div class="registrations-list">
						{#each data.recentRegistrations as society}
							<div class="registration-item">
								<div class="registration-info">
									<a href="/societies/{society.handle}" class="society-handle">
										{society.handle}
									</a>
									{#if society.parent_uuid}
										<span class="society-type">Child Society</span>
									{:else}
										<span class="society-type root">Root Society</span>
									{/if}
								</div>
								<div class="registration-date">
									{formatDate(society.registered_at)}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card>
		</div>
	</div>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.dashboard-header {
		margin-bottom: 1rem;
	}

	.dashboard-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 600;
	}

	.subtitle {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: 1rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.5rem;
	}

	.stat-card {
		padding: 1.5rem;
		text-align: center;
	}

	.stat-value {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--color-primary);
		line-height: 1;
		margin-bottom: 0.5rem;
	}

	.stat-label {
		font-size: 0.95rem;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	.content-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 2rem;
	}

	.section h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		padding: 1rem 1.5rem 0;
	}

	.activity-stats {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0 1.5rem 1.5rem;
	}

	.activity-item {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

	.activity-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
		min-width: 3rem;
	}

	.activity-label {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}

	.registrations-list {
		display: flex;
		flex-direction: column;
		padding: 0 1.5rem 1.5rem;
	}

	.registration-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.registration-item:last-child {
		border-bottom: none;
	}

	.registration-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.society-handle {
		font-weight: 600;
		color: var(--color-text);
		text-decoration: none;
		font-family: monospace;
	}

	.society-handle:hover {
		color: var(--color-primary);
	}

	.society-type {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: var(--color-surface-elevated);
		border-radius: 4px;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.society-type.root {
		background: var(--color-success-subtle);
		color: var(--color-success);
	}

	.registration-date {
		color: var(--color-text-secondary);
		font-size: 0.85rem;
	}

	.empty-state {
		padding: 2rem 1.5rem;
		text-align: center;
		color: var(--color-text-secondary);
		font-style: italic;
	}
</style>
