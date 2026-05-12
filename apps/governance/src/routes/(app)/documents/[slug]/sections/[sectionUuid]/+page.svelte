<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { doc, article, section, history, canEdit } = $derived(data);

	let editing = $state(false);
	let editTitle     = $state('');
	let editProse     = $state('');
	let editRationale = $state('');

	function startEdit() {
		editTitle     = section.title;
		editProse     = section.prose;
		editRationale = section.rationale;
		editing = true;
	}
</script>

<div class="page">
	<div class="breadcrumb">
		<a href="/documents">Documents</a>
		<span class="sep">›</span>
		<a href="/documents/{doc.slug}">{doc.title}</a>
		<span class="sep">›</span>
		<span>Article {article.number}, §{section.number}</span>
	</div>

	<div class="section-meta">
		<span class="article-label">Article {article.number} — {article.title}</span>
		<span class="section-ref">§{section.number}</span>
		{#if section.version > 1}
			<span class="version-badge">v{section.version}</span>
		{/if}
		{#if canEdit && !editing}
			<button class="btn btn--sm" onclick={startEdit}>Edit</button>
		{/if}
	</div>

	{#if section.title && !editing}
		<h1>{section.title}</h1>
	{/if}

	{#if editing}
		<form method="POST" action="?/edit" use:enhance={() => {
			return ({ result, update }) => {
				if (result.type === 'success') editing = false;
				update();
			};
		}}>
			<div class="card">
				<div class="card__label">Edit Section</div>
				<label class="field">
					<span class="field__label">Title <span class="muted">(optional)</span></span>
					<input class="input" name="title" bind:value={editTitle} />
				</label>
				<label class="field">
					<span class="field__label">Text</span>
					<textarea class="textarea" name="prose" rows="10" bind:value={editProse} required></textarea>
				</label>
				<label class="field">
					<span class="field__label">Rationale <span class="muted">(optional)</span></span>
					<textarea class="textarea" name="rationale" rows="4" bind:value={editRationale}></textarea>
				</label>
				<div class="form-actions">
					<button type="submit" class="btn btn--primary">Save</button>
					<button type="button" class="btn" onclick={() => editing = false}>Cancel</button>
				</div>
			</div>
		</form>
	{:else}
		<div class="card">
			<div class="card__label">Text</div>
			<p class="prose">{section.prose}</p>
		</div>

		{#if section.rationale}
			<div class="card">
				<div class="card__label">Rationale</div>
				<p class="prose prose--muted">{section.rationale}</p>
			</div>
		{/if}

		{#if section.amended_by_motion_uuid}
			<div class="card">
				<div class="card__label">Last Amended By</div>
				<a href="/motions/{section.amended_by_motion_uuid}" class="motion-link">View motion →</a>
			</div>
		{/if}
	{/if}

	{#if history.length > 0}
		<div class="card">
			<div class="card__label">Revision History</div>
			<div class="history">
				{#each history as h}
					<div class="history-item">
						<div class="history-item__header">
							<span class="history-item__version">Version {h.version}</span>
							<span class="history-item__date">{h.recorded_at.slice(0, 10)}</span>
							{#if h.amended_by_motion_uuid}
								<a href="/motions/{h.amended_by_motion_uuid}" class="history-item__motion">Motion →</a>
							{/if}
						</div>
						<p class="history-item__prose">{h.prose}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 740px;
		margin: 0 auto;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
	.breadcrumb a {
		color: var(--color-text-muted);
		text-decoration: none;
	}
	.breadcrumb a:hover { color: var(--color-text); }
	.sep { opacity: 0.4; }

	.section-meta {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}
	.article-label {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		font-weight: var(--weight-medium);
	}
	.section-ref {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
	.version-badge {
		font-size: var(--text-xs);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		color: var(--color-text-muted);
	}

	h1 { margin: 0; }

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.card__label {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		font-weight: var(--weight-medium);
	}

	.prose {
		margin: 0;
		font-size: var(--text-base);
		line-height: 1.8;
	}
	.prose--muted {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.field__label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}
	.muted { color: var(--color-text-muted); font-weight: normal; }
	.input, .textarea {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-family: inherit;
		background: var(--color-bg);
		color: var(--color-text);
		width: 100%;
		box-sizing: border-box;
	}
	.textarea { resize: vertical; line-height: 1.6; }
	.form-actions {
		display: flex;
		gap: var(--space-2);
	}

	.motion-link {
		font-size: var(--text-sm);
		color: var(--color-text);
		text-decoration: none;
	}
	.motion-link:hover { text-decoration: underline; }

	.history {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}
	.history-item {
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-4);
	}
	.history-item:first-child { border-top: none; padding-top: 0; }
	.history-item__header {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
	}
	.history-item__version {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
	}
	.history-item__date {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		flex: 1;
	}
	.history-item__motion {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-decoration: none;
	}
	.history-item__motion:hover { color: var(--color-text); }
	.history-item__prose {
		margin: 0;
		font-size: var(--text-sm);
		line-height: 1.7;
		color: var(--color-text-muted);
	}
</style>
