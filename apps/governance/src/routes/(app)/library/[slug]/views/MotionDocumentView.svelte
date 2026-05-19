<script lang="ts">
	import type { MotionDocument } from '$lib/server/documents/library-types.js';
	import DocumentView from './DocumentView.svelte';

	let { document: doc }: { document: MotionDocument } = $props();

	const statusVariant: Record<string, string> = {
		draft:        'status--draft',
		introduced:   'status--introduced',
		deliberation: 'status--deliberation',
		enacted:      'status--enacted',
		rejected:     'status--rejected',
		withdrawn:    'status--withdrawn',
	};
</script>

<DocumentView>
	{#snippet header()}
		<div class="document-title-block">
			<div class="motion-letterhead">
				<div class="letterhead-body">The Ben Franklin Society</div>
				<div class="letterhead-motion-number">
					{doc.content.motion_number || `#${doc.uuid.slice(0, 8)}`}
				</div>
			</div>
			<h1 class="document-title">{doc.title}</h1>
			<div class="document-meta">
				<span class="type-badge">Motion</span>
				<span class="status-badge {statusVariant[doc.content.status] ?? ''}">
					{doc.content.status}
				</span>
			</div>
		</div>
		<div class="motion-meta">
			<div class="meta-row">
				<span class="meta-label">Introduced:</span>
				<span class="meta-value">{doc.content.introduced_at ? new Date(doc.content.introduced_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not yet introduced'}</span>
			</div>
			{#if doc.content.adopted_at}
				<div class="meta-row">
					<span class="meta-label">Adopted:</span>
					<span class="meta-value">{new Date(doc.content.adopted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
				</div>
			{/if}
			{#if doc.content.enacted_at}
				<div class="meta-row">
					<span class="meta-label">Enacted:</span>
					<span class="meta-value">{new Date(doc.content.enacted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet body()}
		<div class="motion-body">
			<div class="body-section">
				<div class="body-text">{doc.content.body}</div>
			</div>

			{#if doc.content.reasoning}
				<div class="reasoning-section">
					<h2 class="section-heading">Reasoning</h2>
					<div class="section-text">{doc.content.reasoning}</div>
				</div>
			{/if}

			{#if doc.content.clerk_notes}
				<div class="clerk-annotation">
					<div class="annotation-stamp">Clerk</div>
					<div class="annotation-content">
						<div class="annotation-heading">Administrative Notes</div>
						<div class="annotation-text">{doc.content.clerk_notes}</div>
					</div>
				</div>
			{/if}

			{#if doc.content.parliamentarian_notes}
				<div class="parliamentarian-annotation">
					<div class="annotation-stamp">Parliamentarian</div>
					<div class="annotation-content">
						<div class="annotation-heading">Procedural Notes</div>
						<div class="annotation-text">{doc.content.parliamentarian_notes}</div>
					</div>
				</div>
			{/if}
		</div>
	{/snippet}
</DocumentView>

<style>
	.motion-letterhead {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-4);
		font-family: 'IM Fell English SC', serif;
	}

	.letterhead-body {
		font-size: var(--text-xs);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	.letterhead-motion-number {
		font-size: var(--text-xs);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
	}

	.motion-meta {
		display: flex;
		justify-content: center;
		gap: var(--space-8);
		margin-top: var(--space-4);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
	}

	.meta-row {
		display: flex;
		gap: var(--space-2);
		color: #5a5a50;
	}

	.meta-label {
		font-weight: 600;
		font-style: italic;
	}

	.meta-value {
		font-variant-numeric: oldstyle-nums;
	}

	/* Motion body */
	.motion-body {
		font-family: 'Libre Baskerville', Georgia, serif;
	}

	.body-section {
		margin-bottom: var(--space-8);
	}

	.body-text {
		font-size: 1.0625rem;
		line-height: 1.75;
		color: #151c1a;
		white-space: pre-wrap;
	}

	.reasoning-section {
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid rgba(45, 90, 79, 0.2);
	}

	.section-heading {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
		margin: 0 0 var(--space-3);
	}

	.section-text {
		font-size: var(--text-base);
		line-height: 1.75;
		color: #3c2f16;
		white-space: pre-wrap;
	}

	/* Official Annotations */
	.clerk-annotation,
	.parliamentarian-annotation {
		margin-top: var(--space-10);
		position: relative;
		border: 2px solid;
		border-radius: 3px;
		padding: var(--space-6);
		background: rgba(255, 255, 255, 0.6);
	}

	.clerk-annotation {
		border-color: #5b8cb8;
		background: rgba(91, 140, 184, 0.05);
	}

	.parliamentarian-annotation {
		border-color: #b86c8b;
		background: rgba(184, 108, 139, 0.05);
	}

	.annotation-stamp {
		position: absolute;
		top: -0.75rem;
		left: var(--space-4);
		padding: 0 var(--space-2);
		background: var(--paper);
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: inherit;
	}

	.clerk-annotation .annotation-stamp {
		color: #1e3a5f;
	}

	.parliamentarian-annotation .annotation-stamp {
		color: #70284a;
	}

	.annotation-heading {
		font-size: var(--text-sm);
		font-weight: 600;
		margin-bottom: var(--space-2);
		color: inherit;
	}

	.clerk-annotation .annotation-heading {
		color: #1e3a5f;
	}

	.parliamentarian-annotation .annotation-heading {
		color: #70284a;
	}

	.annotation-text {
		font-size: var(--text-sm);
		line-height: 1.6;
		white-space: pre-wrap;
		color: #151c1a;
	}

	/* Status variants for motions */
	.status--introduced {
		background: rgba(33, 150, 243, 0.15);
		color: #1565c0;
	}

	.status--deliberation {
		background: rgba(255, 152, 0, 0.15);
		color: #e65100;
	}
</style>
