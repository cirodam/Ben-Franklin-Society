<script lang="ts">
	import type { PageData } from './$types.js';
	import InjuryReportCard from '$lib/components/injuries/InjuryReportCard.svelte';

	let { data }: { data: PageData } = $props();

	// Calculate response urgency based on gravity + safety_risk matrix
	function getResponseUrgency(
		gravity: 'minor' | 'moderate' | 'severe' | null,
		safetyRisk: 'low' | 'moderate' | 'high' | null
	): { level: string; label: string; color: string } {
		if (!gravity || !safetyRisk) {
			return { level: 'unassessed', label: 'Needs Assessment', color: 'gray' };
		}

		if (gravity === 'severe' && safetyRisk === 'high') {
			return { level: 'emergency', label: 'Emergency', color: 'red' };
		}
		if (
			(gravity === 'severe' && safetyRisk === 'moderate') ||
			(gravity === 'moderate' && safetyRisk === 'high')
		) {
			return { level: 'priority', label: 'Priority', color: 'orange' };
		}
		if (gravity === 'severe' && safetyRisk === 'low') {
			return { level: 'urgent', label: 'Urgent', color: 'amber' };
		}
		if (
			(gravity === 'moderate' && safetyRisk === 'moderate') ||
			(gravity === 'moderate' && safetyRisk === 'low')
		) {
			return { level: 'standard', label: 'Standard', color: 'blue' };
		}
		if (gravity === 'minor' && safetyRisk === 'high') {
			return { level: 'monitoring', label: 'Monitoring', color: 'purple' };
		}
		if (gravity === 'minor' && safetyRisk === 'moderate') {
			return { level: 'standard', label: 'Standard', color: 'blue' };
		}
		// minor + low
		return { level: 'facilitated', label: 'Facilitated', color: 'green' };
	}

	// Group reports by urgency for quick triage
	let urgencyGroups = $derived(() => {
		const groups: Record<string, typeof data.allReports> = {
			emergency: [],
			priority: [],
			urgent: [],
			monitoring: [],
			standard: [],
			facilitated: [],
			unassessed: []
		};

		for (const report of data.allReports) {
			const urgency = getResponseUrgency(report.content.gravity, report.content.safety_risk);
			groups[urgency.level].push(report);
		}

		return groups;
	});

	let activeTab = $state<'status' | 'urgency'>('urgency');
</script>

<div class="flex items-center justify-between mb-8">
	<h1 class="text-3xl font-bold">Mediation Service Dashboard</h1>
