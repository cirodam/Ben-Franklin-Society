<script lang="ts">
	import { goto } from '$app/navigation';
	import { Select } from '@bfs/ui';
	import type { InjuryReportStatus, Gravity, SafetyRisk, InjuryType } from '$lib/server/documents/library-types.js';

	interface Props {
		currentFilters: {
			status: string | null;
			gravity: string | null;
			safety_risk: string | null;
			injury_type: string | null;
			sort: string | null;
		};
	}

	let { currentFilters }: Props = $props();

	let status = $state<string>(currentFilters.status || '');
	let gravity = $state<string>(currentFilters.gravity || '');
	let safetyRisk = $state<string>(currentFilters.safety_risk || '');
	let injuryTypes = $state<string[]>(currentFilters.injury_type ? currentFilters.injury_type.split(',') : []);
	let sort = $state<string>(currentFilters.sort || 'filed_at_desc');
	let showFilters = $state(false);

	const statusOptions = [
		{ value: '', label: 'All statuses' },
		{ value: 'filed', label: 'Filed' },
		{ value: 'under_review', label: 'Under Review' },
		{ value: 'mediation', label: 'In Mediation' },
		{ value: 'resolved', label: 'Resolved' },
		{ value: 'closed', label: 'Closed' }
	];

	const gravityOptions = [
		{ value: '', label: 'All gravity levels' },
		{ value: 'minor', label: 'Minor' },
		{ value: 'moderate', label: 'Moderate' },
		{ value: 'severe', label: 'Severe' }
	];

	const safetyRiskOptions = [
		{ value: '', label: 'All safety risk levels' },
		{ value: 'low', label: 'Low' },
		{ value: 'moderate', label: 'Moderate' },
		{ value: 'high', label: 'High' }
	];

	const sortOptions = [
		{ value: 'filed_at_desc', label: 'Filed (newest first)' },
		{ value: 'filed_at_asc', label: 'Filed (oldest first)' },
		{ value: 'resolved_at_desc', label: 'Resolved (newest first)' },
		{ value: 'gravity', label: 'Gravity (highest first)' },
		{ value: 'safety_risk', label: 'Safety Risk (highest first)' }
	];

	const injuryTypesList: { value: InjuryType; label: string }[] = [
		{ value: 'physical', label: 'Physical' },
		{ value: 'material', label: 'Material' },
		{ value: 'relational', label: 'Relational' },
		{ value: 'systemic', label: 'Systemic' },
		{ value: 'communal', label: 'Communal' }
	];

	function toggleInjuryType(type: InjuryType) {
		if (injuryTypes.includes(type)) {
			injuryTypes = injuryTypes.filter((t) => t !== type);
		} else {
			injuryTypes = [...injuryTypes, type];
		}
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (status) params.set('status', status);
		if (gravity) params.set('gravity', gravity);
		if (safetyRisk) params.set('safety_risk', safetyRisk);
		if (injuryTypes.length > 0) params.set('injury_type', injuryTypes.join(','));
		if (sort && sort !== 'filed_at_desc') params.set('sort', sort);

		goto(`/injuries?${params.toString()}`);
	}

	function clearFilters() {
		status = '';
		gravity = '';
		safetyRisk = '';
		injuryTypes = [];
		sort = 'filed_at_desc';
		goto('/injuries');
	}

	let hasActiveFilters = $derived(
		status || gravity || safetyRisk || injuryTypes.length > 0 || sort !== 'filed_at_desc'
	);
</script>

<div class="border" style="background: var(--paper); border-color: var(--border); margin-bottom: 2rem;">
	<div class="flex items-center justify-between">
		<button
			onclick={() => (showFilters = !showFilters)}
			class="flex-1 py-3 text-left flex items-center justify-between transition-colors filter-toggle"
			style="padding-left: 1rem; padding-right: 1rem; background: transparent; border: none; cursor: pointer;"
		>
			<span class="flex items-center gap-2">
				<span class="t-label-tight" style="font-size: var(--text-sm); color: var(--ink);">filters & sort</span>
				{#if hasActiveFilters}
					<span class="t-label-tight" style="padding: 0.25rem 0.5rem; font-size: var(--text-xs); background: var(--accent-lt); color: var(--accent); border: 1px solid var(--border);">active</span>
				{/if}
			</span>
			<svg
				class="transition-transform {showFilters ? 'rotate-180' : ''}"
				style="width: 1.25rem; height: 1.25rem; color: var(--ink-faint);"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		{#if hasActiveFilters}
			<button
				onclick={clearFilters}
				class="t-label-tight clear-filters-btn"
				style="padding: 0 1rem; font-size: var(--text-sm); color: var(--ink-mid); background: transparent; border: none; cursor: pointer; transition: color 0.15s;"
			>
				clear all
			</button>
		{/if}
	</div>

	{#if showFilters}
		<div class="px-4 pb-4 pt-2 space-y-4" style="border-top: 1px solid var(--border-subtle);">
			<!-- Sort -->
			<div>
				<label class="t-label block mb-2" style="font-size: var(--text-xs); color: var(--ink-mid);">sort by</label>
				<Select name="sort" bind:value={sort} options={sortOptions} />
			</div>

			<!-- Status -->
			<div>
				<label class="t-label block mb-2" style="font-size: var(--text-xs); color: var(--ink-mid);">status</label>
				<Select name="status" bind:value={status} options={statusOptions} />
			</div>

			<!-- Injury Types -->
			<div>
				<label class="t-label block mb-2" style="font-size: var(--text-xs); color: var(--ink-mid);">injury types</label>
				<div class="flex flex-wrap gap-2">
					{#each injuryTypesList as type}
						<button
							onclick={() => toggleInjuryType(type.value)}
							class="t-label-tight transition-colors injury-type-btn"
							class:selected={injuryTypes.includes(type.value)}
							style="padding: 0.5rem 0.75rem; font-size: var(--text-sm); cursor: pointer;"
						>
							{type.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Gravity -->
			<div>
				<label class="t-label block mb-2" style="font-size: var(--text-xs); color: var(--ink-mid);">gravity</label>
				<Select name="gravity" bind:value={gravity} options={gravityOptions} />
			</div>

			<!-- Safety Risk -->
			<div>
				<label class="t-label block mb-2" style="font-size: var(--text-xs); color: var(--ink-mid);">safety risk</label>
				<Select name="safetyRisk" bind:value={safetyRisk} options={safetyRiskOptions} />
			</div>

			<!-- Apply Button -->
			<div class="flex gap-3 pt-2">
				<button
					onclick={applyFilters}
					class="btn btn--primary"
				>
					apply filters
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.filter-toggle:hover {
		background: var(--tint-gold) !important;
	}

	.clear-filters-btn:hover {
		color: var(--ink) !important;
	}

	.injury-type-btn {
		border: 1px solid var(--border);
		background: transparent;
		color: var(--ink-mid);
	}

	.injury-type-btn.selected {
		border-color: var(--accent);
		background: var(--accent-lt);
		color: var(--accent);
	}

	.injury-type-btn:not(.selected):hover {
		background: var(--tint-gold);
	}
</style>
