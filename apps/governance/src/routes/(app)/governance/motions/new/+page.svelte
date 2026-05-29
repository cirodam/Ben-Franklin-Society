<script lang="ts">
	import type { PageData } from './$types.js';
	import MotionDocumentView from '../../../library/[slug]/views/MotionDocumentView.svelte';

	let { data }: { data: PageData } = $props();

	const { body, draftMotion } = data;
</script>

<svelte:head>
	<style>
		:global(.app-shell__main) {
			background: linear-gradient(135deg, #e8e4d9 0%, #d4cfc0 100%) !important;
		}
		:global(.app-shell__content) {
			padding: 0 !important;
		}
		html {
			scroll-behavior: smooth;
		}
	</style>
</svelte:head>

<div class="document-page">
	<div class="document-controls">
		<a href="/governance/{body.handle === 'general-assembly' ? 'general-assembly' : `bodies/${body.uuid}`}" class="back">
			← Back to {body.name}
		</a>
		
		<div class="page-info">
			<h2 class="page-title">Create New Motion</h2>
		</div>
	</div>

	<div class="document-wrapper">
		<MotionDocumentView 
			document={draftMotion} 
			canEdit={true}
			isCreating={true}
		/>
	</div>
</div>

<style>
	.document-page {
		min-height: 100vh;
		padding: var(--space-8, 2rem);
		display: flex;
		flex-direction: column;
		gap: var(--space-6, 1.5rem);
	}

	.document-wrapper {
		display: flex;
		justify-content: center;
	}

	.document-controls {
		max-width: 1000px;
		margin: 0 auto var(--space-6);
		display: flex;
		align-items: center;
		gap: var(--space-6);
		padding: 0 var(--space-4);
		flex-wrap: wrap;
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		color: var(--ink-mid);
		text-decoration: none;
		background: transparent;
		border: 1px solid var(--border);
		transition: all 0.2s;
	}

	.back:hover {
		background: var(--paper);
		color: var(--ink);
		border-color: var(--gold-hover);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.page-info {
		flex: 1;
	}

	.page-title {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: var(--ink);
		margin: 0;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
</style>
