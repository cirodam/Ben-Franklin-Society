<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Input } from '@bfs/ui';
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
			<Alert variant="success">
				<p><strong>✅ {form.message}</strong></p>
				<p>You can now <a href="/">go to the app</a> and sign in.</p>
			</Alert>
		{/if}

		{#if form?.error}
			<Alert variant="danger">
				<strong>Error:</strong> {form.error}
			</Alert>
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
				<Input
					type="url"
					id="governance_url"
					name="governance_url"
					label="Governance URL"
					value={data.governanceUrl}
					placeholder="http://localhost:5173"
					hint="The URL where your Governance server is running"
					required
				/>

				<Input
					type="text"
					id="client_id"
					label="Client ID"
					value={data.clientId}
					hint="Pre-configured for {data.appName}"
					readonly
				/>

				<Input
					type="text"
					id="redirect_uri"
					label="Redirect URI"
					value={data.redirectUri}
					hint="The callback URL configured for this app"
					readonly
				/>

				<Input
					type="password"
					id="client_secret"
					name="client_secret"
					label="Client Secret"
					placeholder="Paste the client secret from Governance"
					hint="Copy this from the Governance OIDC clients page"
					autocomplete="off"
					required
				/>

				<Button type="submit" variant="primary" class="submit-btn">Save Configuration</Button>
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
</style>
