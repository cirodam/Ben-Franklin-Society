<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Input, PageHeader, Select, Checkbox } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let passingThreshold = $state('0.5');
	let requiresQuorum = $state(false);
	let quorumThreshold = $state('0.5');
	let opensAt = $state('');
	let closesAt = $state('');
	let submitting = $state(false);

	// Set default times (now + 1 hour to now + 1 day)
	$effect(() => {
		const now = new Date();
		const oneHour = new Date(now.getTime() + 60 * 60 * 1000);
		const oneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
		
		opensAt = oneHour.toISOString().slice(0, 16);
		closesAt = oneDay.toISOString().slice(0, 16);
	});

	const thresholdOptions = [
		{ value: '0.5', label: 'Simple Majority (50%)' },
		{ value: '0.6', label: '60% Supermajority' },
		{ value: '0.67', label: '2/3 Supermajority (67%)' },
		{ value: '0.75', label: '3/4 Supermajority (75%)' },
	];
</script>

<div class="page">
	<div class="breadcrumb">
		<a href="/governance/motions/{data.motion.uuid}">← Back to Motion</a>
	</div>

	<PageHeader 
		title="Schedule Vote Session"
		description="Create a new voting session for {data.motion.title}"
	/>

	<section class="card">
		<form method="POST" action="?/create" use:enhance={() => {
			submitting = true;
			return async ({ result, update }) => {
				submitting = false;
				await update();
			};
		}}>
			<input type="hidden" name="motion_uuid" value={data.motion.uuid} />

			<div class="form-section">
				<h3>Timing</h3>
				
				<div class="form-row">
					<Input
						label="Opens At"
						type="datetime-local"
						name="opens_at"
						bind:value={opensAt}
						required
					/>
					<Input
						label="Closes At"
						type="datetime-local"
						name="closes_at"
						bind:value={closesAt}
						required
					/>
				</div>

				<p class="hint">
					Session will automatically open and close at the specified times. Members can only vote during the open period.
				</p>
			</div>

			<div class="form-section">
				<h3>Voting Rules</h3>

				<div class="form-field">
					<label for="passing_threshold">Passing Threshold</label>
					<Select bind:value={passingThreshold} name="passing_threshold" required>
						{#each thresholdOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</Select>
					<p class="hint">
						Percentage of "aye" votes (out of aye + nay) required to pass.
						Abstentions don't count toward the threshold.
					</p>
				</div>

				<div class="form-field">
					<Checkbox
						label="Require Quorum"
						bind:checked={requiresQuorum}
						name="requires_quorum"
					/>
					<p class="hint">
						If enabled, a minimum participation rate must be met for the vote to be valid.
					</p>
				</div>

				{#if requiresQuorum}
					<div class="form-field indented">
						<label for="quorum_threshold">Quorum Threshold</label>
						<Select bind:value={quorumThreshold} name="quorum_threshold">
							<option value="0.25">25% Participation</option>
							<option value="0.33">33% Participation</option>
							<option value="0.5">50% Participation</option>
							<option value="0.67">67% Participation</option>
						</Select>
						<p class="hint">
							Minimum percentage of eligible voters who must participate.
						</p>
					</div>
				{/if}
			</div>

			<div class="form-section">
				<h3>Preview</h3>
				<div class="preview-box">
					<p><strong>Motion:</strong> {data.motion.title}</p>
					<p><strong>Opens:</strong> {new Date(opensAt).toLocaleString()}</p>
					<p><strong>Closes:</strong> {new Date(closesAt).toLocaleString()}</p>
					<p><strong>Passing Threshold:</strong> {(parseFloat(passingThreshold) * 100).toFixed(0)}%</p>
					{#if requiresQuorum}
						<p><strong>Quorum:</strong> {(parseFloat(quorumThreshold) * 100).toFixed(0)}% participation required</p>
					{:else}
						<p><strong>Quorum:</strong> Not required</p>
					{/if}
				</div>
			</div>

			<div class="form-actions">
				<Button 
					type="button" 
					variant="secondary" 
					onclick={() => window.history.back()}
					disabled={submitting}
				>
					Cancel
				</Button>
				<Button 
					type="submit" 
					variant="primary"
					disabled={submitting}
				>
					{submitting ? 'Creating...' : 'Create Vote Session'}
				</Button>
			</div>
		</form>
	</section>
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		padding: var(--space-6);
	}

	.breadcrumb {
		margin-bottom: var(--space-4);
	}

	.breadcrumb a {
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.breadcrumb a:hover {
		color: var(--color-text);
	}

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-6);
	}

	.form-section {
		margin-bottom: var(--space-6);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid var(--color-border);
	}

	.form-section:last-of-type {
		border-bottom: none;
	}

	.form-section h3 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-lg);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	.form-field {
		margin-bottom: var(--space-4);
	}

	.form-field.indented {
		margin-left: var(--space-6);
	}

	.form-field label {
		display: block;
		margin-bottom: var(--space-2);
		font-weight: 600;
		font-size: var(--text-sm);
	}

	.hint {
		margin-top: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.preview-box {
		padding: var(--space-4);
		background: var(--color-surface-alt);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
	}

	.preview-box p {
		margin: var(--space-2) 0;
		font-size: var(--text-sm);
	}

	.preview-box strong {
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding-top: var(--space-4);
	}
</style>
