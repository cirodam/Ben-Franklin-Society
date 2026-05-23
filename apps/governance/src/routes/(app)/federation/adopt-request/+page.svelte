<script lang="ts">
	import { Alert, Button, Card, Input, PageHeader, Textarea } from '@bfs/ui';
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
</script>

<div class="page">
	<PageHeader 
		title="Request Adoption" 
		description="Request to be adopted by a parent society"
	/>

	{#if !data.canRequest}
		<Alert variant="warning" title="Cannot Request Adoption">
			{data.reason}
		</Alert>
	{:else}
		<Card>
			<div class="adoption-request-form">
				<div class="info-section">
					<h3>About Adoption</h3>
					<p>
						Adoption allows your society to join the BFS network by becoming a child of an 
						existing society. Once adopted, you'll have a cryptographic founding record signed 
						by your parent.
					</p>
					<ul>
						<li>Your parent society must approve the request</li>
						<li>Each parent can have a maximum of 5 children</li>
						<li>You can only have one parent</li>
						<li>Adoption creates a permanent cryptographic record</li>
					</ul>
				</div>

				{#if form?.error}
					<Alert variant="danger" title="Request Failed">
						{form.error}
					</Alert>
				{/if}

				<form method="POST" use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}>
					<div class="form-group">
						<Input
							label="Parent Society URL"
							name="parent_url"
							type="url"
							placeholder="https://philadelphia.bfs or https://bfsphiladelphia.org"
							required
							hint="The full URL of the society you want to adopt you"
						/>
					</div>

					<div class="form-group">
						<Textarea
							label="Message (Optional)"
							name="message"
							placeholder="Introduce your society and explain why you'd like to be adopted..."
							rows={4}
							hint="This message will be sent to the parent society with your request"
						/>
					</div>

					<div class="your-info">
						<h4>Your Information</h4>
						<dl>
							<dt>Handle:</dt>
							<dd>@{data.identity?.handle}</dd>
							
							<dt>UUID:</dt>
							<dd><code>{data.identity?.uuid}</code></dd>
						</dl>
						<p class="hint">This information will be sent with your request.</p>
					</div>

					<div class="form-actions">
						<Button type="submit" disabled={submitting}>
							{submitting ? 'Sending Request...' : 'Send Adoption Request'}
						</Button>
						<Button variant="secondary" href="/federation">
							Cancel
						</Button>
					</div>
				</form>
			</div>
		</Card>
	{/if}
</div>

<style>
	.adoption-request-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.info-section {
		padding: 1rem;
		background: var(--color-surface-secondary);
		border-radius: 0.5rem;
	}

	.info-section h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1.125rem;
	}

	.info-section p {
		margin: 0 0 0.75rem 0;
		color: var(--color-text-secondary);
	}

	.info-section ul {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--color-text-secondary);
	}

	.info-section li {
		margin: 0.25rem 0;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.your-info {
		padding: 1rem;
		background: var(--color-surface-tertiary);
		border-radius: 0.5rem;
	}

	.your-info h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
	}

	.your-info dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem 1rem;
		margin: 0;
	}

	.your-info dt {
		font-weight: 600;
	}

	.your-info dd {
		margin: 0;
	}

	.your-info code {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.your-info .hint {
		margin: 0.75rem 0 0 0;
		font-size: 0.875rem;
		color: var(--color-text-tertiary);
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
	}
</style>
