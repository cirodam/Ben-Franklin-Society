<script lang="ts">
	import { Button } from '@bfs/ui';
	import type { MotionDocument } from '$lib/server/governance/motions.js';

	interface Props {
		motions: MotionDocument[];
		canCreate?: boolean;
		onCreateClick?: () => void;
	}

	let { motions, canCreate = false, onCreateClick }: Props = $props();

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', { 
			month: 'long', 
			day: 'numeric', 
			year: 'numeric'
		});
	}
</script>

<div class="motion-list-card">
	{#if canCreate && onCreateClick}
		<div class="card-header">
			<Button onclick={onCreateClick}>
				{#snippet children()}New Motion{/snippet}
			</Button>
		</div>
	{/if}

	{#if motions.length > 0}
		<div class="motion-list">
			{#each motions as motion}
				<a href="/governance/motions/{motion.uuid}" class="motion-item">
					<div class="motion-title">
						<span class="motion-number">{motion.content.motion_number}</span>
						<span class="separator">•</span>
						<span class="motion-name">{motion.title}</span>
					</div>
					<div class="motion-meta">
						<span class="meta-date">Introduced {formatDate(motion.content.introduced_at || motion.created_at)}</span>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<p class="empty-message">No motions in the docket</p>
		</div>
	{/if}
</div>

<style>
	.motion-list-card {
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
	}

	.card-header {
		display: flex;
		justify-content: flex-end;
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid rgba(45, 90, 79, 0.2);
	}

	.motion-list {
		display: flex;
		flex-direction: column;
	}

	.motion-item {
		display: block;
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid rgba(45, 90, 79, 0.2);
		text-decoration: none;
		color: inherit;
		transition: background 0.2s;
	}

	.motion-item:last-child {
		border-bottom: none;
	}

	.motion-item:hover {
		background: rgba(212, 162, 74, 0.05);
	}

	.motion-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-lg);
		font-weight: 400;
		line-height: 1.4;
		color: #151c1a;
		margin-bottom: var(--space-2);
	}

	.motion-number {
		font-weight: 600;
	}

	.separator {
		margin: 0 var(--space-2);
		color: #7a5c1a;
	}

	.motion-name {
		font-weight: 400;
	}

	.motion-meta {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #5a5a50;
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.meta-author {
		font-style: italic;
	}

	.meta-date {
		font-variant-numeric: oldstyle-nums;
	}

	.empty-state {
		padding: var(--space-12) var(--space-6);
		text-align: center;
	}

	.empty-message {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: var(--color-text-muted);
		margin: 0;
	}

	@media (max-width: 768px) {
		.motion-title {
			font-size: var(--text-base);
		}
	}
</style>
