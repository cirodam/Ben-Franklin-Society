<script lang="ts">
	import { PageHeader } from '@bfs/ui';
</script>

<div class="page">
	<PageHeader title="Post a Listing" />

	<div class="choices">
		<a href="/sell/classified" class="choice-card">
			<div class="choice-title">Classified</div>
			<div class="choice-desc">
				Sell goods, produce, tools, clothing, or household items.
			</div>
		</a>
		<a href="/sell/service" class="choice-card">
			<div class="choice-title">Service</div>
			<div class="choice-desc">
				Offer your skills — trades, childcare, tutoring, transport, and more.
			</div>
		</a>
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.choices {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-5);
	}

	.choice-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-8);
		border: 1px solid var(--border-light);
		border-radius: 8px;
		text-decoration: none;
		background: var(--bg-surface);
		box-shadow: var(--shadow-sm);
		transition: all 0.15s ease;
	}
	
	.choice-card:hover {
		border-color: var(--border-accent);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.choice-title {
		font-family: var(--font-serif);
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--market-green);
	}
	
	.choice-desc {
		font-family: var(--font-sans);
		font-size: var(--text-base);
		color: var(--text-secondary);
		line-height: 1.6;
	}

	@media (max-width: 640px) {
		.choices {
			grid-template-columns: 1fr;
		}
	}
</style>
