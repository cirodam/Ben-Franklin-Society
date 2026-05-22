<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';
	import Input from '@bfs/ui/src/Input.svelte';
	import Textarea from '@bfs/ui/src/Textarea.svelte';
	import Checkbox from '@bfs/ui/src/Checkbox.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let submitting = $state(false);
	let selectedComplainants = $state<string[]>([]);
	let selectedRespondents = $state<string[]>([]);
	let searchComplainants = $state('');
	let searchRespondents = $state('');

	const filteredComplainants = $derived(
		data.members.filter(
			(m) =>
				`${m.given_name} ${m.family_name} ${m.handle}`
					.toLowerCase()
					.includes(searchComplainants.toLowerCase()) &&
				!selectedComplainants.includes(m.uuid)
		)
	);

	const filteredRespondents = $derived(
		data.members.filter(
			(m) =>
				`${m.given_name} ${m.family_name} ${m.handle}`
					.toLowerCase()
					.includes(searchRespondents.toLowerCase()) &&
				!selectedRespondents.includes(m.uuid)
		)
	);

	function addComplainant(uuid: string) {
		selectedComplainants = [...selectedComplainants, uuid];
		searchComplainants = '';
	}

	function removeComplainant(uuid: string) {
		selectedComplainants = selectedComplainants.filter((u) => u !== uuid);
	}

	function addRespondent(uuid: string) {
		selectedRespondents = [...selectedRespondents, uuid];
		searchRespondents = '';
	}

	function removeRespondent(uuid: string) {
		selectedRespondents = selectedRespondents.filter((u) => u !== uuid);
	}

	function getPersonName(uuid: string): string {
		const person = data.members.find((m) => m.uuid === uuid);
		return person ? `${person.given_name} ${person.family_name}` : 'Unknown';
	}
</script>

<header style="margin-bottom: 3rem;">
	<a href="/injuries" style="display: inline-block; margin-bottom: 1rem; color: var(--gold); font-size: var(--text-sm); transition: color 0.15s;" class="back-link">
		← Back to Injury Reports
	</a>

	<h1 class="t-display" style="font-size: var(--text-3xl); color: var(--ink); margin-bottom: 1rem;">File Injury Report</h1>
	<p class="t-prose" style="color: var(--ink-mid); font-size: var(--text-sm);">
		File a formal record of harm for review by the Mediation Service.
	</p>
</header>

