<script lang="ts">
	import { Modal, Input, Button } from '@bfs/ui';
	import { enhance } from '$app/forms';
	
	let {
		open = $bindable(false),
		articleIdx,
		article
	}: {
		open: boolean;
		articleIdx: number;
		article: { number: string; title: string };
	} = $props();
	
	let number = $state('');
	let title = $state('');
	
	// Update form values when article changes
	$effect(() => {
		number = article.number;
		title = article.title;
	});
	
	function handleClose() {
		open = false;
	}
</script>

<Modal bind:open onclose={handleClose} title="Edit Article">
	<form method="POST" action="?/updateArticle" use:enhance={() => {
		return async ({ update }) => {
			await update();
			handleClose();
		};
	}}>
		<input type="hidden" name="articleIdx" value={articleIdx} />
		
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
			
			<div style="display: flex; gap: var(--space-2); justify-content: flex-end;">
				<Button type="button" variant="secondary" onclick={handleClose}>Cancel</Button>
				<Button type="submit" variant="primary">Save Changes</Button>
			</div>
		</div>
	</form>
</Modal>
