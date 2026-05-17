<script lang="ts">
	import { Modal, Input, Textarea, Button } from '@bfs/ui';
	import { enhance } from '$app/forms';
	
	let {
		open = $bindable(false),
		articleIdx,
		sectionIdx,
		section
	}: {
		open: boolean;
		articleIdx: number;
		sectionIdx: number;
		section: { title: string; body: string; rationale?: string };
	} = $props();
	
	let title = $state('');
	let body = $state('');
	let rationale = $state('');
	
	// Update form values when section changes
	$effect(() => {
		title = section.title;
		body = section.body;
		rationale = section.rationale || '';
	});
	
	function handleClose() {
		open = false;
	}
</script>

<Modal bind:open onclose={handleClose} title="Edit Section">
	<form method="POST" action="?/updateSection" use:enhance={() => {
		return async ({ update }) => {
			await update();
			handleClose();
		};
	}}>
		<input type="hidden" name="articleIdx" value={articleIdx} />
		<input type="hidden" name="sectionIdx" value={sectionIdx} />
		
		<div style="display: flex; flex-direction: column; gap: var(--space-4);">
			<Input
				name="title"
				label="Section Title"
				bind:value={title}
				required
			/>
			
			<Textarea
				name="body"
				label="Section Body"
				bind:value={body}
				rows={8}
				required
			/>
			
			<Textarea
				name="rationale"
				label="Rationale (optional)"
				bind:value={rationale}
				rows={4}
			/>
			
			<div style="display: flex; gap: var(--space-2); justify-content: flex-end;">
				<Button type="button" variant="secondary" onclick={handleClose}>Cancel</Button>
				<Button type="submit" variant="primary">Save Changes</Button>
			</div>
		</div>
	</form>
</Modal>
