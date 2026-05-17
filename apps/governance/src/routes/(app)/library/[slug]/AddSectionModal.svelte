<script lang="ts">
	import { Modal, Input, Textarea, Button } from '@bfs/ui';
	import { enhance } from '$app/forms';
	
	let {
		open = $bindable(false),
		articleIdx
	}: {
		open: boolean;
		articleIdx: number;
	} = $props();
	
	let title = $state('');
	let body = $state('');
	let rationale = $state('');
	
	function handleClose() {
		open = false;
		title = '';
		body = '';
		rationale = '';
	}
</script>

<Modal bind:open onclose={handleClose} title="Add Section">
	<form method="POST" action="?/addSection" use:enhance={() => {
		return async ({ update }) => {
			await update();
			handleClose();
		};
	}}>
		<input type="hidden" name="articleIdx" value={articleIdx} />
		
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
				<Button type="submit" variant="primary">Add Section</Button>
			</div>
		</div>
	</form>
</Modal>
