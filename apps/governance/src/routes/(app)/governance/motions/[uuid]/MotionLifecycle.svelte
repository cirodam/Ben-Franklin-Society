<script lang="ts">
	type Motion = {
		status: string;
	};

	let {
		motion
	}: {
		motion: Motion;
	} = $props();

	// Determine if motion has concluded
	const isConcluded = $derived(['adopted', 'enacted', 'rejected', 'withdrawn'].includes(motion.status));
</script>

<div class="lifecycle-indicator">
	<!-- Draft -->
	<div class="lifecycle-step {motion.status === 'draft' ? 'active' : motion.status !== 'draft' ? 'completed' : ''}">
		<div class="lifecycle-step__dot"></div>
		<div class="lifecycle-step__label">Draft</div>
	</div>
	<div class="lifecycle-connector {motion.status !== 'draft' ? 'active' : ''}"></div>
	
	<!-- Introduced -->
	<div class="lifecycle-step {motion.status === 'introduced' ? 'active' : ['deliberation', 'adopted', 'enacted', 'rejected', 'withdrawn'].includes(motion.status) ? 'completed' : ''}">
		<div class="lifecycle-step__dot"></div>
		<div class="lifecycle-step__label">Introduced</div>
	</div>
	<div class="lifecycle-connector {['deliberation', 'adopted', 'enacted', 'rejected', 'withdrawn'].includes(motion.status) ? 'active' : ''}"></div>
	
	<!-- Deliberation -->
	<div class="lifecycle-step {motion.status === 'deliberation' ? 'active' : ['adopted', 'enacted', 'rejected', 'withdrawn'].includes(motion.status) ? 'completed' : ''}">
		<div class="lifecycle-step__dot"></div>
		<div class="lifecycle-step__label">Deliberation</div>
	</div>

	{#if isConcluded}
		<!-- Show outcome steps only after conclusion -->
		{#if motion.status !== 'rejected' && motion.status !== 'withdrawn'}
			<!-- Adopted step (only for adopted→enacted path) -->
			<div class="lifecycle-connector active"></div>
			<div class="lifecycle-step {motion.status === 'adopted' ? 'active' : motion.status === 'enacted' ? 'completed' : ''}">
				<div class="lifecycle-step__dot"></div>
				<div class="lifecycle-step__label">Adopted</div>
			</div>
		{/if}

		<!-- Final outcome -->
		<div class="lifecycle-connector active"></div>
		<div class="lifecycle-step completed">
			<div class="lifecycle-step__dot"></div>
			<div class="lifecycle-step__label">
				{#if motion.status === 'enacted'}
					Enacted
				{:else if motion.status === 'rejected'}
					Rejected
				{:else if motion.status === 'withdrawn'}
					Withdrawn
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.lifecycle-indicator {
		max-width: 1000px;
		margin: 0 auto var(--space-6);
		padding: 0 var(--space-4);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0;
	}

	.lifecycle-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		min-width: 80px;
		padding: var(--space-2);
		opacity: 0.4;
		transition: opacity 0.3s;
	}

	.lifecycle-step.active { opacity: 1; }
	.lifecycle-step.completed { opacity: 0.7; }

	.lifecycle-step__dot {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(45, 90, 79, 0.3);
		background: transparent;
		transition: all 0.3s;
	}

	.lifecycle-step.active .lifecycle-step__dot {
		background: #7a5c1a;
		border-color: #7a5c1a;
		box-shadow: 0 0 0 4px rgba(122, 92, 26, 0.1);
	}

	.lifecycle-step.completed .lifecycle-step__dot {
		background: rgba(45, 90, 79, 0.5);
		border-color: rgba(45, 90, 79, 0.5);
	}

	.lifecycle-step__label {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #374340;
		text-align: center;
	}

	.lifecycle-step.active .lifecycle-step__label {
		color: #151c1a;
	}

	.lifecycle-connector {
		flex: 1;
		height: 2px;
		background: rgba(45, 90, 79, 0.2);
		max-width: 60px;
		transition: background 0.3s;
	}

	.lifecycle-connector.active {
		background: rgba(45, 90, 79, 0.5);
	}
</style>
