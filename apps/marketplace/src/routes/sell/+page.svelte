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
	.page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 640px; }
	.subtitle { margin: 0; color: var(--color-text-muted); font-size: var(--text-sm); }

	.choices { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); margin-top: var(--space-2); }

	.choice-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-6);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-surface);
		transition: border-color 0.15s, background 0.15s;
	}
	.choice-card:hover {
		border-color: var(--color-accent);
		background: var(--color-surface-alt, #f8fafc);
	}

	.choice-title { font-size: var(--text-base); font-weight: var(--weight-semibold); }
	.choice-desc  { font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.6; }
</style>