{#if form?.error}
	<div class="border t-prose" style="margin-bottom: 2rem; padding: 1rem; background: var(--danger-lt); border-color: var(--danger); color: var(--danger); font-size: var(--text-sm);">
		{form.error}
	</div>
{/if}

<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
		style="display: flex; flex-direction: column; gap: 2rem;"
	>
		<!-- Injury Types -->
		<section class="border" style="background: var(--paper); border-color: var(--border); padding: 1.5rem;">
			<h2 class="t-display" style="font-size: var(--text-lg); color: var(--ink); margin-bottom: 1rem;">Injury Types</h2>
			<p class="t-prose" style="font-size: var(--text-sm); color: var(--ink-mid); margin-bottom: 1.5rem;">Select all that apply. Types can be combined.</p>

			<div style="display: flex; flex-direction: column; gap: 0.5rem;">
				<Checkbox name="injury_type_physical">Physical — bodily harm</Checkbox>
				<Checkbox name="injury_type_material">Material — property damage, financial loss</Checkbox>
				<Checkbox name="injury_type_relational">Relational — damage to relationships, reputation</Checkbox>
				<Checkbox name="injury_type_systemic">Systemic — harm from institutional failure or pattern</Checkbox>
				<Checkbox name="injury_type_communal">Communal — harm to community as a whole</Checkbox>
			</div>
		</section>

		<!-- Incident Details -->
		<section class="border" style="background: var(--paper); border-color: var(--border); padding: 1.5rem;">
			<h2 class="t-display" style="font-size: var(--text-lg); color: var(--ink); margin-bottom: 1rem;">Incident Details</h2>

			<div style="display: flex; flex-direction: column; gap: 1rem;">
				<Input
					type="datetime-local"
					name="incident_start"
					label="When did the incident start?"
					required
				/>

				<Input
					type="datetime-local"
					name="incident_end"
					label="When did it end? (optional, leave blank if ongoing or single moment)"
				/>

				<Input
					type="text"
					name="location"
					label="Where did it occur? (optional)"
					placeholder="e.g., Community Workshop, Member's residence, Online"
				/>
			</div>
		</section>

		<!-- Complainants -->
		<section class="border" style="background: var(--paper); border-color: var(--border); padding: 1.5rem;">
			<h2 class="t-display" style="font-size: var(--text-lg); color: var(--ink); margin-bottom: 1rem;">Complainants</h2>
			<p class="t-prose" style="font-size: var(--text-sm); color: var(--ink-mid); margin-bottom: 1.5rem;">
				Who was harmed? Select at least one person. Multiple complainants can be added for joint
				filings.
			</p>

			{#if selectedComplainants.length > 0}
				<div style="margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
					{#each selectedComplainants as uuid}
						<div class="border selected-person" style="display: flex; align-items: center; justify-content: space-between; background: var(--surface-dk); border-color: var(--border); padding: 0.75rem;">
							<span class="t-prose" style="font-size: var(--text-sm); color: var(--ink);">{getPersonName(uuid)}</span>
							<button
								type="button"
								onclick={() => removeComplainant(uuid)}
								class="t-label-tight remove-btn"
								style="font-size: var(--text-xs); color: var(--danger); background: transparent; border: none; cursor: pointer; transition: color 0.15s;"
							>
								remove
							</button>
						</div>
						<input type="hidden" name="complainants" value={uuid} />
					{/each}
				</div>
			{/if}

			<div>
				<input
					type="text"
					bind:value={searchComplainants}
					placeholder="Search for person..."
					class="border search-input"
					style="width: 100%; padding: 0.5rem 0.75rem; border-color: var(--border); background: var(--paper); color: var(--ink); font-family: 'Libre Baskerville', serif; font-size: var(--text-sm);"
				/>
				{#if searchComplainants && filteredComplainants.length > 0}
					<div class="border" style="margin-top: 0.5rem; max-height: 12rem; overflow-y: auto; border-color: var(--border); background: var(--paper);">
						{#each filteredComplainants.slice(0, 10) as person}
							<button
								type="button"
								onclick={() => addComplainant(person.uuid)}
								class="t-prose person-option"
								style="width: 100%; text-align: left; padding: 0.75rem; background: transparent; border: none; cursor: pointer; font-size: var(--text-sm); color: var(--ink); transition: background 0.15s;"
							>
								{person.given_name}
								{person.family_name}
								<span style="color: var(--ink-faint);">(@{person.handle})</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</section>

		<!-- Respondents -->
		<section class="border" style="background: var(--paper); border-color: var(--border); padding: 1.5rem;">
			<h2 class="t-display" style="font-size: var(--text-lg); color: var(--ink); margin-bottom: 1rem;">Respondents</h2>
			<p class="t-prose" style="font-size: var(--text-sm); color: var(--ink-mid); margin-bottom: 1.5rem;">
				Who caused the harm? Select at least one person or association.
			</p>

			{#if selectedRespondents.length > 0}
				<div style="margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
					{#each selectedRespondents as uuid}
						<div class="border selected-person" style="display: flex; align-items: center; justify-content: space-between; background: var(--surface-dk); border-color: var(--border); padding: 0.75rem;">
							<span class="t-prose" style="font-size: var(--text-sm); color: var(--ink);">{getPersonName(uuid)}</span>
							<button
								type="button"
								onclick={() => removeRespondent(uuid)}
								class="t-label-tight remove-btn"
								style="font-size: var(--text-xs); color: var(--danger); background: transparent; border: none; cursor: pointer; transition: color 0.15s;"
							>
								remove
							</button>
						</div>
						<input type="hidden" name="respondents" value={uuid} />
					{/each}
				</div>
			{/if}

			<div>
				<input
					type="text"
					bind:value={searchRespondents}
					placeholder="Search for person..."
					class="border search-input"
					style="width: 100%; padding: 0.5rem 0.75rem; border-color: var(--border); background: var(--paper); color: var(--ink); font-family: 'Libre Baskerville', serif; font-size: var(--text-sm);"
				/>
				{#if searchRespondents && filteredRespondents.length > 0}
					<div class="border" style="margin-top: 0.5rem; max-height: 12rem; overflow-y: auto; border-color: var(--border); background: var(--paper);">
						{#each filteredRespondents.slice(0, 10) as person}
							<button
								type="button"
								onclick={() => addRespondent(person.uuid)}
								class="t-prose person-option"
								style="width: 100%; text-align: left; padding: 0.75rem; background: transparent; border: none; cursor: pointer; font-size: var(--text-sm); color: var(--ink); transition: background 0.15s;"
							>
								{person.given_name}
								{person.family_name}
								<span style="color: var(--ink-faint);">(@{person.handle})</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</section>

		<!-- Initial Account -->
		<section class="border" style="background: var(--paper); border-color: var(--border); padding: 1.5rem;">
			<h2 class="t-display" style="font-size: var(--text-lg); color: var(--ink); margin-bottom: 1rem;">Your Account (Optional)</h2>
			<p class="t-prose" style="font-size: var(--text-sm); color: var(--ink-mid); margin-bottom: 1.5rem;">
				Describe what happened from your perspective. You can add or update this later.
			</p>

			<Textarea
				name="initial_account"
				placeholder="Describe what happened..."
				rows={6}
			/>
		</section>

		<!-- Submit -->
		<div style="display: flex; gap: 1rem;">
			<button
				type="submit"
				disabled={submitting}
				class="btn btn--primary"
			>
				{submitting ? 'filing...' : 'file injury report'}
			</button>
			<a
				href="/injuries"
				class="btn"
			>
				cancel
			</a>
		</div>
	</form>

<style>
	.back-link:hover {
		color: var(--gold-hover);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--border-strong);
	}

	.person-option:hover {
		background: var(--tint-gold) !important;
	}

	.remove-btn:hover {
		color: var(--ink) !important;
	}

	.selected-person {
		transition: background 0.15s;
	}
</style>
