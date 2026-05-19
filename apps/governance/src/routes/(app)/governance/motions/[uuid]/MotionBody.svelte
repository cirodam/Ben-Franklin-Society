<script lang="ts">
	type Motion = {
		body: string;
		reasoning?: string | null;
		clerk_notes?: string | null;
		parliamentarian_notes?: string | null;
	};

	let {
		motion
	}: {
		motion: Motion;
	} = $props();
</script>

<div class="motion-body">
	<div class="body-section">
		<div class="body-text">{motion.body}</div>
	</div>

	{#if motion.reasoning}
		<div class="reasoning-section">
			<h2 class="section-heading">Reasoning</h2>
			<div class="section-text">{motion.reasoning}</div>
		</div>
	{/if}

	{#if motion.clerk_notes}
		<div class="clerk-annotation">
			<div class="annotation-stamp">Clerk</div>
			<div class="annotation-content">
				<div class="annotation-heading">Administrative Notes</div>
				<div class="annotation-text">{motion.clerk_notes}</div>
			</div>
		</div>
	{/if}

	{#if motion.parliamentarian_notes}
		<div class="parliamentarian-annotation">
			<div class="annotation-stamp">Parliamentarian</div>
			<div class="annotation-content">
				<div class="annotation-heading">Procedural Notes</div>
				<div class="annotation-text">{motion.parliamentarian_notes}</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Motion Body Content */
	.motion-body {
		font-family: 'Georgia', serif;
	}

	.body-section {
		margin-bottom: var(--space-8);
	}

	.body-text {
		font-size: 1.0625rem;
		line-height: 1.75;
		color: #151c1a;
		white-space: pre-wrap;
		text-align: justify;
		hyphens: auto;
	}

	.reasoning-section {
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid rgba(45, 90, 79, 0.2);
	}

	.section-heading {
		font-size: var(--text-base);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #7a5c1a;
		margin: 0 0 var(--space-3);
	}

	.section-text {
		font-size: var(--text-base);
		line-height: 1.75;
		color: #3c2f16;
		white-space: pre-wrap;
		text-align: justify;
		hyphens: auto;
	}

	/* Official Annotations */
	.clerk-annotation,
	.parliamentarian-annotation {
		margin-top: var(--space-10);
		position: relative;
		border: 2px solid;
		border-radius: 3px;
		padding: var(--space-6);
		background: rgba(255, 255, 255, 0.9);
	}

	.clerk-annotation {
		border-color: #5b8cb8;
		background-image: 
			linear-gradient(135deg, rgba(91, 140, 184, 0.05) 0%, rgba(91, 140, 184, 0.02) 100%);
	}

	.parliamentarian-annotation {
		border-color: #8b6cb8;
		background-image: 
			linear-gradient(135deg, rgba(139, 108, 184, 0.05) 0%, rgba(139, 108, 184, 0.02) 100%);
	}

	.annotation-stamp {
		position: absolute;
		top: -12px;
		left: var(--space-6);
		font-family: 'Georgia', serif;
		font-size: var(--text-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		padding: var(--space-1) var(--space-4);
		border-radius: 2px;
		border: 2px solid;
		background: #fdfdf8;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.clerk-annotation .annotation-stamp {
		border-color: #5b8cb8;
		color: #1e3a5f;
	}

	.parliamentarian-annotation .annotation-stamp {
		border-color: #8b6cb8;
		color: #4a2870;
	}

	.annotation-heading {
		font-family: 'Georgia', serif;
		font-size: var(--text-sm);
		font-weight: 700;
		font-style: italic;
		margin-bottom: var(--space-3);
	}

	.clerk-annotation .annotation-heading {
		color: #1e3a5f;
	}

	.parliamentarian-annotation .annotation-heading {
		color: #4a2870;
	}

	.annotation-text {
		font-family: 'Georgia', serif;
		font-size: var(--text-sm);
		line-height: 1.7;
		color: #151c1a;
		white-space: pre-wrap;
	}

	.annotation-content {
		position: relative;
		z-index: 1;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.body-text,
		.section-text {
			text-align: left;
		}

		.annotation-stamp {
			position: static;
			display: inline-block;
			margin-bottom: var(--space-2);
		}

		.clerk-annotation,
		.parliamentarian-annotation {
			padding: var(--space-4);
		}
	}
</style>
