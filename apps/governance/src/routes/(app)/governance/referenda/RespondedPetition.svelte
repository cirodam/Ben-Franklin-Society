<script lang="ts">
	interface Props {
		petition: {
			title: string;
			responded_at: string | null;
			created_at: string;
			response_body: string | null;
		};
		formatDate: (isoString: string) => string;
	}

	let { petition, formatDate }: Props = $props();
</script>

<div class="responded-petition">
	<div class="responded-petition__header">
		<span class="responded-petition__title">{petition.title}</span>
		<span class="badge badge-success">Responded</span>
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
</div>

<style>
	.responded-petition {
		padding: var(--space-5);
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		transition: all 0.2s;
	}

	.responded-petition:hover {
		border-color: #d4a24a;
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
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-lg);
		font-weight: 600;
		color: #151c1a;
	}

	.badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: var(--text-xs);
		font-weight: 400;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		border-radius: 2px;
		margin-left: var(--space-2);
	}

	.badge-success {
		background: rgba(90, 115, 90, 0.15);
		color: #3a5a3a;
		border: 1px solid rgba(90, 115, 90, 0.3);
	}

	.responded-petition__meta {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #5a5a50;
		font-variant-numeric: oldstyle-nums;
	}

	.responded-petition__response {
		margin-top: var(--space-3);
		padding: var(--space-4);
		background: rgba(45, 90, 79, 0.05);
		border-left: 3px solid #7a5c1a;
		font-family: 'Libre Baskerville', Georgia, serif;
		line-height: 1.7;
	}

	.responded-petition__response strong {
		font-family: 'IM Fell English', Georgia, serif;
		color: #151c1a;
		display: block;
		margin-bottom: var(--space-2);
	}

	.responded-petition__response p {
		margin: 0;
		color: #5a5a50;
	}
</style>
