<script lang="ts">
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-header">
		<h1>Social Insurance Fund</h1>
		<p class="subtitle">Provides income protection and benefits to society members.</p>
	</div>

	<div class="stats">
		<div class="stat">
			<div class="stat__value">{data.members.length}</div>
			<div class="stat__label">Members</div>
		</div>
		<div class="stat">
			<div class="stat__value">{data.association.created_at.slice(0, 10)}</div>
			<div class="stat__label">Established</div>
		</div>
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}
	.page-header h1 { margin-bottom: var(--space-1); }
	.subtitle { color: var(--color-text-muted); font-size: var(--text-sm); }
	.stats {
		display: flex;
		gap: var(--space-6);
	}
	.stat {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5) var(--space-6);
		min-width: 140px;
	}
	.stat__value {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
	}
	.stat__label {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: var(--space-1);
	}
</style>
