<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Badge from '@bfs/ui/src/Badge.svelte';
	import DataTable from '@bfs/ui/src/DataTable.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showForm = $state(false);

	$effect(() => {
		if (form && 'created' in form && form.created) {
			goto(`/motions/${form.created}`);
		}
	});

	const columns = [
		{ key: 'title' as const,      label: 'Title' },
		{ key: 'body_name' as const,  label: 'Body',     width: '160px' },
		{ key: 'status' as const,     label: 'Status',   width: '130px' },
		{ key: 'created_at' as const, label: 'Created',  width: '130px' },
		{ key: 'resolved_at' as const, label: 'Resolved', width: '130px' },
	];

	const statusVariant = (s: string) =>
		s === 'enacted'     ? 'success'
		: s === 'rejected'  ? 'danger'
		: s === 'withdrawn' ? 'neutral'
		: s === 'vote'      ? 'warn'
		: 'accent';
</script>

<div class="page">
	<div class="page-header">
		<h1>Motions</h1>
		<button class="btn btn--primary" onclick={() => (showForm = !showForm)}>
			{showForm ? 'Cancel' : 'New Motion'}
		</button>
	</div>

	{#if showForm}
		<section class="card new-motion-card">
			<h2>Draft a Motion</h2>
			<form method="POST" action="?/create" use:enhance class="motion-form">
				<div class="field">
					<label for="title">Title</label>
					<input id="title" name="title" type="text" required class="input" placeholder="Brief, descriptive title" />
				</div>

				<div class="field">
					<label for="body">Motion Text</label>
					<textarea id="body" name="body" required class="textarea" rows="6" placeholder="The full text of the motion…"></textarea>
				</div>

				<div class="field">
					<label for="reasoning">Reasoning <span class="optional">(optional)</span></label>
					<textarea id="reasoning" name="reasoning" class="textarea" rows="3" placeholder="Why this motion should be adopted…"></textarea>
				</div>

				<div class="field">
					<label for="body_uuid">Propose to</label>
					<select id="body_uuid" name="body_uuid" class="select">
					{#if data.community}
						<option value={data.community.uuid}>The Community (society-wide)</option>
					{/if}
					{#each data.associations.filter((a) => a.type !== 'society') as assoc}
							<option value={assoc.uuid}>{assoc.name}</option>
						{/each}
					</select>
				</div>

				{#if form && 'message' in form && form.message}
					<p class="error">{form.message}</p>
				{/if}

				<div class="form-actions">
					<button type="submit" class="btn btn--primary">Save Draft</button>
					<button type="button" class="btn btn--secondary" onclick={() => (showForm = false)}>Cancel</button>
				</div>
			</form>
		</section>
	{/if}

	<DataTable {columns} rows={data.motions} rowKey="uuid" empty="No motions yet.">
		{#snippet row(m)}
			<tr>
				<td class="title-cell"><a href="/motions/{m.uuid}">{m.title}</a></td>
				<td>{m.body_name ?? 'Community'}</td>
				<td><Badge label={m.status} variant={statusVariant(m.status)} /></td>
				<td>{m.created_at.slice(0, 10)}</td>
				<td>{m.resolved_at ? m.resolved_at.slice(0, 10) : '—'}</td>
			</tr>
		{/snippet}
	</DataTable>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.page-header h1 { margin: 0; }

	:global(.title-cell) {
		max-width: 400px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* New motion form */
	.new-motion-card h2 { margin: 0 0 var(--space-5); }
	.motion-form { display: flex; flex-direction: column; gap: var(--space-4); }
	.field { display: flex; flex-direction: column; gap: var(--space-1); }
	.field label { font-size: var(--text-sm); font-weight: var(--weight-medium); }
	.optional { font-weight: var(--weight-normal); color: var(--color-text-muted); }
	.input, .textarea, .select {
		font-size: var(--text-sm);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		width: 100%;
		box-sizing: border-box;
	}
	.textarea { resize: vertical; font-family: inherit; line-height: 1.5; }
	.form-actions { display: flex; gap: var(--space-3); }
	.error { color: #dc2626; font-size: var(--text-sm); margin: 0; }
</style>
