<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="setup-wrap">
	<div class="setup-card">
		<div class="setup-header">
			<h1>OIDC Setup Required</h1>
			<p>{data.appName} needs to be configured to connect to the Governance server.</p>
		</div>

		{#if form?.success}
			<div class="alert alert--success">
				<p><strong>✅ {form.message}</strong></p>
				<p>You can now <a href="/">go to the app</a> and sign in.</p>
			</div>
		{/if}

		{#if form?.error}
			<div class="alert alert--error">
				<p><strong>Error:</strong> {form.error}</p>
			</div>
		{/if}

		{#if !form?.success}
			<div class="instructions">
				<h2>Setup Instructions</h2>
				<ol>
					<li>Go to Governance server at <strong>{data.governanceUrl}/settings/oidc-clients</strong></li>
					<li>Click <strong>"+ {data.appName} Client"</strong> button</li>
					<li>Copy the <strong>Client Secret</strong> displayed</li>
					<li>Paste it below and click <strong>Save Configuration</strong></li>
				</ol>
			</div>

			<form method="POST" use:enhance class="setup-form">
				<div class="field">
					<label for="governance_url">Governance URL</label>
					<input 
						type="url" 
						id="governance_url"
						name="governance_url" 
						value={data.governanceUrl}
						placeholder="http://localhost:5173"
						required 
					/>
					<span class="field-hint">The URL where your Governance server is running</span>
				</div>

				<div class="field readonly-field">
				<label for="client_id">Client ID</label>
				<input 
					type="text"
					id="client_id" 
					value={data.clientId}
					readonly 
				/>
				<span class="field-hint">Pre-configured for {data.appName}</span>
			</div>

			<div class="field readonly-field">
				<label for="redirect_uri">Redirect URI</label>
				<input 
					type="text"
					id="redirect_uri" 
					value={data.redirectUri}
				<div class="field">
					<label for="client_secret">Client Secret</label>
					<input 
						type="password" 
						id="client_secret"
						name="client_secret" 
						placeholder="Paste the client secret from Governance"
						required 
						autocomplete="off"
					/>
					<span class="field-hint">Copy this from the Governance OIDC clients page</span>
				</div>

				<button type="submit" class="submit-btn">Save Configuration</button>
			</form>
		{/if}
	</div>
</div>

<style>
	.setup-wrap {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg);
		padding: var(--space-6);
	}

	.setup-card {
		width: 100%;
		max-width: 600px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-8);
		box-shadow: var(--shadow);
	}

	.setup-header {
		margin-bottom: var(--space-6);
	}

	.setup-header h1 {
		font-size: var(--text-xl);
		margin-bottom: var(--space-2);
	}

	.setup-header p {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.alert {
		padding: var(--space-4);
		border-radius: var(--radius);
		margin-bottom: var(--space-4);
		border-left: 4px solid;
	}

	.alert--success {
		background: var(--color-success-subtle);
		border-color: var(--color-success);
		color: var(--color-success-text);
	}

	.alert--error {
		background: var(--color-danger-subtle);
		border-color: var(--color-danger);
		color: var(--color-danger-text);
	}

	.alert p {
		margin-bottom: var(--space-2);
	}

	.alert p:last-child {
		margin-bottom: 0;
	}

	.instructions {
		background: var(--color-bg-secondary);
		border-radius: var(--radius);
		padding: var(--space-4);
		margin-bottom: var(--space-6);
	}

	.instructions h2 {
		font-size: var(--text-base);
		margin-bottom: var(--space-3);
	}

	.instructions ol {
		margin: 0;
		padding-left: var(--space-5);
	}

	.instructions li {
		margin-bottom: var(--space-2);
		font-size: var(--text-sm);
	}

	.instructions li:last-child {
		margin-bottom: 0;
	}

	.setup-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.field label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	.field-hint {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.field input {
		width: 100%;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--color-text);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-2) var(--space-3);
		outline: none;
		transition: border-color 120ms, box-shadow 120ms;
	}

	.field input:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px var(--color-accent-subtle);
	}

	.readonly-field input {
		background: var(--color-bg-secondary);
		color: var(--color-text-muted);
		cursor: not-allowed;
	}

	.submit-btn {
		margin-top: var(--space-2);
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
		color: white;
		background: var(--color-accent);
		border: none;
		border-radius: var(--radius);
		cursor: pointer;
		transition: background 120ms;
	}

	.submit-btn:hover {
		background: var(--color-accent-hover);
	}

	.submit-btn:active {
		transform: translateY(1px);
	}
</style>
