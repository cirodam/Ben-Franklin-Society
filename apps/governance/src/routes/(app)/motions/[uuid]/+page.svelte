<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { motion, introducer, body, tally, voteRules, currentRule, deliberationRules, currentDeliberationRule, deliberationComplete, daysRemainingInDeliberation, comments, canAdvance, canOpenVote, canCloseVote, alreadyVoted, actingAs } = $derived(data);

	let editingCommentUuid = $state<string | null>(null);
	let editingCommentBody = $state('');

	function startEditComment(uuid: string, currentBody: string) {
		editingCommentUuid = uuid;
		editingCommentBody = currentBody;
	}

	const statusVariant: Record<string, string> = {
		draft:        'status--draft',
		introduced:   'status--introduced',
		deliberation: 'status--deliberation',
		vote:         'status--vote',
		enacted:      'status--enacted',
		rejected:     'status--rejected',
		withdrawn:    'status--withdrawn',
	};

	const statusLabel: Record<string, string> = {
		draft:        'Draft',
		introduced:   'Introduced',
		deliberation: 'In Deliberation',
		vote:         'Vote Open',
		enacted:      'Enacted',
		rejected:     'Rejected',
		withdrawn:    'Withdrawn',
	};

	const ayePct = $derived(
		tally && tally.eligible_count > 0
			? Math.round((tally.aye_count / tally.eligible_count) * 100)
			: 0
	);
	const nayPct = $derived(
		tally && tally.eligible_count > 0
			? Math.round((tally.nay_count / tally.eligible_count) * 100)
			: 0
	);
</script>

