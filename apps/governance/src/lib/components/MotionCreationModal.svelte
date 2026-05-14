<script lang="ts">
	import { enhance } from '$app/forms';
	
	let { 
		show = $bindable(false),
		bodyUuid,
		bodyName = 'this body',
		action = '?/create',
		deliberationRules = []
	}: {
		show?: boolean;
		bodyUuid: string;
		bodyName?: string;
		action?: string;
		deliberationRules?: Array<{ uuid: string; name: string; minimum_days: number }>;
	} = $props();

	function closeModal() {
		show = false;
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
				<h2>New Motion Before {bodyName}</h2>
				<button type="button" class="modal__close" onclick={closeModal}>×</button>
			</div>
			<form method="POST" {action} use:enhance>
				<input type="hidden" name="body_uuid" value={bodyUuid} />
				
				<div class="form-group">
					<label for="title">Motion Title</label>
					<input type="text" id="title" name="title" required />
				</div>
				
				<div class="form-group">
					<label for="body">Motion Text</label>
					<textarea id="body" name="body" rows="8" required></textarea>
					<small>The formal text of the motion to be considered</small>
				</div>
				
				<div class="form-group">
					<label for="reasoning">Reasoning (optional)</label>
					<textarea id="reasoning" name="reasoning" rows="4"></textarea>
					<small>Why should this motion be considered?</small>
				</div>
				
				{#if deliberationRules.length > 0}
					<div class="form-group">
						<label for="deliberation_rule_uuid">Deliberation Period (optional)</label>
						<select id="deliberation_rule_uuid" name="deliberation_rule_uuid">
							<option value="">— no deliberation period —</option>
							{#each deliberationRules as rule}
								<option value={rule.uuid}>{rule.name}</option>
							{/each}
						</select>
						<small>Minimum time for discussion before voting can begin</small>
					</div>
				{/if}
				
				<div class="modal__actions">
					<button type="button" class="btn btn--secondary" onclick={closeModal}>Cancel</button>
					<button type="submit" class="btn btn--primary">Submit Motion</button>
				</div>
			</form>
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
		background: var(--color-background);
		border-radius: var(--radius-lg);
		max-width: 600px;
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
		border-bottom: 1px solid var(--color-border);
	}

	.modal__header h2 {
		margin: 0;
		font-size: var(--text-xl);
	}

	.modal__close {
		background: none;
		border: none;
		font-size: var(--text-2xl);
		cursor: pointer;
		color: var(--color-text-muted);
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal__close:hover {
		color: var(--color-text);
	}

	form {
		padding: var(--space-5);
	}

	.form-group {
		margin-bottom: var(--space-4);
	}

	.form-group label {
		display: block;
		font-weight: var(--weight-medium);
		margin-bottom: var(--space-2);
	}

	.form-group input,
	.form-group textarea,
	.form-group select {
		width: 100%;
		padding: var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-family: inherit;
		font-size: var(--text-base);
		background: var(--color-background, #fff);
	}

	.form-group small {
		display: block;
		margin-top: var(--space-1);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.modal__actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		margin-top: var(--space-5);
	}

	.btn {
		padding: var(--space-3) var(--space-5);
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
		border-radius: var(--radius);
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn--primary {
		background: var(--color-accent);
		color: white;
	}

	.btn--primary:hover {
		background: var(--color-accent-hover);
	}

	.btn--secondary {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn--secondary:hover {
		background: var(--color-accent-subtle);
	}
</style>
