<script lang="ts">
	import type { InjuryReportDocument } from '$lib/server/documents/library-types.js';
	import InjuryTypeBadge from './InjuryTypeBadge.svelte';

	interface Props {
		report: InjuryReportDocument;
	}

	let { report }: Props = $props();

	const injuryNumber = parseInt(report.document_id || '0');

	function formatDate(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	const statusConfig: Record<
		string,
		{
			label: string;
			color: string;
		}
	> = {
		filed: { label: 'Filed', color: 'bg-gray-100 text-gray-800' },
		under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-800' },
		mediation: { label: 'Mediation', color: 'bg-purple-100 text-purple-800' },
		resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
		closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700' }
	};

	const status = statusConfig[report.content.status];
</script>

<a
	href="/injuries/{injuryNumber}"
	class="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-gray-300 hover:shadow-md transition-all"
>
	<div class="flex items-start justify-between gap-4">
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-2">
				<h3 class="text-lg font-serif font-semibold text-gray-900">
					Injury Report #{injuryNumber}
				</h3>
				<span class="px-2 py-0.5 text-xs font-medium rounded {status.color}">
					{status.label}
				</span>
			</div>

			<div class="flex flex-wrap gap-1.5 mb-3">
				{#each report.content.injury_types as type}
					<InjuryTypeBadge {type} />
				{/each}
			</div>

			<div class="text-sm text-gray-600 space-y-1">
				<div>
					<span class="font-medium">Incident:</span>
					{formatDate(report.content.incident_start)}
					{#if report.content.incident_end}
						– {formatDate(report.content.incident_end)}
					{/if}
				</div>

				{#if report.content.location}
					<div>
						<span class="font-medium">Location:</span>
						{report.content.location}
					</div>
				{/if}

				<div>
					<span class="font-medium">Filed:</span>
					{formatDate(report.content.filed_at)}
				</div>

				{#if report.content.gravity || report.content.safety_risk}
					<div class="flex gap-4 mt-2">
						{#if report.content.gravity}
							<div>
								<span class="font-medium">Gravity:</span>
								<span class="capitalize">{report.content.gravity}</span>
							</div>
						{/if}
						{#if report.content.safety_risk}
							<div>
								<span class="font-medium">Safety Risk:</span>
								<span class="capitalize">{report.content.safety_risk}</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<div class="text-sm text-gray-500 text-right flex-shrink-0">
			<div>{report.content.accounts.length} account{report.content.accounts.length !== 1 ? 's' : ''}</div>
			<div class="text-xs mt-1">
				{report.content.complainants.length} complainant{report.content.complainants.length !== 1 ? 's' : ''}
			</div>
			<div class="text-xs">
				{report.content.respondents.length} respondent{report.content.respondents.length !== 1 ? 's' : ''}
			</div>
		</div>
	</div>
</a>
