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

	// Truncate public key for display
	function truncateKey(key: string): string {
		if (key.length < 100) return key;
		const lines = key.split('\n');
		if (lines.length > 2) {
			return lines[0] + '\n' + lines[1].substring(0, 50) + '...';
		}
		return key.substring(0, 80) + '...';
	}

	// Truncate UUID for display
	function truncateUuid(uuid: string): string {
		return uuid.substring(0, 8) + '...' + uuid.substring(uuid.length - 8);
	}

	let verifying = $state(false);
	let verificationResult = $state<{ verified: boolean; message: string } | null>(null);

	async function verifyChain() {
		if (!data.foundingRecord) {
			verificationResult = { verified: true, message: 'Root society - no parent to verify' };
			return;
		}

		verifying = true;
		verificationResult = null;

		try {
			const response = await fetch('/api/lineage/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					founding_record: data.foundingRecord
				})
			});

			const result = await response.json();

			if (response.ok && result.verified) {
				verificationResult = {
					verified: true,
					message: 'Founding record signature verified ✓'
				};
			} else {
				verificationResult = {
					verified: false,
					message: result.error || 'Verification failed'
				};
			}
		} catch (error) {
			verificationResult = {
				verified: false,
				message: 'Failed to verify: ' + (error instanceof Error ? error.message : 'Unknown error')
			};
		} finally {
			verifying = false;
		}
	}
</script>

