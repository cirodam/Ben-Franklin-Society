<script lang="ts">
	import type { PageData } from './$types.js';
	import InjuryReportCard from '$lib/components/injuries/InjuryReportCard.svelte';
	import InjuryFilters from '$lib/components/injuries/InjuryFilters.svelte';
	import InjuryStatistics from '$lib/components/injuries/InjuryStatistics.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Build export URL with current filters
	let exportUrl = $derived(() => {
		const params = new URLSearchParams();
		if (data.filters.status) params.set('status', data.filters.status);
		if (data.filters.gravity) params.set('gravity', data.filters.gravity);
		if (data.filters.safety_risk) params.set('safety_risk', data.filters.safety_risk);
		return `/api/injuries/export/csv?${params.toString()}`;
	});
</script>

<header style="margin-bottom: 3rem;">
	<div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
		<h1 class="t-display" style="font-size: var(--text-3xl); color: var(--ink);">Injury Reports</h1>
		<div class="flex gap-3">
			{#if data.reports.length > 0}
				<a
					href={exportUrl()}
					class="btn"
					download
				>
					export csv
				</a>
			{/if}
			<a
				href="/injuries/file"
				class="btn btn--primary"
			>
				file report
			</a>
		</div>
	</div>

	<p class="t-prose" style="color: var(--ink-mid); font-size: var(--text-sm); margin-bottom: 0;">
		Formal records of harm for review by the Mediation Service.
	</p>
</header>

<!-- Statistics -->
<InjuryStatistics stats={data.stats} />

<!-- Filters -->
<InjuryFilters currentFilters={data.filters} />

{#if data.reports.length === 0}
	<div class="text-center px-4" style="padding-top: 4rem; padding-bottom: 4rem;">
		<svg class="mx-auto mb-4" style="width: 3rem; height: 3rem; color: var(--ink-faint);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
		</svg>
		<p class="t-prose mb-2" style="font-size: var(--text-base); font-weight: 600; color: var(--ink);">No injury reports found</p>
		<p class="t-prose mx-auto" style="font-size: var(--text-sm); color: var(--ink-mid); max-width: 32rem;">
			You can only view reports where you are a complainant or respondent.
		</p>
	</div>
{:else}
	<div class="space-y-3">
		{#each data.reports as report (report.uuid)}
			<InjuryReportCard {report} />
		{/each}
	</div>

	{#if data.reports.length === 200}
		<div class="text-center t-prose" style="margin-top: 2rem; font-size: var(--text-sm); color: var(--ink-mid);">
			Showing first 200 reports. Use filters to refine results.
		</div>
	{/if}
{/if}
