<script lang="ts">
	import { PageHeader } from '@bfs/ui';
</script>

<div class="page">
	<PageHeader title="Post a Listing">
		<p class="subtitle">What would you like to post?</p>
	</PageHeader>

	<div class="choices">
		<a href="/sell/classified" class="choice-card">
			<div class="choice-title">Classified Ad</div>
			<div class="choice-desc">
				Sell a physical item, produce, tools, clothing, or anything you have to offer.
				Listings include a price and can expire.
			</div>
		</a>
		<a href="/sell/service" class="choice-card">
			<div class="choice-title">Service Offering</div>
			<div class="choice-desc">
				Offer your skills and labour — trades, childcare, tutoring, transport, and more.
				List a rate per hour, per job, or mark it negotiable.
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
	
	.subtitle {
		margin: 0;
		font-family: var(--font-sans);
		color: var(--slate);
		font-size: var(--text-base);
		line-height: 1.6;
	}

	.choices {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-5);
		margin-top: var(--space-3);
	}

	/* Market stall choice cards */
	.choice-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-7);
		border: 2.5px solid var(--deep-forest);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: var(--charcoal);
		background: var(--canvas);
		transition: all 0.2s;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
	}
	
	.choice-card:hover {
		border-color: var(--market-green);
		background: white;
		box-shadow: 0 6px 16px rgba(74, 124, 89, 0.18);
		transform: translateY(-3px);
	}

	.choice-title {
		font-family: var(--font-serif);
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--market-green);
	}
	
	.choice-desc {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--slate);
		line-height: 1.7;
	}

	@media (max-width: 640px) {
		.choices {
			grid-template-columns: 1fr;
		}
	}
</style>
