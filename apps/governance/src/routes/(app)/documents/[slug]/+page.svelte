<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { tree } = $derived(data);

	const today = new Date().toISOString().slice(0, 10);
	const isSunset = $derived(tree.sunsets_at !== null && tree.sunsets_at <= today);

	const statusVariant: Record<string, string> = {
		draft:    'status--draft',
		proposed: 'status--proposed',
		adopted:  'status--adopted',
		repealed: 'status--repealed',
	};
</script>

<div class="page">
	<div class="page-header">
		<a href="/documents" class="back">← Documents</a>
		<h1>{tree.title}</h1>
		<div class="meta-row">
			<span class="type-badge">{tree.type}</span>
			<span class="status-badge {statusVariant[tree.status] ?? ''}">{tree.status}</span>
			{#if tree.adopted_at}
				<span class="meta-item">Adopted {tree.adopted_at.slice(0, 10)}</span>
			{/if}
			{#if tree.repealed_at}
				<span class="meta-item meta-item--warn">Repealed {tree.repealed_at.slice(0, 10)}</span>
			{/if}
			{#if tree.sunsets_at}
				<span class="meta-item" class:meta-item--warn={isSunset}>
					{isSunset ? 'Sunset' : 'Sunsets'} {tree.sunsets_at}
				</span>
			{/if}
		</div>
	</div>

	{#if tree.type === 'regulation'}
		<div class="document">
			{#each tree.articles as article}
				<div class="article">
					<h2 class="article__heading">
						<span class="article__number">Article {article.number}</span>
						{article.title}
					</h2>
					<div class="sections">
						{#each article.sections as section}
							<a class="section" href="/documents/{tree.slug}/sections/{section.uuid}">
								<div class="section__header">
									<span class="section__number">§{section.number}</span>
									{#if section.title}
										<span class="section__title">{section.title}</span>
									{/if}
									<span class="section__arrow">→</span>
								</div>
								<p class="section__prose">{section.prose}</p>
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="simple-document">
			<div class="body-content">
				{@html tree.body?.replace(/\n/g, '<br>') ?? '<em>No content</em>'}
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

	.back {
		display: inline-block;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		margin-bottom: var(--space-2);
	}
	.back:hover { color: var(--color-text); }

	.page-header h1 { margin: 0 0 var(--space-3); }

	.meta-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.type-badge {
		display: inline-block;
		font-size: var(--text-xs);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-weight: var(--weight-medium);
		text-transform: capitalize;
		background: var(--color-accent-subtle);
		color: var(--color-accent);
		border: 1px solid var(--color-accent);
	}

	.status-badge {
		display: inline-block;
		font-size: var(--text-xs);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: 1px solid transparent;
	}
	.status--draft    { background: var(--color-surface); border-color: var(--color-border); color: var(--color-text-muted); }
	.status--proposed { background: #fef3c7; border-color: #fcd34d; color: #92400e; }
	.status--adopted  { background: #dcfce7; border-color: #86efac; color: #166534; }
	.status--repealed { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }

	.meta-item {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
	.meta-item--warn { color: #b45309; }

	.document {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
	}

	.article__heading {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.article__number {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-muted);
		font-weight: var(--weight-medium);
	}

	.sections {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.section {
		display: block;
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--color-border);
		text-decoration: none;
		color: inherit;
		transition: background 0.1s;
	}
	.section:last-child { border-bottom: none; }
	.section:hover { background: var(--color-surface); }
	.section:hover .section__arrow { opacity: 1; }

	.section__header {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
	}
	.section__number {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-weight: var(--weight-medium);
		flex-shrink: 0;
	}
	.section__title {
		font-weight: var(--weight-semibold);
		font-size: var(--text-sm);
		flex: 1;
	}
	.section__arrow {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		opacity: 0;
		transition: opacity 0.1s;
	}

	.section__prose {
		margin: 0;
		font-size: var(--text-sm);
		line-height: 1.7;
		color: var(--color-text-muted);
	}

	.simple-document {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}

	.body-content {
		font-size: var(--text-base);
		line-height: 1.8;
		color: var(--color-text);
	}
</style>
