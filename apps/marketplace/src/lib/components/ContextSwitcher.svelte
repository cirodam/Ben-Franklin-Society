<script lang="ts">
	/**
	 * Context Switcher Component
	 * 
	 * Allows users to switch between acting as themselves (personal context)
	 * and acting as associations where they have the act_as permission.
	 */
	
	interface Context {
		uuid: string;
		type: 'person' | 'association';
		label: string;
	}
	
	interface Props {
		currentContext: string;  // acting_as_uuid
		availableContexts: Context[];
		personUuid: string;
	}
	
	let { currentContext, availableContexts, personUuid }: Props = $props();
	
	let isOpen = $state(false);
	let isLoading = $state(false);
	
	const currentLabel = $derived(() => {
		const context = availableContexts.find(c => c.uuid === currentContext);
		return context?.label ?? 'Unknown';
	});
	
	const isPersonal = $derived(currentContext === personUuid);
	
	async function switchTo(contextUuid: string) {
		if (contextUuid === currentContext) {
			isOpen = false;
			return;
		}
		
		isLoading = true;
		
		try {
			const response = await fetch('/api/session/switch-context', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ acting_as_uuid: contextUuid })
			});
			
			if (response.ok) {
				// Reload page to refetch data in new context
				window.location.reload();
			} else {
				const data = await response.json();
				alert(`Failed to switch context: ${data.message ?? 'Unknown error'}`);
				isLoading = false;
			}
		} catch (err) {
			alert('Network error while switching context');
			isLoading = false;
		}
	}
	
	function toggleDropdown() {
		isOpen = !isOpen;
	}
	
	function closeDropdown() {
		isOpen = false;
	}
</script>

<svelte:window onclick={closeDropdown} />

<div class="context-switcher" onclick={(e) => e.stopPropagation()}>
	<button 
		class="switcher-button" 
		class:personal={isPersonal}
		class:association={!isPersonal}
		onclick={toggleDropdown}
		disabled={isLoading}
		aria-label="Switch context"
		aria-expanded={isOpen}
	>
		<span class="context-icon">
			{#if isPersonal}
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
					<circle cx="12" cy="7" r="4"></circle>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
					<circle cx="9" cy="7" r="4"></circle>
					<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
					<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
				</svg>
			{/if}
		</span>
		<span class="context-label">{currentLabel()}</span>
		<span class="dropdown-arrow" class:open={isOpen}>▼</span>
	</button>
	
	{#if isOpen}
		<div class="dropdown-menu">
			{#each availableContexts as context}
				<button
					class="context-option"
					class:active={context.uuid === currentContext}
					class:personal={context.type === 'person'}
					class:association={context.type === 'association'}
					onclick={() => switchTo(context.uuid)}
					disabled={isLoading}
				>
					<span class="option-label">{context.label}</span>
					{#if context.uuid === currentContext}
						<span class="checkmark">✓</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
	
	{#if isLoading}
		<div class="loading-overlay">
			<div class="spinner"></div>
		</div>
	{/if}
</div>

<style>
	.context-switcher {
		position: relative;
		width: 100%;
	}
	
	/* Dark sidebar optimized button */
	.switcher-button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.625rem 0.875rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: var(--radius-md);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: rgba(255, 255, 255, 0.95);
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}
	
	.switcher-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
	}
	
	.switcher-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.switcher-button.association {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.25);
		font-weight: 600;
	}
	
	.switcher-button.association:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.35);
	}
	
	.context-icon {
		display: flex;
		align-items: center;
		color: rgba(255, 255, 255, 0.85);
		flex-shrink: 0;
	}
	
	.context-label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.dropdown-arrow {
		font-size: 0.625rem;
		color: rgba(255, 255, 255, 0.7);
		transition: transform 0.2s;
		flex-shrink: 0;
	}
	
	.dropdown-arrow.open {
		transform: rotate(180deg);
	}
	
	/* Dropdown with light background for readability */
	.dropdown-menu {
		position: absolute;
		bottom: 100%;
		left: 0;
		right: 0;
		margin-bottom: 0.5rem;
		background: var(--tag-paper, #fefdfb);
		border: 1px solid var(--border, #e5e1db);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		max-height: 300px;
		overflow-y: auto;
		z-index: 1000;
	}
	
	.context-option {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--charcoal, #1f1f1f);
		cursor: pointer;
		transition: background 0.15s;
		text-align: left;
	}
	
	.context-option:hover:not(:disabled) {
		background: var(--market-green-light, #e8f2eb);
	}
	
	.context-option:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.context-option.active {
		background: var(--market-green-light, #e8f2eb);
		color: var(--market-green, #4a7c59);
		font-weight: 600;
	}
	
	.context-option.association {
		font-weight: 600;
	}
	
	.option-label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.checkmark {
		color: var(--market-green, #4a7c59);
		font-weight: 700;
		font-size: 1rem;
		flex-shrink: 0;
	}
	
	.loading-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
		border-radius: var(--radius-md);
		z-index: 1001;
	}
	
	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
