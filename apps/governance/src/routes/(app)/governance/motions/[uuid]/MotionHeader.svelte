<script lang="ts">
	type Body = {
		uuid: string;
		name: string;
		abbreviation: string | null;
	};

	type Person = {
		uuid: string;
		given_name: string;
		family_name: string;
	};

	type Motion = {
		uuid: string;
		motion_number: number;
		title: string;
		created_at: string;
		status: string;
	};

	type Rule = {
		uuid: string;
		name: string;
		numerator: number;
		denominator: number;
	};

	type DeliberationRule = {
		uuid: string;
		name: string;
		minimum_days: number;
	};

	let {
		motion,
		body = null,
		introducer = null,
		currentRule = null,
		currentDeliberationRule = null
	}: {
		motion: Motion;
		body?: Body | null;
		introducer?: Person | null;
		currentRule?: Rule | null;
		currentDeliberationRule?: DeliberationRule | null;
	} = $props();

	const statusVariant: Record<string, string> = {
		draft:        'status--draft',
		introduced:   'status--introduced',
		deliberation: 'status--deliberation',
		enacted:      'status--enacted',
		rejected:     'status--rejected',
		withdrawn:    'status--withdrawn',
	};

	const statusLabel: Record<string, string> = {
		draft:        'Draft',
		introduced:   'Introduced',
		deliberation: 'Deliberation & Voting',
		enacted:      'Enacted',
		rejected:     'Rejected',
		withdrawn:    'Withdrawn',
	};
</script>

<div class="motion-header">
	<div class="motion-letterhead">
		<div class="letterhead-body">
			{#if body}
				{body.name}
			{:else}
				The Ben Franklin Society
			{/if}
		</div>
		<div class="letterhead-motion-number">
			{#if body?.abbreviation}
				{body.abbreviation} {motion.motion_number}
			{:else}
				Motion #{motion.motion_number}
			{/if}
		</div>
	</div>

	<h1 class="motion-title">{motion.title}</h1>

	<div class="motion-meta">
		<div class="meta-row">
			<span class="meta-label">Introduced by:</span>
			<span class="meta-value">
				{#if introducer}
					{introducer.given_name} {introducer.family_name}
				{:else}
					Unknown
				{/if}
			</span>
		</div>
		<div class="meta-row">
			<span class="meta-label">Date:</span>
			<span class="meta-value">{new Date(motion.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
		</div>
		<div class="meta-row">
			<span class="meta-label">Status:</span>
			<span class="motion-status {statusVariant[motion.status] ?? ''}">{statusLabel[motion.status] ?? motion.status}</span>
		</div>
	</div>

	<!-- Rules Display -->
	{#if currentRule || currentDeliberationRule}
		<div class="motion-rules">
			{#if currentRule}
				<div class="rule-item">
					<span class="rule-label">Voting Threshold:</span>
					<span class="rule-value">{currentRule.name}</span>
					<span class="rule-detail">({currentRule.numerator}/{currentRule.denominator})</span>
				</div>
			{/if}
			{#if currentDeliberationRule}
				<div class="rule-item">
					<span class="rule-label">Deliberation Period:</span>
					<span class="rule-value">{currentDeliberationRule.name}</span>
					<span class="rule-detail">({currentDeliberationRule.minimum_days} days)</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.motion-header {
		margin-bottom: var(--space-8);
		padding-bottom: var(--space-6);
		border-bottom: 2px solid rgba(45, 90, 79, 0.2);
	}

	.motion-letterhead {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-8);
		font-family: 'Georgia', serif;
	}

	.letterhead-body {
		font-size: var(--text-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: #7a5c1a;
	}

	.letterhead-motion-number {
		font-family: var(--font-mono, 'Courier New', monospace);
		font-size: var(--text-sm);
		color: #7a5c1a;
		font-weight: 600;
	}

	.motion-title {
		font-family: 'Georgia', serif;
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.3;
		color: #151c1a;
		margin: 0 0 var(--space-6);
		text-align: center;
	}

	.motion-meta {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		font-family: 'Georgia', serif;
		font-size: var(--text-sm);
	}

	.meta-row {
		display: flex;
		gap: var(--space-3);
		align-items: baseline;
	}

	.meta-label {
		font-weight: 600;
		color: #7a5c1a;
		min-width: 140px;
		font-style: italic;
	}

	.meta-value {
		color: #151c1a;
	}

	.motion-status {
		display: inline-block;
		font-size: var(--text-xs);
		padding: var(--space-1) var(--space-3);
		border-radius: 2px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		border: 1.5px solid;
	}
	
	.status--draft        { background: #f5f5f0; border-color: #a0a090; color: #5a5a50; }
	.status--introduced   { background: #e8f0f8; border-color: #5b8cb8; color: #1e3a5f; }
	.status--deliberation { background: #f0ebf8; border-color: #8b6cb8; color: #4a2870; }
	.status--enacted      { background: #e8f5eb; border-color: #6cb88b; color: #28704a; }
	.status--rejected     { background: #f8e8eb; border-color: #b86c6c; color: #702828; }
	.status--withdrawn    { background: #f5f5f0; border-color: #a0a090; color: #5a5a50; }

	/* Motion Rules Display */
	.motion-rules {
		margin-top: var(--space-6);
		padding: var(--space-4);
		background: rgba(255, 255, 255, 0.4);
		border: 1px solid rgba(45, 90, 79, 0.15);
		border-radius: 3px;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.rule-item {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		font-size: var(--text-sm);
	}

	.rule-label {
		font-weight: 600;
		color: #7a5c1a;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.825em;
	}

	.rule-value {
		font-weight: 500;
		color: #151c1a;
	}

	.rule-detail {
		color: var(--color-text-muted);
		font-size: 0.9em;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.motion-letterhead {
			flex-direction: column;
			gap: var(--space-2);
		}

		.motion-title {
			font-size: 1.5rem;
		}

		.meta-row {
			flex-direction: column;
			gap: var(--space-1);
		}

		.meta-label {
			min-width: auto;
		}
	}
</style>