</div>

	<!-- Statistics Summary -->
	<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
		<div class="bg-white border border-gray-200 rounded-lg p-4">
			<div class="text-2xl font-bold">{data.stats.total}</div>
			<div class="text-sm text-gray-600">Total Reports</div>
		</div>
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
			<div class="text-2xl font-bold">{data.byStatus.filed.length}</div>
			<div class="text-sm text-gray-600">Filed (Need Assessment)</div>
		</div>
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<div class="text-2xl font-bold">
				{data.byStatus.under_review.length + data.byStatus.mediation.length}
			</div>
			<div class="text-sm text-gray-600">Active Cases</div>
		</div>
		<div class="bg-green-50 border border-green-200 rounded-lg p-4">
			<div class="text-2xl font-bold">{data.byStatus.resolved.length}</div>
			<div class="text-sm text-gray-600">Resolved</div>
		</div>
		<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
			<div class="text-2xl font-bold">{data.byStatus.closed.length}</div>
			<div class="text-sm text-gray-600">Closed</div>
		</div>
	</div>

	<!-- View Toggle -->
	<div class="flex gap-2 mb-6 border-b border-gray-200">
		<button
			class="px-4 py-2 font-medium {activeTab === 'urgency'
				? 'text-blue-600 border-b-2 border-blue-600'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (activeTab = 'urgency')}
		>
			By Urgency
		</button>
		<button
			class="px-4 py-2 font-medium {activeTab === 'status'
				? 'text-blue-600 border-b-2 border-blue-600'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => (activeTab = 'status')}
		>
			By Status
		</button>
	</div>

	<!-- Urgency View -->
	{#if activeTab === 'urgency'}
		<!-- Unassessed (Need immediate attention) -->
		{#if urgencyGroups().unassessed.length > 0}
			<section class="mb-8">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="inline-block w-3 h-3 rounded-full bg-gray-400"></span>
					Needs Assessment ({urgencyGroups().unassessed.length})
				</h2>
				<div class="space-y-3">
					{#each urgencyGroups().unassessed as report}
						<InjuryReportCard {report} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Emergency -->
		{#if urgencyGroups().emergency.length > 0}
			<section class="mb-8">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="inline-block w-3 h-3 rounded-full bg-red-500"></span>
					Emergency Response Required ({urgencyGroups().emergency.length})
				</h2>
				<div class="space-y-3 p-4 bg-red-50 border border-red-200 rounded-lg">
					{#each urgencyGroups().emergency as report}
						<InjuryReportCard {report} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Priority -->
		{#if urgencyGroups().priority.length > 0}
			<section class="mb-8">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
					Priority ({urgencyGroups().priority.length})
				</h2>
				<div class="space-y-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
					{#each urgencyGroups().priority as report}
						<InjuryReportCard {report} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Urgent -->
		{#if urgencyGroups().urgent.length > 0}
			<section class="mb-8">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="inline-block w-3 h-3 rounded-full bg-amber-500"></span>
					Urgent ({urgencyGroups().urgent.length})
				</h2>
				<div class="space-y-3">
					{#each urgencyGroups().urgent as report}
						<InjuryReportCard {report} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Monitoring -->
		{#if urgencyGroups().monitoring.length > 0}
			<section class="mb-8">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="inline-block w-3 h-3 rounded-full bg-purple-500"></span>
					Monitoring (Pattern Concerns) ({urgencyGroups().monitoring.length})
				</h2>
				<div class="space-y-3">
					{#each urgencyGroups().monitoring as report}
						<InjuryReportCard {report} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Standard -->
		{#if urgencyGroups().standard.length > 0}
			<section class="mb-8">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
					Standard Process ({urgencyGroups().standard.length})
				</h2>
				<div class="space-y-3">
					{#each urgencyGroups().standard as report}
						<InjuryReportCard {report} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Facilitated -->
		{#if urgencyGroups().facilitated.length > 0}
			<section class="mb-8">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="inline-block w-3 h-3 rounded-full bg-green-500"></span>
					Facilitated Dialogue ({urgencyGroups().facilitated.length})
				</h2>
				<div class="space-y-3">
					{#each urgencyGroups().facilitated as report}
						<InjuryReportCard {report} />
					{/each}
				</div>
			</section>
		{/if}
	{/if}

	<!-- Status View -->
	{#if activeTab === 'status'}
		<!-- Filed -->
		{#if data.byStatus.filed.length > 0}
			<section class="mb-8">
				<h2 class="text-xl font-bold mb-4">Filed ({data.byStatus.filed.length})</h2>
				<div class="space-y-3">
					{#each data.byStatus.filed as report}
						<InjuryReportCard {report} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Under Review -->
		{#if data.byStatus.under_review.length > 0}
			<section class="mb-8">
				<h2 class="text-xl font-bold mb-4">Under Review ({data.byStatus.under_review.length})</h2>
				<div class="space-y-3">
					{#each data.byStatus.under_review as report}
						<InjuryReportCard {report} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Mediation -->
		{#if data.byStatus.mediation.length > 0}
			<section class="mb-8">
				<h2 class="text-xl font-bold mb-4">In Mediation ({data.byStatus.mediation.length})</h2>
				<div class="space-y-3">
					{#each data.byStatus.mediation as report}
						<InjuryReportCard {report} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Resolved -->
		{#if data.byStatus.resolved.length > 0}
			<section class="mb-8">
				<h2 class="text-xl font-bold mb-4">Resolved ({data.byStatus.resolved.length})</h2>
				<div class="space-y-3">
					{#each data.byStatus.resolved as report}
						<InjuryReportCard {report} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Closed -->
		{#if data.byStatus.closed.length > 0}
			<section class="mb-8">
				<h2 class="text-xl font-bold mb-4">Closed ({data.byStatus.closed.length})</h2>
				<div class="space-y-3">
					{#each data.byStatus.closed as report}
						<InjuryReportCard {report} />
					{/each}
				</div>
		</section>
	{/if}
{/if}

{#if data.allReports.length === 0}
	<div class="text-center py-12 text-gray-500">
		<p>No injury reports have been filed yet.</p>
	</div>
{/if}
