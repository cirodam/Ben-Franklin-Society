<script lang="ts">
	import { enhance } from '$app/forms';
	import Textarea from '@bfs/ui/src/Textarea.svelte';
	import Select from '@bfs/ui/src/Select.svelte';

	interface Props {
		injuryNumber: number;
		isComplainant: boolean;
		isRespondent: boolean;
	}

	let { injuryNumber, isComplainant, isRespondent }: Props = $props();

	let submitting = $state(false);
</script>

<form
	method="POST"
	action="?/addAccount"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
	class="space-y-4"
>
	<div>
		<label for="author_role" class="block text-sm font-medium text-gray-700 mb-1">
			Your Role
		</label>
		<Select name="author_role" id="author_role" required>
			{#if isComplainant}
				<option value="complainant">Complainant</option>
			{/if}
			{#if isRespondent}
				<option value="respondent">Respondent</option>
			{/if}
			<option value="witness">Witness</option>
		</Select>
	</div>

	<div>
		<Textarea
			name="account"
			label="Your Account"
			placeholder="Describe what happened from your perspective..."
			rows={8}
			required
		/>
	</div>

	<div class="flex gap-2">
		<button
			type="submit"
			disabled={submitting}
			class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
		>
			{submitting ? 'Submitting...' : 'Submit Account'}
		</button>
	</div>
</form>
