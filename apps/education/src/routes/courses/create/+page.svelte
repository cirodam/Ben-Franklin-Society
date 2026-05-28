<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let deliveryFormat = $state('classroom');
	let courseType = $state('enrichment');
</script>

<svelte:head>
	<title>Create Course - Education</title>
</svelte:head>

<h1>Create New Course</h1>

<div class="card" style="max-width: 800px;">
	<form method="POST" use:enhance>
		<div style="display: flex; flex-direction: column; gap: 1.5rem;">
			<div>
				<label for="title"><strong>Course Title</strong></label>
				<input type="text" id="title" name="title" required />
			</div>

			<div>
				<label for="description"><strong>Description</strong></label>
				<textarea id="description" name="description" rows="4" required></textarea>
			</div>

			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
				<div>
					<label for="courseType"><strong>Course Type</strong></label>
					<select id="courseType" name="courseType" bind:value={courseType} required>
						<option value="enrichment">Enrichment</option>
						<option value="competency">Competency</option>
						<option value="foundational">Foundational</option>
					</select>
				</div>

				<div>
					<label for="deliveryFormat"><strong>Delivery Format</strong></label>
					<select id="deliveryFormat" name="deliveryFormat" bind:value={deliveryFormat} required>
						<option value="classroom">Classroom</option>
						<option value="one_on_one">One-on-One</option>
					</select>
				</div>
			</div>

			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
				<div>
					<label for="location"><strong>Location</strong></label>
					<input type="text" id="location" name="location" placeholder="e.g., Community Hall or 'remote'" required />
				</div>

				<div>
					<label for="capacity"><strong>Capacity</strong></label>
					<input type="number" id="capacity" name="capacity" min="1" value={deliveryFormat === 'one_on_one' ? 1 : 20} required />
				</div>
			</div>

			{#if deliveryFormat === 'classroom'}
				<div>
					<label for="durationWeeks"><strong>Duration (weeks)</strong></label>
					<input type="number" id="durationWeeks" name="durationWeeks" min="1" value="12" />
				</div>
			{/if}

			<div>
				<label for="prerequisites"><strong>Prerequisites (optional)</strong></label>
				<textarea id="prerequisites" name="prerequisites" rows="2"></textarea>
			</div>

			{#if form?.error}
				<div style="color: var(--color-error); padding: 1rem; border: 1px solid var(--color-error); border-radius: 4px;">
					{form.error}
				</div>
			{/if}

			<div style="display: flex; gap: 1rem;">
				<button type="submit" class="primary">Create Course</button>
				<a href="/courses"><button type="button">Cancel</button></a>
			</div>
		</div>
	</form>
</div>
