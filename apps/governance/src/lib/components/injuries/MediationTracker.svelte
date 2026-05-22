<script lang="ts">
	import { enhance } from '$app/forms';
	import { Select, Textarea } from '@bfs/ui';
	import type { InjuryReportStatus } from '$lib/server/documents/library-types.js';

	interface Props {
		injuryNumber: number;
		currentStatus: InjuryReportStatus;
		currentMediationNotes: string | null;
		currentResolutionSummary: string | null;
		currentClosingNotes: string | null;
		hasAssessment: boolean;
	}

	let {
		injuryNumber,
		currentStatus,
		currentMediationNotes,
		currentResolutionSummary,
		currentClosingNotes,
		hasAssessment
	}: Props = $props();

	let newStatus = $state<InjuryReportStatus | ''>(currentStatus);
	let mediationNotes = $state(currentMediationNotes || '');
	let resolutionSummary = $state(currentResolutionSummary || '');
	let closingNotes = $state(currentClosingNotes || '');
	let submitting = $state(false);

	// Determine which fields are required based on selected status
	let requiresResolution = $derived(newStatus === 'resolved');
	let requiresClosing = $derived(newStatus === 'closed');

	// Status workflow options based on current status
	let statusOptions = $derived(() => {
		const options = [{ value: currentStatus, label: getStatusLabel(currentStatus) }];

		// Allow progression through workflow
		if (currentStatus === 'filed') {
			options.push({ value: 'under_review', label: 'Under Review' });
		}
		if (currentStatus === 'under_review' && hasAssessment) {
			options.push({ value: 'mediation', label: 'In Mediation' });
		}
		if (currentStatus === 'mediation') {
			options.push({ value: 'resolved', label: 'Resolved' });
			options.push({ value: 'closed', label: 'Closed' });
		}

		return options;
	});

	function getStatusLabel(status: InjuryReportStatus): string {
		switch (status) {
			case 'filed':
				return 'Filed';
			case 'under_review':
				return 'Under Review';
			case 'mediation':
				return 'In Mediation';
			case 'resolved':
				return 'Resolved';
			case 'closed':
				return 'Closed';
		}
	}
</script>

<div class="bg-white border border-gray-200 rounded-lg p-6">
	<h3 class="text-lg font-bold mb-4">Mediation Tracking</h3>

	<form
		method="POST"
		action="?/updateStatus"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<input type="hidden" name="injuryNumber" value={injuryNumber} />

		<!-- Status Update -->
		<div class="mb-6">
			<label class="block text-sm font-medium mb-2">Status</label>
			<Select
				name="status"
				bind:value={newStatus}
				options={statusOptions()}
				placeholder="Select status..."
			/>
			<div class="mt-2 text-sm text-gray-600">
				{#if currentStatus === 'filed'}
					<p>Moving to "Under Review" will indicate that assessment has begun.</p>
				{:else if currentStatus === 'under_review'}
					{#if hasAssessment}
						<p>Once assessed, move to "In Mediation" to begin the mediation process.</p>
					{:else}
						<p class="text-amber-700">
							⚠️ An assessment must be completed before moving to mediation.
						</p>
					{/if}
				{:else if currentStatus === 'mediation'}
					<p>
						Select "Resolved" if mediation achieved a mutually acceptable outcome, or "Closed" if the
						case is being closed without resolution.
					</p>
				{/if}
			</div>
		</div>

		<!-- Mediation Notes -->
		<div class="mb-6">
			<label class="block text-sm font-medium mb-2">Mediation Notes</label>
			<Textarea
				name="mediationNotes"
				bind:value={mediationNotes}
				placeholder="Record mediation sessions, agreements reached, action items, or other case notes..."
				rows={4}
			/>
			<p class="mt-1 text-sm text-gray-500">
				These notes are for internal mediation service use and are not shared with parties.
			</p>
		</div>

		<!-- Resolution Summary (shown when resolving) -->
		{#if requiresResolution}
			<div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
				<label class="block text-sm font-medium mb-2">
					Resolution Summary <span class="text-red-600">*</span>
				</label>
				<Textarea
					name="resolutionSummary"
					bind:value={resolutionSummary}
					placeholder="Describe the resolution reached, any agreements made, repair actions committed to, or other outcomes..."
					rows={4}
					required={requiresResolution}
				/>
				<p class="mt-1 text-sm text-gray-700">
					This summary will be visible to both parties and documents the outcome of mediation.
				</p>
			</div>
		{/if}

		<!-- Closing Notes (shown when closing) -->
		{#if requiresClosing}
			<div class="mb-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
				<label class="block text-sm font-medium mb-2">
					Closing Notes <span class="text-red-600">*</span>
				</label>
				<Textarea
					name="closingNotes"
					bind:value={closingNotes}
					placeholder="Explain why this case is being closed without resolution (e.g., parties declined mediation, one party unresponsive, moved to different process)..."
					rows={4}
					required={requiresClosing}
				/>
				<p class="mt-1 text-sm text-gray-700">
					These notes document why the case was closed and will be visible to relevant parties.
				</p>
			</div>
		{/if}

		<!-- Current Status Display -->
		{#if currentResolutionSummary}
			<div class="mb-6">
				<label class="block text-sm font-medium mb-2">Current Resolution</label>
				<div class="p-3 bg-green-50 border border-green-200 rounded text-sm whitespace-pre-wrap">
					{currentResolutionSummary}
				</div>
			</div>
		{/if}

		{#if currentClosingNotes}
			<div class="mb-6">
				<label class="block text-sm font-medium mb-2">Closing Information</label>
				<div class="p-3 bg-gray-50 border border-gray-300 rounded text-sm whitespace-pre-wrap">
					{currentClosingNotes}
				</div>
			</div>
		{/if}

		<!-- Submit -->
		<div class="flex gap-3">
			<button
				type="submit"
				disabled={submitting ||
					!newStatus ||
					(requiresResolution && !resolutionSummary.trim()) ||
					(requiresClosing && !closingNotes.trim())}
				class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{submitting ? 'Saving...' : 'Update Status'}
			</button>
			<button
				type="button"
				class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
				onclick={() => {
					newStatus = currentStatus;
					mediationNotes = currentMediationNotes || '';
					resolutionSummary = currentResolutionSummary || '';
					closingNotes = currentClosingNotes || '';
				}}
			>
				Reset
			</button>
		</div>
	</form>
</div>
