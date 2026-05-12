<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { marketplaces } = $derived(data);

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString([], { dateStyle: 'medium' });
	}
</script>

<div class="page">
	<h1>Physical Marketplaces</h1>
	<p class="subtitle">Browse in-person market sessions in your community.</p>

	{#if marketplaces.length === 0}
		<p class="empty">No active marketplaces at this time.</p>
	{:else}
		<div class="market-grid">
			{#each marketplaces as market}
				<a href="/markets/{market.uuid}" class="market-card">
					<div class="market-name">{market.name}</div>
					<div class="market-location">{market.location}</div>
					{#if market.default_schedule}
						<div class="market-schedule">{market.default_schedule}</div>
					{/if}
					{#if market.nextSession}
						<div class="market-next">Next: {fmtDate(market.nextSession.starts_at)}</div>
					{:else}
						<div class="market-next market-next--none">No upcoming sessions</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); }
	h1 { margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold); }
	.subtitle { margin: 0; color: var(--color-text-muted); font-size: var(--text-sm); }
	.empty { color: var(--color-text-muted); font-size: var(--text-sm); }

	.market-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-5); }

	.market-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-5);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-surface);
	}
	.market-card:hover { border-color: var(--color-accent); background: var(--color-surface-alt, #f8fafc); }

	.market-name     { font-size: var(--text-base); font-weight: var(--weight-semibold); }
	.market-location { font-size: var(--text-sm); color: var(--color-text-muted); }
	.market-schedule { font-size: var(--text-xs); color: var(--color-text-muted); font-style: italic; }
	.market-next     { margin-top: var(--space-2); font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--color-accent); }
	.market-next--none { color: var(--color-text-muted); font-weight: var(--weight-normal); }
</style>
