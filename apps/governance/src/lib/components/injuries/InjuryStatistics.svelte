<script lang="ts">
	interface Props {
		stats: {
			total: number;
			byStatus: {
				filed: number;
				under_review: number;
				mediation: number;
				resolved: number;
				closed: number;
			};
			byGravity: {
				minor: number;
				moderate: number;
				severe: number;
				unassessed: number;
			};
			bySafetyRisk: {
				low: number;
				moderate: number;
				high: number;
				unassessed: number;
			};
		};
	}

	let { stats }: Props = $props();

	let showStats = $state(false);
</script>

<div class="border" style="background: var(--paper); border-color: var(--border); margin-bottom: 1.5rem;">
	<button
		onclick={() => (showStats = !showStats)}
		class="w-full py-3 text-left flex items-center justify-between transition-colors stats-toggle"
		style="padding-left: 1rem; padding-right: 1rem; background: transparent; border: none; cursor: pointer;"
	>
		<span class="t-label-tight" style="font-size: var(--text-sm); color: var(--ink);">
			statistics
			<span class="t-prose" style="margin-left: 0.5rem; color: var(--ink-faint); font-size: var(--text-sm); font-weight: 400;">({stats.total} total)</span>
		</span>
		<svg
			class="transition-transform {showStats ? 'rotate-180' : ''}"
			style="width: 1.25rem; height: 1.25rem; color: var(--ink-faint);"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if showStats}
		<div class="px-4 pb-4 pt-2 space-y-6" style="border-top: 1px solid var(--border-subtle);">
			<!-- By Status -->
			<div>
				<h3 class="t-label mb-2" style="font-size: var(--text-xs); color: var(--ink);">by status</h3>
				<div class="grid grid-cols-2 md:grid-cols-5 gap-3">
					<div class="border p-3" style="background: var(--paper); border-color: var(--border);">
						<div class="t-numeric" style="font-size: var(--text-xl); font-weight: 600; color: var(--ink);">{stats.byStatus.filed}</div>
						<div class="t-label" style="font-size: var(--text-xs); color: var(--ink-mid);">filed</div>
					</div>
					<div class="border p-3" style="background: var(--accent-lt); border-color: var(--accent);">
						<div class="t-numeric" style="font-size: var(--text-xl); font-weight: 600; color: var(--accent);">{stats.byStatus.under_review}</div>
						<div class="t-label" style="font-size: var(--text-xs); color: var(--ink-mid);">under review</div>
					</div>
					<div class="border p-3" style="background: var(--tint-gold-mid); border-color: var(--gold);">
						<div class="t-numeric" style="font-size: var(--text-xl); font-weight: 600; color: var(--gold);">{stats.byStatus.mediation}</div>
						<div class="t-label" style="font-size: var(--text-xs); color: var(--ink-mid);">mediation</div>
					</div>
					<div class="border p-3" style="background: var(--tint-green); border-color: var(--accent-mid);">
						<div class="t-numeric" style="font-size: var(--text-xl); font-weight: 600; color: var(--accent-mid);">{stats.byStatus.resolved}</div>
						<div class="t-label" style="font-size: var(--text-xs); color: var(--ink-mid);">resolved</div>
					</div>
					<div class="border p-3" style="background: var(--surface-dk); border-color: var(--border);">
						<div class="t-numeric" style="font-size: var(--text-xl); font-weight: 600; color: var(--ink-mid);">{stats.byStatus.closed}</div>
						<div class="t-label" style="font-size: var(--text-xs); color: var(--ink-mid);">closed</div>
					</div>
				</div>
			</div>

			<!-- By Gravity -->
			<div>
				<h3 class="t-label mb-2" style="font-size: var(--text-xs); color: var(--ink);">by gravity</h3>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
					<div class="border p-3" style="background: var(--danger-lt); border-color: var(--danger);">
						<div class="t-numeric" style="font-size: var(--text-xl); font-weight: 600; color: var(--danger);">{stats.byGravity.severe}</div>
						<div class="t-label" style="font-size: var(--text-xs); color: var(--ink-mid);">severe</div>
					</div>
					<div class="border p-3" style="background: var(--tint-gold-mid); border-color: var(--gold);">
						<div class="t-numeric" style="font-size: var(--text-xl); font-weight: 600; color: var(--gold);">{stats.byGravity.moderate}</div>
						<div class="t-label" style="font-size: var(--text-xs); color: var(--ink-mid);">moderate</div>
					</div>
					<div class="border p-3" style="background: var(--tint-green); border-color: var(--accent-mid);">
						<div class="t-numeric" style="font-size: var(--text-xl); font-weight: 600; color: var(--accent-mid);">{stats.byGravity.minor}</div>
						<div class="t-label" style="font-size: var(--text-xs); color: var(--ink-mid);">minor</div>
					</div>
					<div class="border p-3" style="background: var(--surface-dk); border-color: var(--border);">
						<div class="t-numeric" style="font-size: var(--text-xl); font-weight: 600; color: var(--ink-mid);">{stats.byGravity.unassessed}</div>
						<div class="t-label" style="font-size: var(--text-xs); color: var(--ink-mid);">unassessed</div>
					</div>
				</div>
			</div>

			<!-- By Safety Risk -->
			<div>
				<h3 class="t-label mb-2" style="font-size: var(--text-xs); color: var(--ink);">by safety risk</h3>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
					<div class="border p-3" style="background: var(--danger-lt); border-color: var(--danger);">
						<div class="t-numeric" style="font-size: var(--text-xl); font-weight: 600; color: var(--danger);">{stats.bySafetyRisk.high}</div>
						<div class="t-label" style="font-size: var(--text-xs); color: var(--ink-mid);">high</div>
					</div>
					<div class="border p-3" style="background: var(--tint-gold-mid); border-color: var(--gold);">
						<div class="t-numeric" style="font-size: var(--text-xl); font-weight: 600; color: var(--gold);">{stats.bySafetyRisk.moderate}</div>
						<div class="t-label" style="font-size: var(--text-xs); color: var(--ink-mid);">moderate</div>
					</div>
					<div class="border p-3" style="background: var(--tint-green); border-color: var(--accent-mid);">
						<div class="t-numeric" style="font-size: var(--text-xl); font-weight: 600; color: var(--accent-mid);">{stats.bySafetyRisk.low}</div>
						<div class="t-label" style="font-size: var(--text-xs); color: var(--ink-mid);">low</div>
					</div>
					<div class="border p-3" style="background: var(--surface-dk); border-color: var(--border);">
						<div class="t-numeric" style="font-size: var(--text-xl); font-weight: 600; color: var(--ink-mid);">{stats.bySafetyRisk.unassessed}</div>
						<div class="t-label" style="font-size: var(--text-xs); color: var(--ink-mid);">unassessed</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.stats-toggle:hover {
		background: var(--tint-gold) !important;
	}
</style>
