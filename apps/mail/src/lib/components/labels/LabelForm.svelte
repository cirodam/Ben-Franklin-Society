<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Input } from '@bfs/ui';

	let {
		isCreating,
		editingUuid,
		labelName = $bindable(''),
		labelColor = $bindable('#3d5a80'),
		onCancel
	}: {
		isCreating: boolean;
		editingUuid: string | null;
		labelName: string;
		labelColor: string;
		onCancel: () => void;
	} = $props();

	const defaultColors = [
		'#3d5a80', // postal blue
		'#e07a5f', // terracotta
		'#81b29a', // sage green
		'#f2cc8f', // cream
		'#6a4c93', // purple
		'#c9ada7', // taupe
		'#457b9d', // steel blue
		'#e63946' // red
	];
</script>

<div class="label-form">
	<h2>{isCreating ? 'Create Label' : 'Edit Label'}</h2>

	<form
		method="POST"
		action={isCreating ? '?/create' : '?/update'}
		use:enhance={() => {
			return ({ result, update }) => {
				if (result.type === 'success') {
					onCancel();
				}
				update();
			};
		}}
	>
		{#if editingUuid}
			<input type="hidden" name="uuid" value={editingUuid} />
		{/if}

		<label>
			<span>Label Name</span>
			<Input
				type="text"
				name="name"
				placeholder="e.g., Important"
				bind:value={labelName}
				required
			/>
		</label>

		<label>
			<span>Color</span>
			<div class="color-picker">
				<input type="color" name="color" bind:value={labelColor} class="color-input" />
				<div class="color-presets">
					{#each defaultColors as color}
						<button
							type="button"
							class="color-preset"
							style="background-color: {color}"
							class:color-preset--selected={labelColor === color}
							onclick={() => (labelColor = color)}
							title={color}
						></button>
					{/each}
				</div>
			</div>
		</label>

		<div class="form-actions">
			<Button type="submit">{isCreating ? 'Create Label' : 'Save Changes'}</Button>
			<Button type="button" variant="secondary" onclick={onCancel}>Cancel</Button>
		</div>
	</form>
</div>

<style>
	.label-form {
		background: var(--card-background, white);
		border: 1px solid var(--border-color, #ddd);
		border-radius: 6px;
		padding: 2rem;
	}

	.label-form h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
	}

	.label-form label {
		display: block;
		margin-bottom: 1.5rem;
	}

	.label-form label span {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.color-picker {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.color-input {
		width: 100px;
		height: 40px;
		border: 1px solid var(--border-color, #ddd);
		border-radius: 4px;
		cursor: pointer;
	}

	.color-presets {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.color-preset {
		width: 32px;
		height: 32px;
		border: 2px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.color-preset:hover {
		transform: scale(1.1);
	}

	.color-preset--selected {
		border-color: var(--text-primary);
		box-shadow:
			0 0 0 2px white,
			0 0 0 4px var(--text-primary);
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}
</style>
