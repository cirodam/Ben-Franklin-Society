<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@bfs/ui';

	let {
		open = $bindable(false),
		sessionUuid,
		motionTitle
	}: {
		open?: boolean;
		sessionUuid: string;
		motionTitle: string;
	} = $props();

	let selectedVote = $state<'aye' | 'nay' | 'abstain' | null>(null);
	let submitting = $state(false);
	let errorMessage = $state<string>('');
</script>

{#if open}
	<div class="modal-backdrop" onclick={() => open = false} role="presentation"></div>
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
		<div class="modal-content">
			<div class="modal-header">
				<h2 id="modal-title">Cast Your Vote</h2>
				<button class="close-button" onclick={() => open = false} aria-label="Close modal">×</button>
			</div>

			<div class="modal-body">
				<div class="motion-title">
					<strong>Motion:</strong> {motionTitle}
				</div>

				<p class="voting-instructions">
					Your vote is <strong>secret</strong>. Only the tally is recorded, not individual votes. You cannot change your vote once submitted.
				</p>

				<form 
					method="POST" 
					action="?/vote" 
					use:enhance={() => {
						submitting = true;
						errorMessage = '';
						return async ({ result, update }) => {
							submitting = false;
							if (result.type === 'failure') {
								errorMessage = result.data?.error || 'Failed to cast vote';
							} else if (result.type === 'success') {
								await update();
								open = false;
							}
						};
					}}
				>
					<input type="hidden" name="session_uuid" value={sessionUuid} />

					<div class="vote-choices">
						<label class="vote-choice" class:selected={selectedVote === 'aye'}>
							<input 
								type="radio" 
								name="choice" 
								value="aye" 
								bind:group={selectedVote}
								required
							/>
							<span class="choice-icon">✓</span>
							<div class="choice-content">
								<span class="choice-label aye">Aye</span>
								<span class="choice-desc">Support the motion</span>
							</div>
						</label>

						<label class="vote-choice" class:selected={selectedVote === 'nay'}>
							<input 
								type="radio" 
								name="choice" 
								value="nay" 
								bind:group={selectedVote}
								required
							/>
							<span class="choice-icon">✗</span>
							<div class="choice-content">
								<span class="choice-label nay">Nay</span>
								<span class="choice-desc">Oppose the motion</span>
							</div>
						</label>

						<label class="vote-choice" class:selected={selectedVote === 'abstain'}>
							<input 
								type="radio" 
								name="choice" 
								value="abstain" 
								bind:group={selectedVote}
								required
							/>
							<span class="choice-icon">—</span>
							<div class="choice-content">
								<span class="choice-label abstain">Abstain</span>
								<span class="choice-desc">No position</span>
							</div>
						</label>
					</div>

					{#if errorMessage}
						<div class="error-message">{errorMessage}</div>
					{/if}

					<div class="modal-actions">
						<Button variant="ghost" type="button" onclick={() => open = false}>
							{#snippet children()}Cancel{/snippet}
						</Button>
						<Button 
							variant="primary" 
							type="submit" 
							disabled={!selectedVote || submitting}
						>
							{#snippet children()}{submitting ? 'Submitting...' : 'Submit Vote'}{/snippet}
						</Button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 999;
		backdrop-filter: blur(2px);
	}

	.modal {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
	}

	.modal-content {
		background: var(--color-surface);
		border: 2px solid rgba(45, 90, 79, 0.3);
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 
			0 8px 32px rgba(0, 0, 0, 0.15),
			0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-6);
		border-bottom: 1px solid rgba(45, 90, 79, 0.2);
	}

	.modal-header h2 {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-2xl);
		font-weight: 400;
		margin: 0;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 2rem;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
		transition: color 0.15s;
	}

	.close-button:hover {
		color: var(--color-text);
	}

	.modal-body {
		padding: var(--space-6);
	}

	.motion-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		padding: var(--space-3);
		background: rgba(250, 250, 247, 0.8);
		border: 1px solid rgba(45, 90, 79, 0.2);
		margin-bottom: var(--space-4);
	}

	.voting-instructions {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--space-6);
		line-height: 1.6;
	}

	.vote-choices {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-bottom: var(--space-6);
	}

	.vote-choice {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4);
		border: 2px solid rgba(45, 90, 79, 0.2);
		background: var(--color-surface);
		cursor: pointer;
		transition: all 0.2s;
	}

	.vote-choice:hover {
		border-color: var(--color-accent);
		background: rgba(250, 250, 247, 0.5);
	}

	.vote-choice.selected {
		border-color: var(--color-accent);
		background: rgba(45, 90, 79, 0.1);
		box-shadow: 0 0 0 2px rgba(45, 90, 79, 0.1);
	}

	.vote-choice input[type="radio"] {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.choice-icon {
		font-size: 1.5rem;
		line-height: 1;
		font-weight: bold;
		min-width: 32px;
		text-align: center;
	}

	.choice-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}

	.choice-label {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-lg);
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	.choice-label.aye {
		color: #2e7d32;
	}

	.choice-label.nay {
		color: #c62828;
	}

	.choice-label.abstain {
		color: #757575;
	}

	.choice-desc {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.error-message {
		padding: var(--space-3);
		background: #ffebee;
		border: 1px solid #ef5350;
		color: #c62828;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		margin-bottom: var(--space-4);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding-top: var(--space-4);
		border-top: 1px solid rgba(45, 90, 79, 0.1);
	}
</style>
