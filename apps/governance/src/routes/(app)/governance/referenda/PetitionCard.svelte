<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@bfs/ui';

	interface Props {
		petition: {
			uuid: string;
			title: string;
			body: string;
			signature_count: number | null;
			is_signed_by?: string | null;
		};
	}

	let { petition }: Props = $props();
</script>

<div class="petition-card">
	<div class="petition-card__header">
		<span class="petition-card__title">{petition.title}</span>
		<span class="badge badge-warning">Open</span>
	</div>
	<p class="petition-card__body">{petition.body}</p>
	<div class="petition-card__footer">
		<span class="petition-card__signatures">
			{petition.signature_count || 0} signatures
		</span>
		{#if petition.is_signed_by}
			<form method="POST" action="?/unsignPetition" use:enhance>
				<input type="hidden" name="petition_uuid" value={petition.uuid} />
				<Button variant="secondary" size="small" type="submit">Unsign</Button>
			</form>
		{:else}
			<form method="POST" action="?/signPetition" use:enhance>
				<input type="hidden" name="petition_uuid" value={petition.uuid} />
				<Button size="small" type="submit">Sign Petition</Button>
			</form>
		{/if}
	</div>
</div>

<style>
	.petition-card {
		padding: var(--space-5);
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.2);
		transition: all 0.2s;
	}

	.petition-card:hover {
		border-color: #d4a24a;
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 4px 8px rgba(0, 0, 0, 0.08);
	}

	.petition-card__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-2);
	}

	.petition-card__title {
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

	.badge-warning {
		background: rgba(212, 162, 74, 0.15);
		color: #7a5c1a;
		border: 1px solid rgba(212, 162, 74, 0.3);
	}

	.petition-card__body {
		font-family: 'Libre Baskerville', Georgia, serif;
		color: #5a5a50;
		line-height: 1.7;
		margin-bottom: var(--space-3);
	}

	.petition-card__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: var(--space-3);
		border-top: 1px solid rgba(45, 90, 79, 0.2);
	}

	.petition-card__signatures {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: #5a5a50;
	}
</style>
