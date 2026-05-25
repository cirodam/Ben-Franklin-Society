<script lang="ts">
	import { Button, Card, Badge, Alert, Input } from '@bfs/ui';
	import type { PageData } from './$types.js';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let showAddForm = $state(false);
	let editingServer = $state<string | null>(null);

	function formatDate(timestamp: number): string {
		return new Date(timestamp * 1000).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatRelativeTime(timestamp: number | null): string {
		if (!timestamp) return 'Never';
		const now = Math.floor(Date.now() / 1000);
		const diff = now - timestamp;
		
		if (diff < 60) return 'Just now';
		if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
		return `${Math.floor(diff / 86400)} days ago`;
	}
</script>

<div class="servers-page">
	<div class="page-header">
		<div>
			<h1>Federation Servers</h1>
			<p class="page-description">
				Manage federation discovery servers for registering and finding other societies
			</p>
		</div>
		<Button onclick={() => showAddForm = !showAddForm} variant="primary">
			{showAddForm ? 'Cancel' : 'Add Server'}
		</Button>
	</div>

	{#if showAddForm}
		<Card>
			<form method="POST" action="?/add" use:enhance={() => {
				return async ({ update }) => {
					await update();
					showAddForm = false;
				};
			}}>
				<div class="form-content">
					<h3>Add Federation Server</h3>
					
					<div class="form-field">
						<label for="url">URL *</label>
						<Input
							id="url"
							name="url"
							type="url"
							placeholder="https://federation.bfs.network"
							required
						/>
					</div>

					<div class="form-field">
						<label for="handle">Handle (optional)</label>
						<Input
							id="handle"
							name="handle"
							placeholder="BFS Main Registry"
						/>
					</div>

					<div class="form-field">
						<label for="service_type">Service Type</label>
						<select id="service_type" name="service_type" class="service-type-select">
							<option value="registry">Registry</option>
							<option value="central_bank">Central Bank</option>
							<option value="insurance">Insurance Fund</option>
							<option value="arbitration">Arbitration Service</option>
							<option value="standards">Standards Authority</option>
							<option value="security">Security Authority</option>
							<option value="statistics">Statistics Service</option>
						</select>
					</div>

					<div class="form-field">
						<label>
							<input type="checkbox" name="is_primary" value="true" />
							Set as primary server
						</label>
					</div>

					<div class="form-actions">
						<Button type="submit" variant="primary">Add Server</Button>
						<Button type="button" variant="secondary" onclick={() => showAddForm = false}>
							Cancel
						</Button>
					</div>
				</div>
			</form>
		</Card>
	{/if}

	{#if data.servers.length === 0}
		<Card>
			<Alert variant="warning">
				No federation servers configured. Add a federation server to enable discovery and registration of societies across the network.
			</Alert>
		</Card>
	{:else}
		<div class="servers-list">
			{#each data.servers as server}
				<Card>
					<div class="server-card">
						<div class="server-header">
							<div class="server-info">
								<div class="server-title">
									<h3>{server.handle || 'Unnamed Server'}</h3>
								<Badge variant="neutral" label={server.service_type.replace('_', ' ')} />
								{#if server.is_primary}
								<Badge variant="accent" label="Primary" />
								{/if}
								{#if server.connection_status === 'connected'}
								<Badge variant="success" label="Connected" />
								{:else if server.connection_status === 'pending'}
								<Badge variant="warn" label="Pending" />
								{:else}
								<Badge variant="neutral" label="Disconnected" />
								{/if}
							</div>
							<div class="server-url">{server.url}</div>
						</div>
						<div class="server-actions">
							{#if server.service_type === 'registry' && server.connection_status !== 'connected'}
								<form method="POST" action="?/register" use:enhance>
									<input type="hidden" name="uuid" value={server.uuid} />
									<Button type="submit" variant="primary" size="sm" disabled={server.connection_status === 'pending'}>
										{server.connection_status === 'pending' ? 'Registering...' : 'Register'}
									</Button>
								</form>
							{/if}
								{#if !server.is_primary}
									<form method="POST" action="?/setPrimary" use:enhance>
										<input type="hidden" name="uuid" value={server.uuid} />
								<Button type="submit" variant="secondary" size="sm">
											Set as Primary
										</Button>
									</form>
								{/if}
								<Button
									onclick={() => editingServer = editingServer === server.uuid ? null : server.uuid}
									variant="secondary"
									size="sm"
								>
									{editingServer === server.uuid ? 'Cancel' : 'Edit'}
								</Button>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="uuid" value={server.uuid} />
							<Button type="submit" variant="danger" size="sm">
										Delete
									</Button>
								</form>
							</div>
						</div>

						<div class="server-meta">
						{#if server.connection_status === 'connected' && server.connected_at}
						<div class="meta-item">
							<span class="meta-label">Registered:</span>
							<span class="meta-value">{formatDate(server.connected_at)}</span>
						</div>
						{/if}
						<div class="meta-item">
								<span class="meta-value">{formatRelativeTime(server.last_contacted_at)}</span>
							</div>
							<div class="meta-item">
								<span class="meta-label">Added:</span>
								<span class="meta-value">{formatDate(server.created_at)}</span>
							</div>
						</div>

						{#if editingServer === server.uuid}
							<form method="POST" action="?/update" use:enhance={() => {
								return async ({ update }) => {
									await update();
									editingServer = null;
								};
							}}>
								<input type="hidden" name="uuid" value={server.uuid} />
								<div class="edit-form">
									<div class="form-field">
										<label for="edit-url-{server.uuid}">URL *</label>
										<Input
											id="edit-url-{server.uuid}"
											name="url"
											type="url"
											value={server.url}
											required
										/>
									</div>

									<div class="form-field">
										<label for="edit-handle-{server.uuid}">Handle</label>
										<Input
											id="edit-handle-{server.uuid}"
											name="handle"
											value={server.handle || ''}
										/>
									</div>

									<div class="form-field">
										<label for="edit-service-type-{server.uuid}">Service Type</label>
										<select id="edit-service-type-{server.uuid}" name="service_type" class="service-type-select" value={server.service_type}>
											<option value="registry">Registry</option>
											<option value="central_bank">Central Bank</option>
											<option value="insurance">Insurance Fund</option>
											<option value="arbitration">Arbitration Service</option>
											<option value="standards">Standards Authority</option>
											<option value="security">Security Authority</option>
											<option value="statistics">Statistics Service</option>
										</select>
									</div>

									<div class="form-actions">
										<Button type="submit" variant="primary" size="sm">Save Changes</Button>
										<Button
											type="button"
											variant="secondary"
											size="sm"
											onclick={() => editingServer = null}
										>
											Cancel
										</Button>
									</div>
								</div>
							</form>
						{/if}
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<style>
	.servers-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 600;
	}

	.page-description {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: 0.95rem;
	}

	.form-content {
		padding: 1rem;
	}

	.form-content h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.form-field {
		margin-bottom: 1.5rem;
	}

	.form-field label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.form-field input[type="checkbox"] {
		margin-right: 0.5rem;
	}

	.service-type-select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.95rem;
		font-family: inherit;
	}

	.service-type-select:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.servers-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.server-card {
		padding: 1rem;
	}

	.server-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.server-info {
		flex: 1;
	}

	.server-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.server-title h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.server-url {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		font-family: monospace;
	}

	.server-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.server-meta {
		display: flex;
		gap: 2rem;
		padding: 0.75rem 0;
		border-top: 1px solid var(--color-border);
	}

	.meta-item {
		display: flex;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.meta-label {
		color: var(--color-text-secondary);
	}

	.meta-value {
		font-weight: 500;
	}

	.edit-form {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border);
	}
</style>