<div class="page">
	<div class="page-header">
		<a href="/motions" class="back">← Motions</a>
		<div class="header-row">
			<h1>{motion.title}</h1>
			<span class="status-badge {statusVariant[motion.status] ?? ''}">{statusLabel[motion.status] ?? motion.status}</span>
		</div>
		<div class="meta-row">
			<span class="meta-item">
				Introduced by
				{#if introducer}
					<strong>{introducer.given_name} {introducer.family_name}</strong>
					<span class="handle">@{introducer.handle}</span>
				{:else}
					<span class="muted">Unknown</span>
				{/if}
			</span>
			<span class="meta-sep">·</span>
			<span class="meta-item">
				{#if body}
					<a href="/associations/{body.handle}">{body.name}</a>
				{:else}
					Community referendum
				{/if}
			</span>
			<span class="meta-sep">·</span>
			<span class="meta-item muted">{motion.created_at.slice(0, 10)}</span>
		</div>
	</div>

	<div class="card">
		<div class="card__label">Motion Text</div>
		<p class="prose">{motion.body}</p>
	</div>

	{#if motion.reasoning}
		<div class="card card--reasoning">
			<div class="card__label">Why this motion was introduced</div>
			<p class="prose">{motion.reasoning}</p>
		</div>
	{/if}

	{#if tally}
		<div class="card">
			<div class="card__label">
				{tally.closed_at ? `Vote closed ${tally.closed_at.slice(0, 10)}` : 'Vote in progress'}
				{#if currentRule}<span class="rule-badge">{currentRule.name}</span>{/if}
			</div>
			<div class="vote-stats">
				<div class="vote-stat vote-stat--aye">
					<span class="vote-stat__count">{tally.aye_count}</span>
					<span class="vote-stat__label">Aye</span>
				</div>
				<div class="vote-stat vote-stat--nay">
					<span class="vote-stat__count">{tally.nay_count}</span>
					<span class="vote-stat__label">Nay</span>
				</div>
				<div class="vote-stat">
					<span class="vote-stat__count">{tally.abstain_count}</span>
					<span class="vote-stat__label">Abstain</span>
				</div>
				<div class="vote-stat">
					<span class="vote-stat__count">{tally.eligible_count}</span>
					<span class="vote-stat__label">Eligible</span>
				</div>
			</div>
			<div class="vote-bar" title="{ayePct}% aye, {nayPct}% nay">
				<div class="vote-bar__aye" style="width: {ayePct}%"></div>
				<div class="vote-bar__nay" style="width: {nayPct}%"></div>
			</div>
			<p class="vote-caption">
				{tally.aye_count + tally.nay_count + tally.abstain_count} of {tally.eligible_count} eligible members voted
				({ayePct}% aye)
			</p>
		</div>
	{/if}

	{#if !['enacted','rejected','withdrawn'].includes(motion.status)}
		<div class="card">
			<div class="card__label">Actions</div>
			<div class="action-row">
				{#if canAdvance && deliberationRules.length > 0 && !['vote','enacted','rejected','withdrawn'].includes(motion.status)}
					<form method="POST" action="?/setDeliberationRule" use:enhance class="rule-form">
						<select name="deliberation_rule_uuid" class="rule-select">
							<option value="">{currentDeliberationRule ? '— clear rule —' : '— no deliberation rule —'}</option>
							{#each deliberationRules as r}
								<option value={r.uuid} selected={r.uuid === motion.deliberation_rule_uuid}>{r.name}</option>
							{/each}
						</select>
						<button type="submit" class="btn btn--secondary btn--sm">Set Deliberation Rule</button>
					</form>
				{:else if currentDeliberationRule}
					<span class="rule-label">Deliberation rule: <strong>{currentDeliberationRule.name}</strong></span>
					{#if motion.status === 'deliberation' && !deliberationComplete}
						<span class="deliberation-waiting">Vote eligible in {daysRemainingInDeliberation} day(s)</span>
					{/if}
				{/if}
				{#if canAdvance && voteRules.length > 0 && !['vote','enacted','rejected','withdrawn'].includes(motion.status)}
					<form method="POST" action="?/setVoteRule" use:enhance class="rule-form">
						<select name="vote_rule_uuid" class="rule-select">
							<option value="">{currentRule ? '— clear rule —' : '— no vote rule —'}</option>
							{#each voteRules as r}
								<option value={r.uuid} selected={r.uuid === motion.vote_rule_uuid}>{r.name}</option>
							{/each}
						</select>
						<button type="submit" class="btn btn--secondary btn--sm">Set Vote Rule</button>
					</form>
				{:else if currentRule}
					<span class="rule-label">Vote rule: <strong>{currentRule.name}</strong></span>
				{/if}
				{#if motion.status === 'draft' && canAdvance}
					<form method="POST" action="?/advance">
						<input type="hidden" name="to" value="introduced" />
						<button class="btn btn--primary">Introduce</button>
					</form>
				{/if}
				{#if motion.status === 'introduced' && canAdvance}
					<form method="POST" action="?/advance">
						<input type="hidden" name="to" value="deliberation" />
						<button class="btn btn--primary">Begin Deliberation</button>
					</form>
				{/if}
				{#if motion.status === 'deliberation' && canOpenVote}
					<form method="POST" action="?/openVote">
						<button class="btn btn--primary" disabled={!deliberationComplete}>
							{#if deliberationComplete}
								Open Vote
							{:else}
								Open Vote ({daysRemainingInDeliberation} days remaining)
							{/if}
						</button>
					</form>
				{/if}
				{#if motion.status === 'vote'}
					{#if !alreadyVoted}
						<form method="POST" action="?/castVote" class="vote-form">
							<button class="btn btn--aye" name="choice" value="aye">Aye</button>
							<button class="btn btn--nay" name="choice" value="nay">Nay</button>
							<button class="btn btn--abstain" name="choice" value="abstain">Abstain</button>
						</form>
					{:else}
						<span class="vote-recorded">Your vote is recorded.</span>
					{/if}
					{#if canCloseVote}
						<form method="POST" action="?/closeVote">
							<button class="btn btn--secondary">Close Vote</button>
						</form>
					{/if}
				{/if}
				{#if canAdvance}
					<form method="POST" action="?/advance">
						<input type="hidden" name="to" value="withdrawn" />
						<button class="btn btn--danger">Withdraw</button>
					</form>
				{/if}
			</div>
		</div>
	{/if}

	<div class="card">
		<div class="card__label">Discussion ({comments.length})</div>
		{#if comments.length > 0}
			<div class="comments">
				{#each comments as c}
					<div class="comment">
						<div class="comment__header">
							<strong>{c.given_name} {c.family_name}</strong>
							<span class="handle">@{c.handle}</span>
							<span class="muted">{c.created_at.slice(0, 10)}</span>
							{#if c.edited_at}<span class="muted">(edited)</span>{/if}
							{#if c.author_uuid === actingAs}
								<span class="comment__actions">
									<button class="btn-inline" onclick={() => startEditComment(c.uuid, c.body)}>Edit</button>
									<form method="POST" action="?/deleteComment" use:enhance>
										<input type="hidden" name="comment_uuid" value={c.uuid} />
										<button class="btn-inline btn-inline--danger" type="submit">Delete</button>
									</form>
								</span>
							{/if}
						</div>
						{#if editingCommentUuid === c.uuid}
							<form method="POST" action="?/editComment" use:enhance={() => {
								return ({ result, update }) => {
									if (result.type === 'success') editingCommentUuid = null;
									update();
								};
							}}>
								<input type="hidden" name="comment_uuid" value={c.uuid} />
								<textarea class="comment-edit-input" name="body" rows="3" bind:value={editingCommentBody} required></textarea>
								<div class="comment-edit-actions">
									<button type="submit" class="btn btn--sm btn--primary">Save</button>
									<button type="button" class="btn btn--sm" onclick={() => editingCommentUuid = null}>Cancel</button>
								</div>
							</form>
						{:else}
							<p class="comment__body">{c.body}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
		{#if actingAs}
			<form method="POST" action="?/comment" use:enhance>
				<div class="comment-form">
					<textarea class="comment-input" name="body" rows="3" placeholder="Add to the discussion…" required></textarea>
					<button type="submit" class="btn btn--sm btn--primary">Post</button>
				</div>
			</form>
		{/if}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 740px;
		margin: 0 auto;
	}

	.back {
		display: inline-block;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		margin-bottom: var(--space-3);
	}
	.back:hover { color: var(--color-text); }

	.header-row {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		flex-wrap: wrap;
	}
	.header-row h1 { margin: 0; flex: 1; }

	.meta-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
		margin-top: var(--space-2);
		font-size: var(--text-sm);
	}
	.meta-item { color: var(--color-text-muted); }
	.meta-item a { color: var(--color-text); text-decoration: none; }
	.meta-item a:hover { text-decoration: underline; }
	.meta-sep { color: var(--color-border); }
	.handle { color: var(--color-text-muted); font-size: var(--text-xs); margin-left: var(--space-1); }
	.muted { color: var(--color-text-muted); }

	.status-badge {
		flex-shrink: 0;
		display: inline-block;
		font-size: var(--text-xs);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: 1px solid transparent;
		white-space: nowrap;
		margin-top: var(--space-1);
	}
	.status--draft        { background: var(--color-surface); border-color: var(--color-border); color: var(--color-text-muted); }
	.status--introduced   { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
	.status--deliberation { background: #faf5ff; border-color: #c4b5fd; color: #6d28d9; }
	.status--vote         { background: #fef3c7; border-color: #fcd34d; color: #92400e; }
	.status--enacted      { background: #dcfce7; border-color: #86efac; color: #166534; }
	.status--rejected     { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
	.status--withdrawn    { background: var(--color-surface); border-color: var(--color-border); color: var(--color-text-muted); }

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.card--reasoning {
		border-left: 3px solid var(--color-primary, #3b82f6);
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

	/* Actions */
	.action-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: center;
	}
	
	.rule-form {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	
	.rule-select {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg, #fff);
		font-size: var(--text-sm);
	}
	
	.rule-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
	
	.deliberation-waiting {
		font-size: var(--text-xs);
		color: #92400e;
		background: #fef3c7;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		border: 1px solid #fcd34d;
		font-weight: var(--weight-medium);
	}
	
	.vote-form {
		display: flex;
		gap: var(--space-2);
	}
	.vote-recorded {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
	.btn {
		padding: var(--space-2) var(--space-4);
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn--sm {
		padding: var(--space-1) var(--space-3);
		font-size: var(--text-xs);
	}
	.btn--primary   { background: var(--color-primary, #2563eb); color: #fff; }
	.btn--secondary { background: var(--color-bg, #f3f4f6); color: var(--color-text); border: 1px solid var(--color-border); }
	.btn--danger    { background: #fee2e2; color: #991b1b; }
	.btn--aye       { background: #dcfce7; color: #166534; }
	.btn--nay       { background: #fee2e2; color: #991b1b; }
	.btn--abstain   { background: var(--color-bg, #f3f4f6); color: var(--color-text-muted); border: 1px solid var(--color-border); }

	/* Vote */
	.vote-stats {
		display: flex;
		gap: var(--space-6);
	}
	.vote-stat {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.vote-stat__count {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
	}
	.vote-stat__label {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}
	.vote-stat--aye .vote-stat__count { color: #166534; }
	.vote-stat--nay .vote-stat__count { color: #991b1b; }

	.vote-bar {
		height: 6px;
		background: var(--color-border);
		border-radius: var(--radius-full, 9999px);
		overflow: hidden;
		display: flex;
	}
	.vote-bar__aye { background: #86efac; height: 100%; }
	.vote-bar__nay { background: #fca5a5; height: 100%; }

	.vote-caption {
		margin: 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	/* Comments */
	.comments {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.comment {
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-4);
	}
	.comment:first-child { border-top: none; padding-top: 0; }
	.comment__header {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
		font-size: var(--text-sm);
		flex-wrap: wrap;
	}
	.comment__actions {
		margin-left: auto;
		display: flex;
		gap: var(--space-2);
	}
	.comment__body {
		margin: 0;
		font-size: var(--text-sm);
		line-height: 1.7;
	}
	.comment-edit-input, .comment-input {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-family: inherit;
		background: var(--color-bg);
		color: var(--color-text);
		resize: vertical;
		line-height: 1.6;
	}
	.comment-edit-actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}
	.comment-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-4);
		margin-top: var(--space-2);
	}
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

	/* Vote rule */
	.rule-form { display: flex; align-items: center; gap: var(--space-2); }
	.rule-select {
		font-size: var(--text-sm);
		padding: var(--space-1) var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}
	.rule-badge {
		display: inline-block;
		margin-left: var(--space-2);
		font-size: var(--text-xs);
		background: var(--color-surface-raised);
		color: var(--color-text-muted);
		padding: 1px 8px;
		border-radius: 999px;
		font-weight: var(--weight-normal);
	}
	.rule-label { font-size: var(--text-sm); color: var(--color-text-muted); }
	.btn--sm { padding: var(--space-1) var(--space-3); font-size: var(--text-sm); }
</style>
