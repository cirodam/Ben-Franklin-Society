<script lang="ts">
	import { Card } from '@bfs/ui';
</script>

<div class="stats-page">
	<h1>Network Statistics</h1>
	<p class="subtitle">Detailed network metrics and analytics</p>

	<Card>
		<div class="placeholder">
			<p>Statistics page coming soon</p>
			<p class="hint">
				This page will show network growth over time, lineage depth distribution,
				geographic spread, and other analytics.
			</p>
		</div>
	</Card>
</div>

<style>
	.stats-page {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 600;
	}

	.subtitle {
		margin: 0 0 2rem 0;
		color: var(--color-text-secondary);
		font-size: 1rem;
	}

	.placeholder {
		padding: 4rem 2rem;
		text-align: center;
	}

	.placeholder p {
		margin: 0 0 1rem 0;
		color: var(--color-text-secondary);
		font-size: 1.1rem;
	}

	.hint {
		font-size: 0.95rem;
		font-style: italic;
		max-width: 600px;
		margin: 1rem auto 0;
	}
</style>
