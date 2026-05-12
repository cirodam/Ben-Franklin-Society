<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { entries, offset, limit, hasMore, associations, actingAs } = $derived(data);

	let editingUuid = $state<string | null>(null);
	let editingBody = $state('');

	function startEdit(uuid: string, body: string) {
		editingUuid = uuid;
		editingBody = body;
	}

	// Entry is writeable if the current user has record:write in the entry's association
	// The server already filtered writeableAssociationUuids; we expose actingAs + associations
	// For simplicity, we pass canWrite per-entry via the enriched data
</script>

<div class="page">
	<div class="page-header">
		<h1>The Record</h1>
		<p class="subtitle">The community's permanent, public chronicle of all official acts.</p>
	</div>

	{#if associations.length > 0}
		<div class="card">
			<div class="card__label">Add Entry</div>
			<form method="POST" action="?/add" use:enhance>
				<div class="add-form">
					<select class="select" name="association_uuid" required>
						<option value="">— Select body —</option>
						{#each associations as a}
							<option value={a.uuid}>{a.name}</option>
						{/each}
					</select>
					<textarea class="textarea" name="body" rows="3" placeholder="Record entry…" required></textarea>
					<button type="submit" class="btn btn--primary btn--sm">Add to Record</button>
				</div>
			</form>
		</div>
	{/if}

	{#if entries.length === 0}
		<div class="card">
			<p class="empty">The Record is empty. Actions taken in the app will appear here.</p>
		</div>
	{:else}
		<div class="record-feed">
			{#each entries as e}
				<div class="entry">
					{#if editingUuid === e.uuid}
						<form method="POST" action="?/edit" use:enhance={() => {
							return ({ result, update }) => {
								if (result.type === 'success') editingUuid = null;
								update();
							};
						}}>
							<input type="hidden" name="entry_uuid" value={e.uuid} />
							<textarea class="textarea entry-edit" name="body" rows="3" bind:value={editingBody} required></textarea>
							<div class="entry-edit-actions">
								<button type="submit" class="btn btn--sm btn--primary">Save</button>
								<button type="button" class="btn btn--sm" onclick={() => editingUuid = null}>Cancel</button>
							</div>
						</form>
					{:else}
						<div class="entry__body">{e.body}</div>
					{/if}
					<div class="entry__meta">
						{#if e.association_name}
							<span class="meta-body">{e.association_name}</span>
							<span class="meta-sep">·</span>
						{/if}
						{#if e.recorder}
							<span>recorded by <strong>@{e.recorder.handle}</strong></span>
							<span class="meta-sep">·</span>
						{/if}
						<time>{e.created_at.slice(0, 10)}</time>
						{#if e.edited_at}<span class="meta-sep">·</span><span class="muted">edited {e.edited_at.slice(0, 10)}</span>{/if}
						{#if associations.some(a => a.uuid === e.association_uuid) && editingUuid !== e.uuid}
							<span class="meta-sep">·</span>
							<button class="btn-inline" onclick={() => startEdit(e.uuid, e.body)}>Edit</button>
							<form method="POST" action="?/delete" use:enhance style="display:inline">
								<input type="hidden" name="entry_uuid" value={e.uuid} />
								<button class="btn-inline btn-inline--danger" type="submit">Delete</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<div class="pagination">
			{#if offset > 0}
				<a href="?offset={Math.max(0, offset - limit)}" class="page-btn">← Newer</a>
			{/if}
			{#if hasMore}
				<a href="?offset={offset + limit}" class="page-btn">Older →</a>
			{/if}
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

	.page-header { display: flex; flex-direction: column; gap: var(--space-1); }
	.page-header h1 { margin: 0; }
	.subtitle { margin: 0; color: var(--color-text-muted); font-size: var(--text-sm); }

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
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

	.add-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.select, .textarea {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-family: inherit;
		background: var(--color-bg);
		color: var(--color-text);
	}
	.textarea { resize: vertical; line-height: 1.6; }

	.record-feed {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.entry {
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface, #fff);
	}
	.entry:last-child { border-bottom: none; }

	.entry__body {
		font-size: var(--text-sm);
		line-height: 1.6;
		color: var(--color-text);
		margin-bottom: var(--space-2);
	}

	.entry-edit {
		margin-bottom: var(--space-2);
	}
	.entry-edit-actions {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.entry__meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		flex-wrap: wrap;
	}

	.meta-body {
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}
	.meta-sep { color: var(--color-border); }
	.muted { color: var(--color-text-muted); }

	.btn-inline {
		background: none;
		border: none;
		padding: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		cursor: pointer;
		text-decoration: underline;
	}
	.btn-inline:hover { color: var(--color-text); }
	.btn-inline--danger:hover { color: #991b1b; }

	.pagination {
		display: flex;
		gap: var(--space-3);
		justify-content: center;
	}

	.page-btn {
		padding: var(--space-2) var(--space-4);
		font-size: var(--text-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-surface, #fff);
	}
	.page-btn:hover { background: var(--color-bg, #f9fafb); }

	.empty { margin: 0; color: var(--color-text-muted); font-size: var(--text-sm); }
</style>
