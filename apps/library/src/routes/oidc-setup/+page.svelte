<script lang="ts">
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="container">
	<div class="paper stack" style="max-width: 600px; margin: 4rem auto;">
		<h1 class="t-display">OIDC Setup Required</h1>
		<p>{data.appName} needs to be configured to connect to the Governance server.</p>

		{#if form?.success}
			<div style="padding: 1rem; background: var(--tint-green); border: 1px solid var(--accent);">
				<p><strong>✅ {form.message}</strong></p>
				<p>You can now <a href="/">go to the app</a> and sign in.</p>
			</div>
		{/if}

		{#if form?.error}
			<div style="padding: 1rem; background: #fdd; border: 1px solid var(--danger);">
				<strong>Error:</strong> {form.error}
			</div>
		{/if}

		{#if !form?.success}
			<div class="stack">
				<h2>Setup Instructions</h2>
				<ol style="margin-left: 1.5rem;">
					<li>Go to Governance server at <strong>{data.governanceUrl}/settings/oidc-clients</strong></li>
					<li>Click <strong>"+ {data.appName} Client"</strong> button</li>
					<li>Copy the <strong>Client Secret</strong> displayed</li>
					<li>Paste it below and click <strong>Save Configuration</strong></li>
				</ol>
			</div>

			<form method="POST" class="stack">
				<div>
					<label for="governance_url">Governance URL</label>
					<input
						type="url"
						id="governance_url"
						name="governance_url"
						value={data.governanceUrl}
						placeholder="http://localhost:5173"
						required
					/>
					<small style="color: var(--ink-subtle);">The URL where your Governance server is running</small>
				</div>

				<div>
					<label for="client_secret">Client Secret</label>
					<input
						type="password"
						id="client_secret"
						name="client_secret"
						placeholder="Paste secret from Governance server"
						required
					/>
					<small style="color: var(--ink-subtle);">From the OIDC client registration in Governance</small>
				</div>

				<div>
					<p style="color: var(--ink-subtle); font-size: 0.875rem;">
						<strong>Client ID:</strong> {data.clientId}<br/>
						<strong>Redirect URI:</strong> {data.redirectUri}
					</p>
				</div>

				<button type="submit" class="btn btn--primary">Save Configuration</button>
			</form>
		{/if}
	</div>
</div>
