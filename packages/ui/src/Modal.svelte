<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	let {
		open = $bindable(false),
		title = undefined,
		onclose = undefined,
		children,
		footer = undefined,
		size = 'md',
		...rest
	}: {
		open?: boolean;
		title?: string;
		onclose?: () => void;
		children: Snippet;
		footer?: Snippet;
		size?: 'sm' | 'md' | 'lg';
		[key: string]: unknown;
	} = $props();

	let dialogElement: HTMLDialogElement | undefined = $state();

	// Handle ESC key
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			close();
		}
	}

	// Close modal
	function close() {
		open = false;
		onclose?.();
	}

	// Handle backdrop click
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialogElement) {
			close();
		}
	}

	// Sync open state with dialog element
	$effect(() => {
		if (!dialogElement) return;
		
		if (open && !dialogElement.open) {
			dialogElement.showModal();
		} else if (!open && dialogElement.open) {
			dialogElement.close();
		}
	});

	onMount(() => {
		return () => {
			// Cleanup on unmount
			if (dialogElement?.open) {
				dialogElement.close();
			}
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<dialog
		bind:this={dialogElement}
		class="modal modal--{size}"
		onclick={handleBackdropClick}
		{...rest}
	>
		<div class="modal__content" onclick={(e) => e.stopPropagation()}>
			{#if title}
				<div class="modal__header">
					<h2 class="modal__title">{title}</h2>
					<button type="button" class="modal__close" onclick={close} aria-label="Close">
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
						</svg>
					</button>
				</div>
			{/if}

			<div class="modal__body">
				{@render children()}
			</div>

			{#if footer}
				<div class="modal__footer">
					{@render footer()}
				</div>
			{/if}
		</div>
	</dialog>
{/if}

<style>
	.modal {
		border: none;
		border-radius: var(--radius-lg);
		padding: 0;
		box-shadow: var(--shadow-xl);
		max-height: 90vh;
		overflow: auto;
		margin: auto;
		position: fixed;
		inset: 0;
	}

	.modal::backdrop {
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(2px);
	}

	.modal[open] {
		animation: modal-fade-in 200ms ease-out;
	}

	@keyframes modal-fade-in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.modal__content {
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
	}

	/* Sizes */
	.modal--sm .modal__content {
		width: 400px;
		max-width: 90vw;
	}

	.modal--md .modal__content {
		width: 600px;
		max-width: 90vw;
	}

	.modal--lg .modal__content {
		width: 900px;
		max-width: 95vw;
	}

	.modal__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-5);
		border-bottom: 1px solid var(--color-border);
	}

	.modal__title {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.modal__close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: transparent;
		border-radius: var(--radius);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: background 120ms, color 120ms;
		padding: 0;
	}

	.modal__close:hover {
		background: var(--color-bg-muted);
		color: var(--color-text);
	}

	.modal__body {
		padding: var(--space-5);
		overflow-y: auto;
		flex: 1;
	}

	.modal__footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-5);
		border-top: 1px solid var(--color-border);
	}
</style>
