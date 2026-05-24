<script lang="ts">
	import type { MotionDocument, Provision, MotionStatus } from '@bfs/types';
	import ProvisionEditor from './ProvisionEditor.svelte';
	import Input from '../Input.svelte';
	import Textarea from '../Textarea.svelte';
	import Button from '../Button.svelte';
	import Badge from '../Badge.svelte';
	import Card from '../Card.svelte';

	let {
		motion,
		onUpdate,
		readonly = false
	}: {
		motion: MotionDocument;
		onUpdate?: (updates: Partial<MotionDocument>) => void;
		readonly?: boolean;
	} = $props();

	let title = $state(motion.title);
	let slug = $state(motion.slug);
	let provisions = $state<Provision[]>(motion.content.provisions);
	let clerkNotes = $state(motion.content.clerk_notes || '');
	let parliamentarianNotes = $state(motion.content.parliamentarian_notes || '');

	// Export method to get current editor state
	export function getUpdates(): Partial<MotionDocument> {
		return {
			title,
			slug,
			content: {
				...motion.content,
				provisions,
				clerk_notes: clerkNotes || undefined,
				parliamentarian_notes: parliamentarianNotes || undefined
			}
		};
	}

	function addProvision() {
		const nextNumber = (provisions.length + 1).toString();
		provisions = [...provisions, { number: nextNumber, text: '', reasoning: undefined }];
	}

	function updateProvision(index: number, updates: Partial<Provision>) {
		provisions = provisions.map((p, i) =>
			i === index ? { ...p, ...updates } : p
		);
	}

	function deleteProvision(index: number) {
		provisions = provisions.filter((_, i) => i !== index);
	}

	const statusColors: Record<MotionStatus, 'neutral' | 'accent' | 'success' | 'warn' | 'danger'> = {
		draft: 'neutral',
		introduced: 'accent',
		deliberation: 'accent',
		voting: 'warn',
		adopted: 'success',
		enacted: 'success',
		rejected: 'danger',
		withdrawn: 'neutral'
	};
</script>

<div class="motion-editor">
	<Card>
		<div class="motion-editor__header">
			<div class="motion-editor__status">
				<Badge label={motion.content.status} variant={statusColors[motion.content.status]} />
			</div>

			<div class="motion-editor__metadata">
				<div class="motion-editor__field">
					<label for="title">Motion Title</label>
					<Input
						id="title"
						bind:value={title}
						placeholder="Enter motion title"
						disabled={readonly}
					/>
				</div>

				<div class="motion-editor__field">
					<label for="slug">Slug (URL identifier)</label>
					<Input
						id="slug"
						bind:value={slug}
						placeholder="motion-slug"
						disabled={readonly}
					/>
				</div>
			</div>
		</div>

		<div class="motion-editor__provisions">
			<div class="motion-editor__provisions-header">
				<h3>Provisions</h3>
				{#if !readonly}
					<Button variant="secondary" size="sm" onclick={addProvision}>
						+ Add Provision
					</Button>
				{/if}
			</div>

			{#if provisions.length === 0}
				<div class="motion-editor__empty">
					No provisions yet. Click "Add Provision" to begin drafting.
				</div>
			{:else}
				{#each provisions as provision, index (index)}
					<ProvisionEditor
						{provision}
						onUpdate={(updates) => updateProvision(index, updates)}
						onDelete={readonly ? undefined : () => deleteProvision(index)}
					/>
				{/each}
			{/if}
		</div>

		<div class="motion-editor__notes">
			<div class="motion-editor__field">
				<label for="clerk-notes">Clerk Notes (optional)</label>
				<Textarea
					id="clerk-notes"
					bind:value={clerkNotes}
					placeholder="Administrative notes..."
					rows={3}
					disabled={readonly}
				/>
			</div>

			<div class="motion-editor__field">
				<label for="parliamentarian-notes">Parliamentarian Notes (optional)</label>
				<Textarea
					id="parliamentarian-notes"
					bind:value={parliamentarianNotes}
					placeholder="Procedural notes..."
					rows={3}
					disabled={readonly}
				/>
			</div>
		</div>
	</Card>
</div>

<style>
	.motion-editor {
		width: 100%;
	}

	.motion-editor__header {
		margin-bottom: 2rem;
	}

	.motion-editor__status {
		margin-bottom: 1rem;
	}

	.motion-editor__metadata {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.motion-editor__field label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
		color: var(--color-text-secondary);
	}

	.motion-editor__provisions {
		margin-bottom: 2rem;
		padding-top: 2rem;
		border-top: 1px solid var(--color-border);
	}

	.motion-editor__provisions-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.motion-editor__provisions-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.motion-editor__empty {
		padding: 3rem 2rem;
		text-align: center;
		color: var(--color-text-secondary);
		background: var(--color-surface);
		border: 1px dashed var(--color-border);
		border-radius: 0.375rem;
	}

	.motion-editor__notes {
		padding-top: 2rem;
		border-top: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
