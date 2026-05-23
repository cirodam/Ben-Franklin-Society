<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Textarea, Input } from '@bfs/ui';
	import type { MotionDocument } from '$lib/server/documents/library-types.js';
	
	let { 
		show = $bindable(false),
		bodyName = 'this body',
		draftMotions = []
	}: {
		show?: boolean;
		bodyName?: string;
		draftMotions?: MotionDocument[];
	} = $props();

	let mode = $state<'create' | 'introduce'>('create');
	let selectedMotion = $state<string>('');

	function closeModal() {
		show = false;
		selectedMotion = '';
		mode = 'create';
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			closeModal();
		}
	}
</script>

{#if show}
	<div class="modal-overlay" onclick={handleOverlayClick}>
		<div class="modal">
			<div class="modal__header">
				<h2>Introduce Motion to {bodyName}</h2>
				<button type="button" class="modal__close" onclick={closeModal}>×</button>
			</div>

			{#if draftMotions.length > 0}
				<div class="mode-tabs">
					<button 
						class="mode-tab"
						class:active={mode === 'create'}
						onclick={() => mode = 'create'}
					>
						Create New
					</button>
					<button 
						class="mode-tab"
						class:active={mode === 'introduce'}
						onclick={() => mode = 'introduce'}
					>
						From Drafts ({draftMotions.length})
					</button>
				</div>
			{/if}

			{#if mode === 'create'}
				<form method="POST" action="?/createAndIntroduce" use:enhance>
					<div class="form-content">
						<Input
							name="title"
							label="Motion Title"
							placeholder="e.g., Establish Community Garden Committee"
							required
						/>

						<Textarea
							name="body"
							label="Motion Text"
							hint="What should be done?"
							placeholder="Be it resolved that..."
							rows={6}
							required
						/>

						<Textarea
							name="reasoning"
							label="Reasoning (optional)"
							hint="Why should this be done?"
							placeholder="Explanation and justification..."
							rows={4}
						/>
					</div>
					
					<div class="modal__actions">
						<Button variant="secondary" onclick={closeModal}>Cancel</Button>
						<Button type="submit">Introduce Motion</Button>
					</div>
				</form>
			{:else}
				<form method="POST" action="?/introduceMotion" use:enhance>
					<div class="motion-list">
						{#each draftMotions as motion}
							<label class="motion-card">
								<input 
									type="radio" 
									name="motion_slug" 
									value={motion.slug}
									bind:group={selectedMotion}
								/>
								<div class="motion-card__content">
									<div class="motion-card__title">{motion.title}</div>
									{#if motion.content.provisions.length > 0}
										<div class="motion-card__preview">
											{motion.content.provisions[0].text.slice(0, 150)}{motion.content.provisions[0].text.length > 150 ? '...' : ''}
										</div>
									{/if}
									<div class="motion-card__meta">
										Created {new Date(motion.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
									</div>
								</div>
							</label>
						{/each}
					</div>
					
					<div class="modal__actions">
						<Button variant="secondary" onclick={closeModal}>Cancel</Button>
						<Button type="submit" disabled={!selectedMotion}>Introduce Motion</Button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: var(--space-4);
	}

	.modal {
		background: var(--paper, #fafaf7);
		border-radius: var(--radius-lg);
		max-width: 700px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-5);
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.modal__header h2 {
		margin: 0;
		font-size: var(--text-xl);
		font-family: var(--font-display);
		color: var(--ink);
	}

	.modal__close {
		background: none;
		border: none;
		font-size: var(--text-2xl);
		cursor: pointer;
		color: var(--ink-mid);
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal__close:hover {
		color: var(--ink);
	}

	.mode-tabs {
		display: flex;
		border-bottom: 1px solid rgba(45, 90, 79, 0.15);
	}

	.mode-tab {
		flex: 1;
		padding: var(--space-3);
		background: none;
		border: none;
		font-family: var(--font-label);
		font-size: var(--text-sm);
		letter-spacing: 0.08em;
		color: var(--ink-mid);
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
	}

	.mode-tab:hover {
		color: var(--ink);
		background: var(--tint-gold);
	}

	.mode-tab.active {
		color: var(--ink);
		border-bottom-color: var(--gold);
		background: var(--tint-gold);
	}

	form {
		padding: var(--space-5);
	}

	.form-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-bottom: var(--space-5);
	}

	.motion-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-height: 60vh;
		overflow-y: auto;
		padding: var(--space-1);
		margin-bottom: var(--space-5);
	}

	.motion-card {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-4);
		border: 2px solid rgba(45, 90, 79, 0.15);
		border-radius: var(--radius-md);
		background: white;
		cursor: pointer;
		transition: all 0.2s;
	}

	.motion-card:hover {
		border-color: rgba(122, 92, 26, 0.4);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.motion-card:has(input:checked) {
		border-color: var(--gold);
		background: rgba(122, 92, 26, 0.03);
		box-shadow: 0 2px 8px rgba(122, 92, 26, 0.1);
	}

	.motion-card input[type="radio"] {
		flex-shrink: 0;
		margin-top: 0.25rem;
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
	}

	.motion-card__content {
		flex: 1;
	}

	.motion-card__title {
		font-family: var(--font-prose);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--ink);
		margin-bottom: var(--space-2);
	}

	.motion-card__preview {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
		line-height: 1.6;
		margin-bottom: var(--space-2);
	}

	.motion-card__meta {
		font-family: var(--font-label);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--gold);
	}

	.empty-state {
		padding: var(--space-8) var(--space-5);
		text-align: center;
	}

	.empty-state p {
		font-family: var(--font-prose);
		color: var(--ink-mid);
		margin-bottom: var(--space-2);
	}

	.empty-state__hint {
		font-size: var(--text-sm);
		font-style: italic;
	}

	.modal__actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-4);
		border-top: 1px solid rgba(45, 90, 79, 0.1);
	}
</style>
