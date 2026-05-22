<script lang="ts">
	import { enhance } from '$app/forms';
	import { Select, Textarea } from '@bfs/ui';
	import type { Gravity, SafetyRisk } from '$lib/server/documents/library-types.js';

	interface Props {
		injuryNumber: number;
		currentGravity: Gravity | null;
		currentSafetyRisk: SafetyRisk | null;
		currentNotes: string | null;
	}

	let { injuryNumber, currentGravity, currentSafetyRisk, currentNotes }: Props = $props();

	let gravity = $state<Gravity | ''>(currentGravity || '');
	let safetyRisk = $state<SafetyRisk | ''>(currentSafetyRisk || '');
	let notes = $state(currentNotes || '');
	let submitting = $state(false);

	// Calculate response urgency based on selections
	let responseLevel = $derived(() => {
		if (!gravity || !safetyRisk) {
			return null;
		}

		if (gravity === 'severe' && safetyRisk === 'high') {
			return {
				level: 'Emergency',
				description:
					'Immediate intervention, protective restrictions, possible temporary suspension',
				color: 'red'
			};
		}
		if (
			(gravity === 'severe' && safetyRisk === 'moderate') ||
			(gravity === 'moderate' && safetyRisk === 'high')
		) {
			return {
				level: 'Priority',
				description: 'Full investigation and accountability process within 48 hours',
				color: 'orange'
			};
		}
		if (gravity === 'severe' && safetyRisk === 'low') {
			return {
				level: 'Urgent',
				description: 'Thorough mediation, focus on repair and understanding',
				color: 'amber'
			};
		}
		if (
			(gravity === 'moderate' && safetyRisk === 'moderate') ||
			(gravity === 'moderate' && safetyRisk === 'low')
		) {
			return {
				level: 'Standard',
				description:
					safetyRisk === 'moderate'
						? 'Full mediation process, follow-up check-ins'
						: 'Mediation with focus on repair and prevention',
				color: 'blue'
			};
		}
		if (gravity === 'minor' && safetyRisk === 'high') {
			return {
				level: 'Monitoring',
				description:
					'Pattern is concerning even if individual harm is minor; accountability plan required',
				color: 'purple'
			};
		}
		if (gravity === 'minor' && safetyRisk === 'moderate') {
			return {
				level: 'Standard',
				description: 'Facilitated dialogue, note pattern for future reference',
				color: 'blue'
			};
		}
		// minor + low
		return {
			level: 'Facilitated',
			description: 'Dialogue and repair, may be handled informally',
			color: 'green'
		};
	});

	const gravityOptions = [
		{ value: '', label: 'Select gravity level...' },
		{ value: 'minor', label: 'Minor' },
		{ value: 'moderate', label: 'Moderate' },
		{ value: 'severe', label: 'Severe' }
	];

	const safetyRiskOptions = [
		{ value: '', label: 'Select safety risk...' },
		{ value: 'low', label: 'Low' },
		{ value: 'moderate', label: 'Moderate' },
		{ value: 'high', label: 'High' }
	];
</script>

<div class="bg-white border border-gray-200 rounded-lg p-6">
	<h3 class="text-lg font-bold mb-4">Assessment</h3>

	<form
		method="POST"
		action="?/assess"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<input type="hidden" name="injuryNumber" value={injuryNumber} />

		<!-- Gravity Assessment -->
		<div class="mb-6">
			<label class="block text-sm font-medium mb-2">
				Gravity Assessment
				<span class="text-gray-500 font-normal">(How serious was the harm?)</span>
			</label>
			<Select
				name="gravity"
				bind:value={gravity}
				options={gravityOptions}
				placeholder="Select gravity level..."
			/>
			<details class="mt-2">
				<summary class="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
					View assessment guidance
				</summary>
				<div class="mt-2 space-y-3 text-sm text-gray-700 bg-gray-50 p-3 rounded">
					<div>
						<strong class="text-gray-900">Minor:</strong> Property/financial harm, easily repaired,
						isolated incident, no lasting effects, misunderstanding rather than deliberate harm, both
						parties functioning normally
					</div>
					<div>
						<strong class="text-gray-900">Moderate:</strong> Significant financial loss, serious reputation
						damage, institutional failure, multiple members affected, physical harm without lasting injury,
						substantial repair effort needed, community disruption, ongoing distress
					</div>
					<div>
						<strong class="text-gray-900">Severe:</strong> Lasting physical injury, actively occurring
						harm, vulnerable person harmed, multiple harm types combined, affects basic functioning, institutional
						endangerment, fundamental community damage, trauma requiring significant healing
					</div>
				</div>
			</details>
		</div>

		<!-- Safety Risk Assessment -->
		<div class="mb-6">
			<label class="block text-sm font-medium mb-2">
				Safety Risk Assessment
				<span class="text-gray-500 font-normal">(Risk of future harm?)</span>
			</label>
			<Select
				name="safetyRisk"
				bind:value={safetyRisk}
				options={safetyRiskOptions}
				placeholder="Select safety risk..."
			/>
			<details class="mt-2">
				<summary class="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
					View assessment guidance
				</summary>
				<div class="mt-2 space-y-3 text-sm text-gray-700 bg-gray-50 p-3 rounded">
					<div>
						<strong class="text-gray-900">Low:</strong> First incident, clearly ended, no violence,
						acknowledged harm, genuine remorse, willing to engage, no pattern, community feels safe,
						unlikely to repeat
					</div>
					<div>
						<strong class="text-gray-900">Moderate:</strong> 2-3 previous incidents, pattern of similar
						harm, recklessness, some resistance to accountability, threats/intimidation, minimizes behavior,
						partial changes made, circumstances may lead to repetition
					</div>
					<div>
						<strong class="text-gray-900">High:</strong> Physical violence involved, ongoing harm, 4+
						previous incidents, escalation pattern, access to vulnerable populations, refuses accountability,
						explicit threats, multiple concerns raised, consistent pattern, seeks opportunities to harm
					</div>
				</div>
			</details>
		</div>

		<!-- Response Level Indicator -->
		{#if responseLevel()}
			<div class="mb-6 p-4 rounded-lg bg-{responseLevel().color}-50 border border-{responseLevel().color}-200">
				<div class="font-bold text-{responseLevel().color}-900 mb-1">
					Response Level: {responseLevel().level}
				</div>
				<div class="text-sm text-{responseLevel().color}-800">
					{responseLevel().description}
				</div>
			</div>
		{/if}

		<!-- Assessment Notes -->
		<div class="mb-6">
			<label class="block text-sm font-medium mb-2">Assessment Notes</label>
			<Textarea
				name="assessmentNotes"
				bind:value={notes}
				placeholder="Record any observations, context, or reasoning behind this assessment..."
				rows={4}
			/>
		</div>

		<!-- Submit -->
		<div class="flex gap-3">
			<button
				type="submit"
				disabled={submitting || !gravity || !safetyRisk}
				class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{submitting ? 'Saving...' : 'Save Assessment'}
			</button>
			{#if currentGravity && currentSafetyRisk}
				<button
					type="button"
					class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
					onclick={() => {
						gravity = currentGravity || '';
						safetyRisk = currentSafetyRisk || '';
						notes = currentNotes || '';
					}}
				>
					Reset to Saved
				</button>
			{/if}
		</div>
	</form>
</div>
