<script lang="ts">
	import { Badge, Button } from '@bfs/ui';
	import type { MotionDocument } from '$lib/server/governance/motions.js';

	interface Props {
		motions: MotionDocument[];
		canCreate?: boolean;
		onCreateClick?: () => void;
	}

	let { motions, canCreate = false, onCreateClick }: Props = $props();

	const statusVariant = (status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' => {
		switch (status) {
			case 'enacted': return 'success';
			case 'rejected': return 'danger';
			case 'deliberation': return 'warning';
			case 'introduced': return 'info';
			case 'withdrawn': return 'neutral';
			default: return 'neutral';
		}
	};

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

{#if motions.length > 0}
	<div class="list">
		{#each motions as motion}
			<a href="/governance/motions/{motion.uuid}" class="list-item">
				<div class="list-item__header">
					<span class="list-item__motion-id">{motion.content.motion_number}</span>
					<Badge label={motion.content.status} variant={statusVariant(motion.content.status)} />
				</div>
				<h3 class="list-item__title">{motion.title}</h3>
				<div class="list-item__meta">
					<span>Created {formatDate(motion.created_at)}</span>
				</div>
			</a>
		{/each}
	</div>
{:else}
	<div class="empty-state">
		<p>📋</p>
		<p class="empty-state__message">No motions in the docket</p>
		{#if canCreate && onCreateClick}
			<Button onclick={onCreateClick}>+ New Motion</Button>
		{/if}
	</div>
{/if}

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.list-item {
		display: block;
		padding: var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.list-item:hover {
		border-color: var(--color-accent);
		box-shadow: var(--shadow-sm);
		text-decoration: none;
	}

	.list-item__header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.list-item__motion-id {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
	}

	.list-item__title {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-2) 0;
		line-height: 1.3;
	}

	.list-item__meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.empty-state {
		padding: var(--space-12) var(--space-6);
		text-align: center;
	}

	.empty-state p:first-child {
		font-size: 4rem;
		margin: 0 0 var(--space-4) 0;
	}

	.empty-state__message {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-4) 0;
	}

	@media (max-width: 768px) {
		.list-item__title {
			font-size: var(--text-base);
		}
	}
</style>