<div class="page">
	<PageHeader 
		title="Lineage" 
		description="Cryptographic founding chain"
	>
		{#if data.foundingRecord}
			{#snippet actions()}
				<Button variant="secondary" onclick={verifyChain} disabled={verifying}>
					{verifying ? 'Verifying...' : 'Verify Chain'}
				</Button>
			{/snippet}
		{/if}
	</PageHeader>

	{#if verificationResult}
		<Alert variant={verificationResult.verified ? 'success' : 'danger'}>
			{verificationResult.message}
		</Alert>
	{/if}

	{#if !data.initialized}
		<EmptyState
			icon="🏛️"
			title="Society Not Initialized"
			description="This society has not been initialized yet. Initialize as either a root society or with a founding record from a parent society."
		>
			{#snippet actions()}
				<Button href="/federation/initialize">Initialize Society</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<div class="lineage-container">
			<!-- Current Society (Top of chain) -->
			<Card>
				<div class="lineage-node lineage-node--current">
					<div class="lineage-node__badge">
						<Badge variant="primary" label="You are here" />
					</div>
					<div class="lineage-node__content">
						<div class="lineage-node__header">
							<h3 class="lineage-node__title">@{data.identity?.handle}</h3>
							{#if data.identity?.is_root}
								<Badge variant="success" label="Root Society" />
							{/if}
						</div>
						<div class="lineage-node__details">
							<div class="lineage-detail">
								<span class="lineage-detail__label">UUID:</span>
								<code class="lineage-detail__value">{truncateUuid(data.identity?.uuid || '')}</code>
							</div>
							<div class="lineage-detail">
								<span class="lineage-detail__label">Founded:</span>
								<span class="lineage-detail__value">{formatDate(data.identity?.founded_at || null)}</span>
							</div>
						</div>
						{#if data.identity?.public_key}
							<details class="lineage-node__key-details">
								<summary class="lineage-node__key-summary">Public Key</summary>
								<pre class="lineage-node__key"><code>{data.identity.public_key}</code></pre>
							</details>
						{/if}
					</div>
				</div>
			</Card>

			<!-- Founding Record (if exists) -->
			{#if data.foundingRecord}
				<div class="lineage-connector">
					<div class="lineage-connector__line"></div>
					<div class="lineage-connector__label">
						<Badge variant="secondary" label="Founded {formatDate(Math.floor(new Date(data.foundingRecord.founded_at).getTime() / 1000))}" />
					</div>
					<div class="lineage-connector__line"></div>
				</div>

				<Card>
					<div class="founding-record">
						<h4 class="founding-record__title">📜 Founding Record</h4>
						<div class="founding-record__attestation">
							"{data.foundingRecord.parent_attestation}"
						</div>
						<details class="founding-record__signature">
							<summary>Cryptographic Signature</summary>
							<pre><code>{data.foundingRecord.signature}</code></pre>
						</details>
					</div>
				</Card>

				<div class="lineage-connector">
					<div class="lineage-connector__line"></div>
					<div class="lineage-connector__label">
						<Badge variant="secondary" label="by parent" />
					</div>
					<div class="lineage-connector__line"></div>
				</div>

				<!-- Parent Society -->
				<Card>
					<div class="lineage-node">
						<div class="lineage-node__content">
							<div class="lineage-node__header">
								<h3 class="lineage-node__title">@{data.foundingRecord.parent.handle}</h3>
								<Badge variant="secondary" label="Parent" />
							</div>
							<div class="lineage-node__details">
								<div class="lineage-detail">
									<span class="lineage-detail__label">UUID:</span>
									<code class="lineage-detail__value">{truncateUuid(data.foundingRecord.parent.uuid)}</code>
								</div>
							</div>
							{#if data.foundingRecord.parent.public_key}
								<details class="lineage-node__key-details">
									<summary class="lineage-node__key-summary">Public Key</summary>
									<pre class="lineage-node__key"><code>{data.foundingRecord.parent.public_key}</code></pre>
								</details>
							{/if}
						</div>
					</div>
				</Card>

				<div class="lineage-note">
					<strong>Note:</strong> To view the complete lineage chain to root, use the lineage walker to query your parent society's endpoint.
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.lineage-container {
		max-width: 800px;
		margin: 0 auto;
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.lineage-node {
		position: relative;
	}

	.lineage-node--current {
		border-color: var(--color-primary);
		border-width: 2px;
		box-shadow: 0 0 0 3px var(--color-primary-subtle);
	}

	.lineage-node__badge {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
	}

	.lineage-node__header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.lineage-node__title {
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		margin: 0;
	}

	.lineage-node__details {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.lineage-detail {
		display: flex;
		gap: var(--space-2);
		font-size: var(--text-sm);
	}

	.lineage-detail__label {
		color: var(--color-text-muted);
		font-weight: var(--weight-medium);
		min-width: 80px;
	}

	.lineage-detail__value {
		color: var(--color-text);
	}

	.lineage-node__key-details {
		margin-top: var(--space-3);
	}

	.lineage-node__key-summary {
		cursor: pointer;
		color: var(--color-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		user-select: none;
	}

	.lineage-node__key-summary:hover {
		text-decoration: underline;
	}

	.lineage-node__key {
		margin-top: var(--space-2);
		padding: var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: var(--text-xs);
		overflow-x: auto;
	}

	.lineage-connector {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4) 0;
		margin: 0 auto;
		max-width: 400px;
	}

	.lineage-connector__line {
		flex: 1;
		height: 2px;
		background: var(--color-border);
	}

	.lineage-connector__label {
		flex-shrink: 0;
	}

	.founding-record__title {
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		margin: 0 0 var(--space-3) 0;
	}

	.founding-record__attestation {
		font-style: italic;
		color: var(--color-text);
		margin-bottom: var(--space-4);
		padding: var(--space-3);
		background: var(--color-surface);
		border-left: 3px solid var(--color-accent);
		border-radius: var(--radius);
	}

	.founding-record__signature {
		margin-top: var(--space-3);
	}

	.founding-record__signature summary {
		cursor: pointer;
		color: var(--color-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		user-select: none;
	}

	.founding-record__signature summary:hover {
		text-decoration: underline;
	}

	.founding-record__signature pre {
		margin-top: var(--space-2);
		padding: var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: var(--text-xs);
		overflow-x: auto;
		word-break: break-all;
	}

	.lineage-note {
		margin-top: var(--space-6);
		padding: var(--space-4);
		background: var(--color-bg);
		border-left: 3px solid var(--color-primary);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.lineage-note strong {
		color: var(--color-text);
	}
</style>