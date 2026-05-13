<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '@bfs/ui/src/Badge.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreateForm = $state(false);
</script>

<div class="page">
	<header class="page-header">
		<h1>OIDC Clients</h1>
		<p class="subtitle">Manage OpenID Connect clients for satellite applications and third-party integrations.</p>
	</header>

	{#if form?.success && form?.clientSecret}
		<div class="alert alert--success">
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
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert--error">
			<p><strong>Error:</strong> {form.error}</p>
		</div>
	{/if}

	<section class="card">
		<h2>Quick Setup</h2>
		<p class="section-description">Create pre-configured clients for BFS satellite applications.</p>
		
		<div class="quick-setup-buttons">
			<form method="POST" action="?/createCommunityBank" use:enhance>
				<button 
					type="submit" 
					class="btn btn--primary"
					disabled={data.hasCommunityBank}
				>
					{data.hasCommunityBank ? '✓ Community Bank' : '+ Community Bank Client'}
				</button>
			</form>

			<form method="POST" action="?/createMail" use:enhance>
				<button 
					type="submit" 
					class="btn btn--primary"
					disabled={data.hasMail}
				>
					{data.hasMail ? '✓ Mail' : '+ Mail Client'}
				</button>
			</form>

			<form method="POST" action="?/createMarketplace" use:enhance>
				<button 
					type="submit" 
					class="btn btn--primary"
					disabled={data.hasMarketplace}
				>
					{data.hasMarketplace ? '✓ Marketplace' : '+ Marketplace Client'}
				</button>
			</form>

			<button 
				class="btn btn--secondary"
				onclick={() => showCreateForm = !showCreateForm}
			>
				{showCreateForm ? 'Cancel' : '+ Other OIDC Client'}
			</button>
		</div>

		{#if showCreateForm}
			<form method="POST" action="?/create" use:enhance class="create-form">
				<div class="form-group">
					<label for="name">Client Name</label>
					<input 
						type="text" 
						id="name"
						name="name" 
						placeholder="e.g., My Custom App" 
						required 
						class="input"
					/>
					<p class="form-help">A descriptive name for this application</p>
				</div>

				<div class="form-group">
					<label for="redirect_uris">Redirect URIs</label>
					<textarea 
						id="redirect_uris"
						name="redirect_uris" 
						placeholder="http://localhost:3000/oauth/callback&#10;https://app.example.com/oauth/callback"
						required 
						rows="4"
						class="input"
					></textarea>
					<p class="form-help">One URI per line. Users will be redirected here after authentication.</p>
				</div>

				<button type="submit" class="btn btn--primary">Create Client</button>
			</form>
		{/if}
	</section>

	<section class="card">
		<div class="section-header">
			<h2>Registered Clients</h2>
		</div>

		{#if data.clients.length === 0}
			<p class="empty">No OIDC clients registered yet.</p>
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
								<span>{client.createdAt.slice(0, 10)}</span>
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
	</section>

	<section class="card">
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
	</section>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		max-width: 900px;
	}

	.page-header h1 {
		margin: 0 0 var(--space-1);
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		margin: 0;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-5);
	}

	.section-header h2 {
		margin: 0;
		font-size: var(--text-lg);
	}

	.alert {
		padding: var(--space-4);
		border-radius: var(--radius-md);
		border-left: 4px solid;
	}

	.alert--success {
		background: var(--color-success-bg);
		border-color: var(--color-success);
		color: var(--color-success-text);
	}

	.alert--error {
		background: var(--color-error-bg);
		border-color: var(--color-error);
		color: var(--color-error-text);
	}

	.credentials {
		margin: var(--space-3) 0;
		padding: var(--space-3);
		background: rgba(0, 0, 0, 0.05);
		border-radius: var(--radius-sm);
	}

	.credential-row {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		margin-bottom: var(--space-2);
	}

	.credential-row:last-child {
		margin-bottom: 0;
	}

	.credential-label {
		font-weight: 600;
		min-width: 120px;
	}

	.credential-value {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		background: white;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		user-select: all;
	}

	.warning-text {
		margin-top: var(--space-3);
		margin-bottom: 0;
		font-weight: 600;
		font-size: var(--text-sm);
	}

	.section-description {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		margin-bottom: var(--space-4);
	}

	.quick-setup-buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-3);
		margin-bottom: var(--space-5);
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
		background: var(--color-success);
		border-color: var(--color-success);
	}

	.create-form {
		padding: var(--space-5);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-5);
	}

	.form-group {
		margin-bottom: var(--space-4);
	}

	.form-group label {
		display: block;
		font-weight: 600;
		margin-bottom: var(--space-2);
	}

	.form-help {
		margin-top: var(--space-1);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.empty {
		color: var(--color-text-muted);
		font-style: italic;
		padding: var(--space-4);
	}

	.clients-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.client-card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-4);
	}

	.client-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-3);
	}

	.client-info {
		flex: 1;
	}

	.client-name {
		margin: 0 0 var(--space-1);
		font-size: var(--text-base);
		font-weight: 600;
	}

	.client-id {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		padding: var(--space-1) var(--space-2);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-sm);
	}

	.client-badges {
		display: flex;
		gap: var(--space-2);
	}

	.client-details {
		margin-bottom: var(--space-4);
	}

	.detail-row {
		margin-bottom: var(--space-2);
		display: flex;
		gap: var(--space-2);
	}

	.detail-row:last-child {
		margin-bottom: 0;
	}

	.detail-label {
		font-weight: 600;
		min-width: 120px;
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
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.delete-form {
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-3);
		margin-top: var(--space-3);
	}

	.info-content {
		line-height: 1.6;
	}

	.info-content h3 {
		margin-top: var(--space-4);
		margin-bottom: var(--space-2);
		font-size: var(--text-base);
	}

	.info-content ul {
		margin: var(--space-2) 0;
		padding-left: var(--space-5);
	}

	.info-content li {
		margin-bottom: var(--space-1);
	}

	.info-content code {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		background: var(--color-bg-secondary);
		padding: 2px var(--space-1);
		border-radius: var(--radius-sm);
	}
</style>
