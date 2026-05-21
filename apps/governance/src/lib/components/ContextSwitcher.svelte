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
		governanceUrl?: string;  // For satellite apps that need to call governance API
	}
	
	let { currentContext, availableContexts, personUuid, governanceUrl }: Props = $props();
	
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
			// For satellite apps, call governance API directly; for governance, use local API
			const apiUrl = governanceUrl 
				? `${governanceUrl}/api/session/switch-context`
				: '/api/session/switch-context';
			
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ acting_as_uuid: contextUuid }),
				credentials: 'include'  // Important: include cookies for cross-origin request
			});
			
			if (response.ok) {
				// For satellite apps, clear local session and redirect to trigger re-auth
				if (governanceUrl) {
					// Call local endpoint to clear OIDC session, then redirect
					await fetch('/api/session/clear', { method: 'POST' });
				}
				// Use location.replace to force full page reload without cache
				window.location.replace('/');
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
	
	.switcher-button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.75rem 1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--ink);
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
	}
	
	.switcher-button:hover:not(:disabled) {
		background: var(--surface-hover);
		border-color: var(--border-strong);
	}
	
	.switcher-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.switcher-button.association {
		background: var(--highlight-faint);
		border-color: var(--highlight-border);
	}
	
	.switcher-button.association:hover:not(:disabled) {
		background: var(--highlight-hover);
	}
	
	.context-icon {
		display: flex;
		align-items: center;
		color: var(--ink-mid);
	}
	
	.context-label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.dropdown-arrow {
		font-size: 0.625rem;
		color: var(--ink-mid);
		transition: transform 0.2s;
	}
	
	.dropdown-arrow.open {
		transform: rotate(180deg);
	}
	
	.dropdown-menu {
		position: absolute;
		bottom: 100%;
		left: 0;
		right: 0;
		margin-bottom: 0.5rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		max-height: 300px;
		overflow-y: auto;
		z-index: 1000;
	}
	
	.context-option {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--ink);
		cursor: pointer;
		transition: background 0.15s;
		text-align: left;
	}
	
	.context-option:hover:not(:disabled) {
		background: var(--surface-hover);
	}
	
	.context-option:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.context-option.active {
		background: var(--highlight-faint);
		color: var(--highlight);
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
		color: var(--highlight);
		font-weight: 600;
	}
	
	.loading-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.8);
		border-radius: var(--radius-md);
		z-index: 1001;
	}
	
	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid var(--border);
		border-top-color: var(--highlight);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
