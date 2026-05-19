<script lang="ts">
	import { Modal, Input, Button } from '@bfs/ui';
	import { enhance } from '$app/forms';
	
	let {
		open = $bindable(false)
	}: {
		open: boolean;
	} = $props();
	
	let number = $state('');
	let title = $state('');
	
	function handleClose() {
		open = false;
		number = '';
		title = '';
	}
</script>

<Modal bind:open onclose={handleClose} title="Add Article">
	<form method="POST" action="?/addArticle" use:enhance={() => {
		return async ({ update }) => {
			await update();
			handleClose();
		};
	}}>
		<div style="display: flex; flex-direction: column; gap: var(--space-4);">
			<Input
				name="number"
				label="Article Number"
				bind:value={number}
				placeholder="e.g., I, II, III"
				required
			/>
			
			<Input
				name="title"
				label="Article Title"
				bind:value={title}
				required
			/>
			
			<p style="font-size: var(--text-sm); color: var(--color-text-muted);">
				After creating the article, you can add sections to it.
			</p>
			
			<div style="display: flex; gap: var(--space-2); justify-content: flex-end;">
				<Button type="button" variant="secondary" onclick={handleClose}>Cancel</Button>
				<Button type="submit" variant="primary">Add Article</Button>
			</div>
		</div>
	</form>
</Modal>
