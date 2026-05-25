<script lang="ts">
	import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Format date from Unix timestamp
	function formatDate(timestamp: number | null): string {
		if (!timestamp) return 'Unknown';
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Truncate UUID for display
	function truncateUuid(uuid: string): string {
		return uuid.substring(0, 8) + '...' + uuid.substring(uuid.length - 8);
	}

	// Function to export identity as JSON
	function exportIdentity() {
		const exportData = {
			handle: data.identity?.handle,
			uuid: data.identity?.uuid,
			public_key: data.identity?.public_key,
			parent_uuid: data.identity?.parent_uuid,
			founded_at: data.identity?.founded_at,
			founding_record: data.foundingRecord,
			capacity: data.capacity
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${data.identity?.handle}-identity.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<div class="page">
	<PageHeader 
		title="Federation" 
		description="Society identity and network connections"
	>
		{#if data.initialized}
			{#snippet actions()}
				<Button variant="secondary" onclick={exportIdentity}>
					Export Identity
				</Button>
				<Button href="/federation/lineage">
					View Lineage Chain
				</Button>
			{/snippet}
		{/if}
	</PageHeader>

	{#if !data.initialized}
		<EmptyState
			icon="🏛️"
			title="Society Not Initialized"
			description="This society was not initialized during setup. This should not happen with new installations."
		>
			{#snippet actions()}
				<Button href="/setup">Run Setup</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<div class="identity-container">
			<!-- Society Identity Card -->
			<Card>
				<div class="identity-section">
					<div class="identity-header">
						<h3 class="identity-title">Society Identity</h3>
						{#if data.identity?.is_root}
							<Badge variant="success" label="Root Society" />
						{:else}
							<Badge variant="accent" label="Child Society" />
						{/if}
					</div>

					<div class="identity-grid">
						<div class="identity-field">
							<label class="identity-label">Handle</label>
							<div class="identity-value identity-value--highlight">
								<span class="identity-handle">@{data.identity?.handle}</span>
							</div>
						</div>

						<div class="identity-field">
							<label class="identity-label">UUID</label>
							<code class="identity-value identity-value--code">
								{truncateUuid(data.identity?.uuid || '')}
							</code>
						</div>

						<div class="identity-field">
							<label class="identity-label">Founded</label>
							<div class="identity-value">
								{formatDate(data.identity?.founded_at || null)}
							</div>
						</div>

					{#if data.identity?.parent_uuid}
						<div class="identity-field">
							<label class="identity-label">Parent Society UUID</label>
							<code class="identity-value identity-value--code">
								{truncateUuid(data.identity.parent_uuid)}
							</code>
							</div>
						{/if}
					</div>

					<!-- Public Key Section -->
					<details class="identity-key-details">
						<summary class="identity-key-summary">
							<strong>Public Key</strong>
							<span class="identity-key-hint">(Ed25519)</span>
						</summary>
						<pre class="identity-key-code"><code>{data.identity?.public_key}</code></pre>
					</details>
				</div>
			</Card>

			<!-- Children Societies Card -->
			{#if data.children.length > 0 || data.capacity.available}
				<Card>
					<div class="children-section">
						<div class="children-header">
							<h3 class="children-title">Founded Societies</h3>
							<Badge 
							variant={data.capacity.available ? 'neutral' : 'danger'} 
							label="{data.children.length} / {data.capacity.maximum}" 
						/>
					</div>

						{#if data.children.length > 0}
							<div class="children-list">
								{#each data.children as child}
									<div class="child-item">
										<div class="child-info">
											<span class="child-handle">@{child.handle}</span>
											<code class="child-uuid">{truncateUuid(child.uuid)}</code>
										</div>
										<div class="child-meta">
											<span class="child-date">Founded {formatDate(child.founded_at)}</span>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="children-empty">
								No societies founded yet. This society can found up to {data.capacity.maximum} child societies.
							</p>
						{/if}

						{#if !data.capacity.available}
							<Alert variant="info">
								This society has reached maximum capacity ({data.capacity.maximum} children). 
								New societies should request adoption from one of the children instead.
							</Alert>
						{/if}
					</div>
				</Card>
			{/if}

			<!-- Network Actions Card -->
			<Card>
				<div class="actions-section">
					<h3 class="actions-title">Network Actions</h3>
					<div class="actions-grid">
						<Button href="/federation/lineage" variant="secondary" fullWidth>
							View Lineage Chain
						</Button>
						<Button href="/federation/peers" variant="secondary" fullWidth disabled>
							Manage Peers
							<span class="coming-soon">(Coming Soon)</span>
						</Button>
						{#if data.identity?.is_root}
							<Button href="/federation/adopt-request" variant="secondary" fullWidth>
								Request Adoption
							</Button>						<Button href="/federation/my-requests" variant="secondary" fullWidth>
							My Adoption Requests
						</Button>						{/if}
						{#if data.capacity.available}
							<Button href="/federation/adoption-requests" variant="secondary" fullWidth>
								View Adoption Requests
							</Button>
						{/if}
					</div>
				</div>
			</Card>
		</div>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.identity-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	/* Identity Section */
	.identity-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.identity-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}

	.identity-title {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: var(--ink);
		margin: 0;
	}

	.identity-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
	}

	.identity-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.identity-label {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-mid);
	}

	.identity-value {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: var(--ink);
	}

	.identity-value--highlight {
		font-size: var(--text-lg);
		font-weight: 600;
	}

	.identity-value--code {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		background: var(--surface-subtle);
		padding: var(--space-2);
		border-radius: var(--radius-sm);
	}

	.identity-handle {
		color: var(--primary);
		font-weight: 600;
	}

	.identity-key-details {
		margin-top: var(--space-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.identity-key-summary {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm);
		letter-spacing: 0.1em;
		padding: var(--space-3);
		background: var(--surface-subtle);
		cursor: pointer;
		user-select: none;
	}

	.identity-key-summary:hover {
		background: var(--surface);
	}

	.identity-key-hint {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--ink-mid);
		margin-left: var(--space-2);
		font-weight: normal;
		letter-spacing: normal;
	}

	.identity-key-code {
		margin: 0;
		padding: var(--space-4);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		line-height: 1.6;
		color: var(--ink);
		overflow-x: auto;
	}

	/* Children Section */
	.children-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.children-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}

	.children-title {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: var(--ink);
		margin: 0;
	}

	.children-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.child-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3);
		background: var(--surface-subtle);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
	}

	.child-info {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.child-handle {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--primary);
	}

	.child-uuid {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--ink-mid);
	}

	.child-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--space-1);
	}

	.child-date {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm);
		color: var(--ink-mid);
		font-style: italic;
	}

	.children-empty {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-base);
		color: var(--ink-mid);
		font-style: italic;
		margin: 0;
	}

	/* Actions Section */
	.actions-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.actions-title {
		font-family: 'IM Fell English', serif;
		font-size: var(--text-xl);
		font-weight: 400;
		color: var(--ink);
		margin: 0;
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-3);
	}

	.coming-soon {
		font-size: var(--text-xs);
		color: var(--ink-mid);
		font-style: italic;
		margin-left: var(--space-2);
	}
</style>
