<script lang="ts">
	let {
		isSaving = false,
		lastSavedAt = null
	}: {
		isSaving?: boolean;
		lastSavedAt?: Date | null;
	} = $props();

	function formatSaveTime(date: Date | null): string {
		if (!date) return '';
		const now = new Date();
		const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (diffSeconds < 10) return 'just now';
		if (diffSeconds < 60) return `${diffSeconds}s ago`;
		const diffMinutes = Math.floor(diffSeconds / 60);
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		const diffHours = Math.floor(diffMinutes / 60);
		return `${diffHours}h ago`;
	}
</script>

{#if isSaving}
	<div class="autosave-indicator autosave-indicator--saving">💾 Saving draft...</div>
{:else if lastSavedAt}
	<div class="autosave-indicator autosave-indicator--saved">
		✓ Draft saved {formatSaveTime(lastSavedAt)}
	</div>
{/if}

<style>
	.autosave-indicator {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		text-align: center;
		transition: all 0.3s;
	}

	.autosave-indicator--saving {
		background: var(--paper-light-blue);
		color: var(--postal-primary);
		border: 1px solid var(--postal-primary);
	}

	.autosave-indicator--saved {
		background: var(--success-background, #efe);
		color: var(--success-color, #060);
		border: 1px solid var(--success-border, #cfc);
	}
</style>
