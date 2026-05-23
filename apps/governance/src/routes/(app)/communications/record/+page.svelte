<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Card, EmptyState, PageHeader, Select, Textarea } from '@bfs/ui';
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
	<PageHeader 
		title="The Record"
		description="The community's permanent, public chronicle of all official acts."
	/>

	{#if associations.length > 0}
		<Card>
			<div class="card__label">Add Entry</div>
			<form method="POST" action="?/add" use:enhance>
				<div class="add-form">
					<Select name="association_uuid" required>
						<option value="">— Select body —</option>
						{#each associations as a}
							<option value={a.uuid}>{a.name}</option>
						{/each}
					</Select>
					<Textarea name="body" rows={3} placeholder="Record entry…" required />
					<Button type="submit" size="sm">Add to Record</Button>
				</div>
			</form>
		</Card>
	{/if}

	{#if entries.length === 0}
		<EmptyState 
			title="The Record is empty"
			description="Actions taken in the app will appear here."
		/>
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
							<Textarea name="body" rows={3} bind:value={editingBody} required />
							<div class="entry-edit-actions">
							<Button type="submit" size="sm">Save</Button>
							<Button type="button" variant="secondary" size="sm" onclick={() => editingUuid = null}>Cancel</Button>
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
		max-width: 1000px;
		margin: 0 auto;
	}

	.page :global(.page-header h1) {
		font-family: var(--font-display);
		font-size: var(--text-4xl);
		font-weight: 400;
		line-height: 1.2;
		color: #151c1a !important;
	}

	.card__label {
		font-family: var(--font-label);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #7a5c1a;
		font-weight: 400;
	}

	.add-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.textarea { resize: vertical; line-height: 1.6; }

	.record-feed {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid var(--color-border);
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
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-surface, #fff);
	}
	.page-btn:hover { background: var(--color-bg, #f9fafb); }
</style>
