<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '@bfs/ui/src/Badge.svelte';
	import { Alert, Button, Card, FormField, PageHeader, EmptyState } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreateForm = $state(false);
</script>

<div class="page">
	<PageHeader 
		title="OIDC Clients" 
		description="Manage OpenID Connect clients for satellite applications and third-party integrations." 
	/>

	{#if form?.success && form?.clientSecret}
		<Alert variant="success">
			<p><strong>✅ {form.message}</strong></p>
			<div class="credentials">
				<div class="credential-row">
					<span class="credential-label">Client ID:</span>
					<code class="credential-value">{form.clientId}</code>
				</div>
				<div class="credential-row">
					<span class="credential-label">Client Secret:</span>
					<code class="credential-value">{form.clientSecret}</code>
				</div>
			</div>
			<p class="warning-text">⚠️ Save these credentials now. The client secret cannot be retrieved later.</p>
		</Alert>
	{/if}

	{#if form?.error}
		<Alert variant="danger">
			<p><strong>Error:</strong> {form.error}</p>
		</Alert>
	{/if}

	<Card>
		<h2>Quick Setup</h2>
		<p class="section-description">Create pre-configured clients for BFS satellite applications.</p>
		
		<div class="quick-setup-buttons">
			<form method="POST" action="?/createCommunityBank" use:enhance>
				<Button
					type="submit" 
					disabled={data.hasCommunityBank}
				>
					{data.hasCommunityBank ? '✓ Community Bank' : '+ Community Bank Client'}
				</Button>
			</form>

			<form method="POST" action="?/createMail" use:enhance>
				<Button
					type="submit" 
					disabled={data.hasMail}
				>
					{data.hasMail ? '✓ Mail' : '+ Mail Client'}
				</Button>
			</form>

			<form method="POST" action="?/createMarketplace" use:enhance>
				<Button
					type="submit" 
					disabled={data.hasMarketplace}
				>
					{data.hasMarketplace ? '✓ Marketplace' : '+ Marketplace Client'}
				</Button>
			</form>

			<Button
				variant="secondary"
				onclick={() => showCreateForm = !showCreateForm}
			>
				{showCreateForm ? 'Cancel' : '+ Other OIDC Client'}
			</Button>
		</div>

		{#if showCreateForm}
			<form method="POST" action="?/create" use:enhance class="create-form">
				<FormField label="Client Name" hint="A descriptive name for this application">
					<input 
						type="text" 
						id="name"
						name="name" 
						placeholder="e.g., My Custom App" 
						required 
					/>
				</FormField>

				<FormField label="Redirect URIs" hint="One URI per line. Users will be redirected here after authentication.">
					<textarea 
						id="redirect_uris"
						name="redirect_uris" 
						placeholder="http://localhost:3000/oauth/callback&#10;https://app.example.com/oauth/callback"
						required 
						rows="4"
					></textarea>
				</FormField>

				<Button type="submit">Create Client</Button>
			</form>
		{/if}
	</Card>

	<Card>
		<h2>Registered Clients</h2>

		{#if data.clients.length === 0}
			<EmptyState 
				icon="🔑"
				title="No OIDC clients registered yet"
			/>
		{:else}
			<div class="clients-list">
				{#each data.clients as client}
					<div class="client-card">
						<div class="client-header">
							<div class="client-info">
								<h3 class="client-name">{client.name}</h3>
								<code class="client-id">{client.clientId}</code>
							</div>
							<div class="client-badges">
								{#if client.clientSecretHash}
								<Badge label="Confidential" variant="accent" />
								{:else}
									<Badge label="Public" variant="neutral" />
								{/if}
							</div>
						</div>

						<div class="client-details">
							<div class="detail-row">
								<span class="detail-label">Redirect URIs:</span>
								<ul class="uri-list">
									{#each client.redirectUris as uri}
										<li><code>{uri}</code></li>
									{/each}
								</ul>
							</div>

							<div class="detail-row">
								<span class="detail-label">Created:</span>
								<span class="detail-value">{client.createdAt.slice(0, 10)}</span>
							</div>
						</div>

						<form method="POST" action="?/delete" use:enhance class="delete-form">
							<input type="hidden" name="client_id" value={client.clientId} />
							<button 
								type="submit" 
								class="btn btn--danger btn--sm"
								onclick={(e) => {
									if (!confirm(`Delete client "${client.name}"? This cannot be undone.`)) {
										e.preventDefault();
									}
								}}
							>
								Delete
							</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	<Card>
		<h2>About OIDC Clients</h2>
		<div class="info-content">
			<p>OpenID Connect (OIDC) clients allow satellite applications to authenticate users via this governance server.</p>
			
			<h3>Client Types</h3>
			<ul>
				<li><strong>Confidential:</strong> Has a client secret, suitable for server-side applications</li>
				<li><strong>Public:</strong> No client secret, uses PKCE for security (suitable for SPAs and mobile apps)</li>
			</ul>

			<h3>Configuration</h3>
			<p>After creating a client, configure your application with:</p>
			<ul>
				<li><strong>Issuer URL:</strong> <code>{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}</code></li>
				<li><strong>Client ID:</strong> Provided when you create the client</li>
				<li><strong>Client Secret:</strong> Only for confidential clients, shown once after creation</li>
			</ul>

			<h3>Discovery Endpoint</h3>
			<p>OIDC providers publish their configuration at: <code>/.well-known/openid-configuration</code></p>
		</div>
	</Card>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 900px;
		margin: 0 auto;
	}

	h2 {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-lg);
		font-weight: 400;
		color: var(--ink);
		margin: 0 0 var(--space-3) 0;
	}

	.section-description {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-mid);
		margin-bottom: var(--space-4);
		line-height: 1.6;
	}

	.credentials {
		margin: var(--space-3) 0;
		padding: var(--space-3);
		background: var(--tint-gold-mid);
		border: 1px solid var(--border);
	}

	.credential-row {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		margin-bottom: var(--space-2);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
	}

	.credential-row:last-child {
		margin-bottom: 0;
	}

	.credential-label {
		font-family: 'IM Fell English SC', serif;
		letter-spacing: 0.1em;
		text-transform: lowercase;
		min-width: 120px;
		color: var(--ink-mid);
	}

	.credential-value {
		font-family: 'Courier New', monospace;
		font-size: var(--text-sm);
		background: var(--paper);
		padding: var(--space-1) var(--space-2);
		border: 1px solid var(--border);
		user-select: all;
		color: var(--ink);
	}

	.warning-text {
		margin-top: var(--space-3);
		margin-bottom: 0;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--gold);
	}

	.quick-setup-buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.quick-setup-buttons form {
		display: contents;
	}

	.quick-setup-buttons button {
		width: 100%;
	}

	.quick-setup-buttons button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.create-form {
		padding: var(--space-5);
		background: var(--tint-gold);
		border: 1px solid var(--border);
		margin-top: var(--space-4);
	}

	.clients-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.client-card {
		border: 1px solid var(--border);
		border-left: 3px solid var(--border-strong);
		background: var(--paper);
		padding: var(--space-4);
	}

	.client-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-3);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-faint);
	}

	.client-info {
		flex: 1;
	}

	.client-name {
		margin: 0 0 var(--space-2);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--ink);
	}

	.client-id {
		font-family: 'Courier New', monospace;
		font-size: var(--text-xs);
		color: var(--ink-mid);
		padding: var(--space-1) var(--space-2);
		background: var(--tint-green-mid);
		border: 1px solid var(--border-subtle);
	}

	.client-badges {
		display: flex;
		gap: var(--space-2);
	}

	.client-details {
		margin-bottom: var(--space-4);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
	}

	.detail-row {
		margin-bottom: var(--space-3);
	}

	.detail-row:last-child {
		margin-bottom: 0;
	}

	.detail-label {
		font-family: 'IM Fell English SC', serif;
		letter-spacing: 0.1em;
		text-transform: lowercase;
		color: var(--ink-mid);
		display: block;
		margin-bottom: var(--space-1);
	}

	.detail-value {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink);
	}

	.uri-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.uri-list li {
		margin-bottom: var(--space-1);
	}

	.uri-list code {
		font-family: 'Courier New', monospace;
		font-size: var(--text-xs);
		color: var(--ink-mid);
		padding: var(--space-1) var(--space-2);
		background: var(--tint-green-mid);
		border: 1px solid var(--border-subtle);
		display: inline-block;
	}

	.delete-form {
		border-top: 1px solid var(--border-subtle);
		padding-top: var(--space-3);
		margin-top: var(--space-3);
	}

	.info-content {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-mid);
		line-height: 1.6;
	}

	.info-content h3 {
		margin-top: var(--space-4);
		margin-bottom: var(--space-2);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--ink);
	}

	.info-content ul {
		margin: var(--space-2) 0;
		padding-left: var(--space-5);
	}

	.info-content li {
		margin-bottom: var(--space-2);
	}

	.info-content code {
		font-family: 'Courier New', monospace;
		font-size: var(--text-xs);
		background: var(--tint-green-mid);
		padding: 2px var(--space-2);
		border: 1px solid var(--border-subtle);
		color: var(--ink-mid);
	}
</style>
