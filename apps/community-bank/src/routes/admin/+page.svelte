<script lang="ts">
	import { PageHeader, Card, Button, Input, EmptyState } from '@bfs/ui';
	import ContextBadge from '$lib/components/ContextBadge.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const { q, accounts, session } = $derived(data);

	function fmt(n: number) { return n.toLocaleString(); }
</script>

<div class="page">
	<div class="page-header-with-badge">
		<PageHeader title="Bank Administration" />
		{#if session}
			<ContextBadge 
				actingAsUuid={session.acting_as_uuid}
				personUuid={session.person_uuid}
				isAdmin={true}
			/>
		{/if}
	</div>

	<form method="GET" action="/admin" class="search-form">
		<Input
			name="q"
			type="text"
			placeholder="Search by handle or account name…"
			value={q}
			class="search-input"
		/>
		<Button type="submit" variant="primary">Search</Button>
		{#if q}<Button href="/admin" variant="ghost">Clear</Button>{/if}
	</form>

	<Card class="table-card">
		<div class="card__label">
			{#if q}Results for "{q}"{:else}All Accounts{/if}
			— {accounts.length} shown
		</div>
		{#if accounts.length === 0}
			<EmptyState title="No accounts found." />
		{:else}
			<table class="table">
				<thead>
					<tr>
						<th>Handle</th>
						<th>Account Name</th>
						<th class="num">Balance (ƒ)</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each accounts as acct}
						<tr class={acct.status === 'frozen' ? 'row--frozen' : ''}>
							<td class="mono">@{acct.handle_cache}</td>
							<td>{acct.name}</td>
							<td class="num {acct.balance < 0 ? 'negative' : ''}">{fmt(acct.balance)}</td>
							<td>
								{#if acct.status === 'frozen'}
									<span class="badge badge--frozen">Frozen</span>
								{:else}
									<span class="badge badge--active">Active</span>
								{/if}
							</td>
							<td>
								<a href="/admin/accounts/{acct.uuid}" class="link">View →</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</Card>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: var(--space-5); }
	
	.page-header-with-badge {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.search-form { display: flex; gap: var(--space-3); max-width: 520px; align-items: flex-start; }
	:global(.search-input) { flex: 1; }

	.table-card { overflow-x: auto; }
	.table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
	.table th { text-align: left; padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
	.table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-faint); vertical-align: middle; }
	.table tr:last-child td { border-bottom: none; }
	.row--frozen td { background: var(--color-warn-subtle, #fff8e1); }

	.mono { font-family: var(--font-mono); font-size: var(--text-xs); }
	.num { text-align: right; font-variant-numeric: tabular-nums; font-family: var(--font-mono); }
	.negative { color: var(--color-danger); }

	.badge { font-size: var(--text-xs); padding: 2px var(--space-2); border-radius: var(--radius); font-weight: var(--weight-medium); }
	.badge--active { background: var(--color-success-subtle, #e6f4ea); color: var(--color-success); }
	.badge--frozen { background: var(--color-warn-subtle, #fff8e1); color: var(--color-warn); }

	.link { font-size: var(--text-sm); color: var(--color-accent); text-decoration: none; }
	.link:hover { text-decoration: underline; }
</style>
