<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@bfs/ui';

	let {
		actingAs = null
	}: {
		actingAs?: string | null;
	} = $props();
</script>

{#if actingAs}
	<form method="POST" action="?/comment" use:enhance class="comment-form">
		<div class="comment-form__label">Add to the conversation</div>
		<textarea class="comment-form__input" name="body" rows="3" placeholder="Say something..." required></textarea>
		<div class="comment-form__footer">
			<Button type="submit">
				{#snippet children()}Post Comment{/snippet}
			</Button>
		</div>
	</form>
{:else}
	<p class="discussion__login">Please log in to comment.</p>
{/if}

<style>
	.comment-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-bottom: var(--space-8);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.comment-form__label {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.15em;
		color: #374340;
	}

	.comment-form__footer {
		display: flex;
		justify-content: flex-end;
		align-items: center;
	}

	.comment-form__input {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid rgba(45, 90, 79, 0.2);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-family: 'Libre Baskerville', Georgia, serif;
		background: #fafaf7;
		color: #151c1a;
		resize: vertical;
		line-height: 1.6;
	}

	.comment-form__input:focus {
		outline: none;
		border-color: #7a5c1a;
	}

	.discussion__login {
		text-align: center;
		color: #374340;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		padding: var(--space-4);
		background: rgba(250, 250, 247, 0.5);
		border: 1px solid rgba(45, 90, 79, 0.2);
	}
</style>
