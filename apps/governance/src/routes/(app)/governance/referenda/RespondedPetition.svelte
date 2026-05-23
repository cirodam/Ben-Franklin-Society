<script lang="ts">
	import { Badge } from '@bfs/ui';

	interface Props {
		petition: {
			uuid: string;
			title: string;
			responded_at: string | null;
			created_at: string;
			response_body: string | null;
		};
		formatDate: (isoString: string) => string;
	}

	let { petition, formatDate }: Props = $props();
</script>

<a href="/governance/petitions/{petition.uuid}" class="responded-petition">
	<div class="responded-petition__header">
		<span class="responded-petition__title">{petition.title}</span>
		<Badge label="Responded" variant="success" />
	</div>
	<span class="responded-petition__meta">
		{formatDate(petition.responded_at || petition.created_at)}
	</span>
	{#if petition.response_body}
		<div class="responded-petition__response">
			<strong>Assembly Response:</strong>
			<p>{petition.response_body}</p>
		</div>
	{/if}
</a>

<style>
	.responded-petition {
		display: block;
		padding: var(--space-5);
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		transition: all 0.2s;
		text-decoration: none;
		color: inherit;
	}

	.responded-petition:hover {
		border-color: var(--gold);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 4px 8px rgba(0, 0, 0, 0.08);
	}

	.responded-petition__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-2);
	}

	.responded-petition__title {
		font-family: var(--font-prose);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--ink);
	}

	.responded-petition__meta {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
		font-variant-numeric: oldstyle-nums;
	}

	.responded-petition__response {
		margin-top: var(--space-3);
		padding: var(--space-4);
		background: var(--tint-green);
		border-left: 3px solid var(--gold);
		font-family: var(--font-prose);
		line-height: 1.7;
	}

	.responded-petition__response strong {
		font-family: var(--font-display);
		color: var(--ink);
		display: block;
		margin-bottom: var(--space-2);
	}

	.responded-petition__response p {
		margin: 0;
		color: var(--ink-mid);
	}
</style>
