<script lang="ts">
	import type { PageData } from './$types.js';
	import InjuryTypeBadge from '$lib/components/injuries/InjuryTypeBadge.svelte';
	import AddAccountForm from '$lib/components/injuries/AddAccountForm.svelte';
	import AssessmentForm from '$lib/components/injuries/AssessmentForm.svelte';
	import MediationTracker from '$lib/components/injuries/MediationTracker.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const { report } = data;
	const injuryNumber = parseInt(report.document_id || '0');

	// Check if current user is complainant or respondent
	// Note: In a real app, this would come from locals/session data
	// For now, we'll assume all parties can see this page (server checks permissions)
	const isComplainant = report.content.complainants.length > 0;
	const isRespondent = report.content.respondents.length > 0;

	function formatDate(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
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

	let showAddAccountForm = $state(false);
	let showMediationTools = $state(false); // TODO: Set based on Mediation Service role check
</script>

<header class="mb-6">
	<a href="/injuries" class="text-blue-600 hover:text-blue-700 text-sm mb-3 inline-block">
		← Back to Injury Reports
	</a>

	<div class="flex items-start justify-between gap-4 mb-4">
		<div>
			<h1 class="text-3xl font-serif font-bold text-gray-900">
				Injury Report #{injuryNumber}
			</h1>
			<div class="flex items-center gap-2 mt-2">
				<span class="px-2 py-1 text-sm font-medium rounded {status.color}">
					{status.label}
				</span>
				<span class="text-sm text-gray-500">Filed {formatDate(report.content.filed_at)}</span>
			</div>
		</div>
	</div>
</header>

<!-- Injury Types -->
<div class="bg-white border border-gray-200 rounded-lg p-6 mb-4">
	<h2 class="text-lg font-serif font-semibold text-gray-900 mb-3">Injury Types</h2>
	<div class="flex flex-wrap gap-2">
		{#each report.content.injury_types as type}
			<InjuryTypeBadge {type} />
		{/each}
	</div>
</div>

<!-- Incident Details -->
<div class="bg-white border border-gray-200 rounded-lg p-6 mb-4">
	<h2 class="text-lg font-serif font-semibold text-gray-900 mb-3">Incident Details</h2>
	<dl class="space-y-2 text-sm">
		<div>
			<dt class="font-medium text-gray-700">Started:</dt>
			<dd class="text-gray-900">{formatDate(report.content.incident_start)}</dd>
		</div>
		{#if report.content.incident_end}
			<div>
				<dt class="font-medium text-gray-700">Ended:</dt>
				<dd class="text-gray-900">{formatDate(report.content.incident_end)}</dd>
			</div>
		{/if}
		{#if report.content.location}
			<div>
				<dt class="font-medium text-gray-700">Location:</dt>
				<dd class="text-gray-900">{report.content.location}</dd>
			</div>
		{/if}
	</dl>
</div>

<!-- Parties -->
<div class="bg-white border border-gray-200 rounded-lg p-6 mb-4">
	<h2 class="text-lg font-serif font-semibold text-gray-900 mb-3">Parties</h2>

	<div class="space-y-4">
		<div>
			<h3 class="text-sm font-medium text-gray-700 mb-2">
				Complainant{report.content.complainants.length !== 1 ? 's' : ''}
			</h3>
			<ul class="space-y-1">
				{#each report.content.complainants as complainant}
					<li class="text-sm text-gray-900">{complainant.party_name}</li>
				{/each}
			</ul>
		</div>

		<div>
			<h3 class="text-sm font-medium text-gray-700 mb-2">
				Respondent{report.content.respondents.length !== 1 ? 's' : ''}
			</h3>
			<ul class="space-y-1">
				{#each report.content.respondents as respondent}
					<li class="text-sm text-gray-900">{respondent.party_name}</li>
				{/each}
			</ul>
		</div>
	</div>
</div>

<!-- Mediation Service Tools (TODO: Only show for Mediation Service staff) -->
{#if showMediationTools}
	<div class="space-y-4 mb-4">
		<AssessmentForm
			{injuryNumber}
			currentGravity={report.content.gravity}
			currentSafetyRisk={report.content.safety_risk}
			currentNotes={report.content.assessment_notes}
		/>

		<MediationTracker
			{injuryNumber}
			currentStatus={report.content.status}
			currentMediationNotes={report.content.mediation_notes}
			currentResolutionSummary={report.content.resolution_summary}
			currentClosingNotes={report.content.closing_notes}
			hasAssessment={!!(report.content.gravity && report.content.safety_risk)}
		/>
	</div>
{/if}

<!-- Assessments (if any) -->
{#if report.content.gravity || report.content.safety_risk}
	<div class="bg-white border border-gray-200 rounded-lg p-6 mb-4">
		<h2 class="text-lg font-serif font-semibold text-gray-900 mb-3">
			Assessment
		</h2>
		<dl class="space-y-2 text-sm">
			{#if report.content.gravity}
				<div>
					<dt class="font-medium text-gray-700">Gravity:</dt>
					<dd class="text-gray-900 capitalize">{report.content.gravity}</dd>
				</div>
			{/if}
			{#if report.content.safety_risk}
				<div>
					<dt class="font-medium text-gray-700">Safety Risk:</dt>
					<dd class="text-gray-900 capitalize">{report.content.safety_risk}</dd>
				</div>
			{/if}
			{#if report.content.assessed_at}
				<div>
					<dt class="font-medium text-gray-700">Assessed:</dt>
					<dd class="text-gray-900">{formatDate(report.content.assessed_at)}</dd>
				</div>
			{/if}
			{#if report.content.assessment_notes}
				<div>
					<dt class="font-medium text-gray-700">Notes:</dt>
					<dd class="text-gray-900 whitespace-pre-wrap">{report.content.assessment_notes}</dd>
				</div>
			{/if}
		</dl>
	</div>
{/if}

<!-- Resolution (if any) -->
{#if report.content.status === 'resolved' && report.content.resolution_summary}
	<div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
		<h2 class="text-lg font-serif font-semibold text-gray-900 mb-3">Resolution</h2>
		<p class="text-sm text-gray-900 whitespace-pre-wrap">{report.content.resolution_summary}</p>
		{#if report.content.resolved_at}
			<p class="text-xs text-gray-600 mt-2">Resolved {formatDate(report.content.resolved_at)}</p>
		{/if}
	</div>
{/if}

<!-- Closing (if any) -->
{#if report.content.status === 'closed' && report.content.closing_notes}
	<div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
		<h2 class="text-lg font-serif font-semibold text-gray-900 mb-3">Closed</h2>
		<p class="text-sm text-gray-900 whitespace-pre-wrap">{report.content.closing_notes}</p>
		{#if report.content.closed_at}
			<p class="text-xs text-gray-600 mt-2">Closed {formatDate(report.content.closed_at)}</p>
		{/if}
	</div>
{/if}

<!-- Accounts -->
<div class="bg-white border border-gray-200 rounded-lg p-6 mb-4">
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-lg font-serif font-semibold text-gray-900">Incident Accounts</h2>
		<button
			onclick={() => (showAddAccountForm = !showAddAccountForm)}
			class="text-sm text-blue-600 hover:text-blue-700"
			>
				{showAddAccountForm ? 'Cancel' : '+ Add Account'}
			</button>
		</div>

		{#if showAddAccountForm}
			<div class="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
				<AddAccountForm {injuryNumber} {isComplainant} {isRespondent} />
			</div>
		{/if}

		{#if report.content.accounts.length === 0}
			<p class="text-sm text-gray-500">No accounts provided yet.</p>
		{:else}
			<div class="space-y-4">
				{#each report.content.accounts as account}
					<div class="border-l-4 border-gray-300 pl-4 py-2">
						<div class="flex items-baseline gap-2 mb-2">
							<span class="text-sm font-medium text-gray-900">{account.author_name}</span>
						<span class="text-xs text-gray-500 capitalize">({account.author_role})</span>
						<span class="text-xs text-gray-400">•</span>
						<span class="text-xs text-gray-500">{formatDate(account.provided_at)}</span>
					</div>
					<p class="text-sm text-gray-700 whitespace-pre-wrap">{account.account}</p>
				</div>
			{/each}
		</div>
	{/if}
