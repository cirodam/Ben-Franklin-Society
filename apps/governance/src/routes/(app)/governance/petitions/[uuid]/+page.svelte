<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Card, Badge } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const { petition, signatureCount, signatures, isSigned, creator } = $derived(data);

	function formatDate(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleDateString('en-US', { 
			month: 'long', 
			day: 'numeric', 
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function formatShortDate(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<div class="page">
	<div class="page-header">
		<a href="/governance/referenda" class="back-link">← Back to Petitions</a>
	</div>

	<header class="header">
		<div class="header-top">
			<h1 class="page-title">{petition.title}</h1>
			{#if petition.status === 'open'}
				<Badge label="Open" variant="warn" />
			{:else if petition.status === 'responded'}
				<Badge label="Responded" variant="success" />
			{:else if petition.status === 'withdrawn'}
				<Badge label="Withdrawn" variant="neutral" />
			{/if}
		</div>
		<div class="header-meta">
			{#if creator}
				<span class="meta-item">
					Created by <strong>{creator.given_name} {creator.family_name}</strong> (@{creator.handle})
				</span>
			{/if}
			<span class="meta-item">
				{formatShortDate(petition.created_at)}
			</span>
			<span class="meta-item signature-count">
				<strong>{signatureCount}</strong> {signatureCount === 1 ? 'signature' : 'signatures'}
			</span>
		</div>
	</header>

	<Card>
		<div class="petition-body">
			<p>{petition.body}</p>
		</div>

		{#if petition.status === 'responded' && petition.response_body}
			<div class="response-section">
				<h3 class="response-title">Assembly Response</h3>
				<div class="response-body">
					<p>{petition.response_body}</p>
				</div>
				{#if petition.responded_at}
					<p class="response-date">
						Responded on {formatShortDate(petition.responded_at)}
					</p>
				{/if}
			</div>
		{/if}

		{#if petition.status === 'open'}
			<div class="actions">
				{#if isSigned}
					<form method="POST" action="?/unsign" use:enhance>
						<Button variant="secondary" type="submit">Unsign Petition</Button>
					</form>
					<p class="action-hint">You have signed this petition</p>
				{:else}
					<form method="POST" action="?/sign" use:enhance>
						<Button type="submit">Sign This Petition</Button>
					</form>
					<p class="action-hint">Add your signature to support this petition</p>
				{/if}
			</div>
		{/if}
	</Card>

	{#if signatures.length > 0}
		<section class="signatures-section">
			<h2 class="section-title">Signatures</h2>
			<div class="signatures-list">
				{#each signatures as sig}
					<div class="signature-item">
						<div class="signature-person">
							<span class="signature-name">{sig.given_name} {sig.family_name}</span>
							<span class="signature-handle">@{sig.person_handle}</span>
						</div>
						<span class="signature-date">{formatShortDate(sig.signed_at)}</span>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.page {
		max-width: 60rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
	}

	.page-header {
		margin-bottom: var(--space-4);
	}

	.back-link {
		font-family: var(--font-label);
		font-size: var(--text-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink-mid);
		text-decoration: none;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: var(--gold);
	}

	.header {
		margin-bottom: var(--space-8);
	}

	.header-top {
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.page-title {
		font-family: var(--font-prose);
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 600;
		color: var(--ink);
		margin: 0;
		line-height: 1.3;
		flex: 1;
	}

	.header-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.meta-item strong {
		color: var(--ink);
		font-weight: 600;
	}

	.signature-count {
		padding-left: var(--space-4);
		border-left: 1px solid rgba(45, 90, 79, 0.2);
		font-variant-numeric: oldstyle-nums;
	}

	.petition-body {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		line-height: 1.8;
		color: var(--ink);
		margin-bottom: var(--space-6);
	}

	.petition-body p {
		margin: 0 0 var(--space-4);
	}

	.response-section {
		margin-top: var(--space-6);
		padding: var(--space-5);
		background: var(--tint-green);
		border-left: 3px solid var(--gold);
	}

	.response-title {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 400;
		color: var(--ink);
		margin: 0 0 var(--space-3);
	}

	.response-body {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		line-height: 1.8;
		color: var(--ink);
		margin-bottom: var(--space-3);
	}

	.response-body p {
		margin: 0;
	}

	.response-date {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
		font-style: italic;
		margin: 0;
		font-variant-numeric: oldstyle-nums;
	}

	.actions {
		padding-top: var(--space-6);
		border-top: 1px solid rgba(45, 90, 79, 0.15);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
	}

	.action-hint {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
		font-style: italic;
		margin: 0;
	}

	.signatures-section {
		margin-top: var(--space-8);
	}

	.section-title {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: 400;
		color: var(--ink);
		margin-bottom: var(--space-4);
	}

	.signatures-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.signature-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-3);
		background: var(--paper);
		border: 1px solid rgba(45, 90, 79, 0.15);
		transition: border-color 0.2s;
	}

	.signature-item:hover {
		border-color: rgba(45, 90, 79, 0.3);
	}

	.signature-person {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.signature-name {
		font-family: var(--font-prose);
		font-size: var(--text-base);
		color: var(--ink);
		font-weight: 500;
	}

	.signature-handle {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--ink-mid);
	}

	.signature-date {
		font-family: var(--font-prose);
		font-size: var(--text-sm);
		color: var(--ink-mid);
		font-variant-numeric: oldstyle-nums;
	}
</style>
