<script lang="ts">
	import { enhance } from '$app/forms';

	let {
		actingAs = null
	}: {
		actingAs?: string | null;
	} = $props();
</script>

{#if actingAs}
	<form method="POST" action="?/comment" use:enhance class="comment-form">
		<div class="comment-form__avatar">
			You
		</div>
		<div class="comment-form__input-wrapper">
			<textarea class="comment-form__input" name="body" rows="3" placeholder="Add to the discussion…" required></textarea>
			<button type="submit" class="btn btn--primary btn--sm">Post Comment</button>
		</div>
	</form>
{:else}
	<p class="discussion__login">Please log in to comment.</p>
{/if}

<style>
	.comment-form {
		display: flex;
		gap: var(--space-3);
		align-items: flex-start;
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
	}

	.comment-form__avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		flex-shrink: 0;
	}

	.comment-form__input-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.comment-form__input {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-family: inherit;
		background: var(--color-bg);
		color: var(--color-text);
		resize: vertical;
		line-height: 1.6;
	}

	.comment-form__input:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.discussion__login {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		padding: var(--space-4);
		background: rgba(255, 255, 255, 0.5);
		border-radius: var(--radius-md);
	}
</style>
