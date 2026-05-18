<script lang="ts">
	type Motion = {
		status: string;
	};

	let {
		motion
	}: {
		motion: Motion;
	} = $props();
</script>

<div class="lifecycle-indicator">
	<div class="lifecycle-step {motion.status === 'draft' ? 'active' : motion.status !== 'draft' ? 'completed' : ''}">
		<div class="lifecycle-step__icon">📝</div>
		<div class="lifecycle-step__label">Draft</div>
	</div>
	<div class="lifecycle-connector {['introduced', 'deliberation', 'enacted', 'rejected'].includes(motion.status) ? 'active' : ''}"></div>
	<div class="lifecycle-step {motion.status === 'introduced' ? 'active' : ['deliberation', 'enacted', 'rejected'].includes(motion.status) ? 'completed' : ''}">
		<div class="lifecycle-step__icon">📋</div>
		<div class="lifecycle-step__label">Introduced</div>
	</div>
	<div class="lifecycle-connector {['deliberation', 'enacted', 'rejected'].includes(motion.status) ? 'active' : ''}"></div>
	<div class="lifecycle-step {motion.status === 'deliberation' ? 'active' : ['enacted', 'rejected'].includes(motion.status) ? 'completed' : ''}">
		<div class="lifecycle-step__icon">🗳️</div>
		<div class="lifecycle-step__label">Deliberation</div>
	</div>
	<div class="lifecycle-connector {['enacted', 'rejected'].includes(motion.status) ? 'active' : ''}"></div>
	<div class="lifecycle-step {['enacted', 'rejected', 'withdrawn'].includes(motion.status) ? 'completed' : ''}">
		<div class="lifecycle-step__icon">
			{#if motion.status === 'enacted'}
				✅
			{:else if motion.status === 'rejected'}
				❌
			{:else if motion.status === 'withdrawn'}
				🚫
			{:else}
				🏁
			{/if}
		</div>
		<div class="lifecycle-step__label">
			{#if motion.status === 'enacted'}
				Enacted
			{:else if motion.status === 'rejected'}
				Rejected
			{:else if motion.status === 'withdrawn'}
				Withdrawn
			{:else}
				Final
			{/if}
		</div>
	</div>
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

	.lifecycle-step__icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.8);
		border: 2px solid rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		transition: all 0.3s;
	}

	.lifecycle-step.active .lifecycle-step__icon {
		background: white;
		border-color: #5b8cb8;
		box-shadow: 0 2px 8px rgba(91, 140, 184, 0.3);
		transform: scale(1.1);
	}

	.lifecycle-step.completed .lifecycle-step__icon {
		background: #e8f4ea;
		border-color: #28704a;
	}

	.lifecycle-step__label {
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--color-text-muted);
		text-align: center;
	}

	.lifecycle-step.active .lifecycle-step__label {
		color: var(--color-text);
	}

	.lifecycle-step__detail {
		font-size: 10px;
		color: var(--color-text-muted);
		text-align: center;
	}

	.lifecycle-connector {
		flex: 1;
		height: 2px;
		background: rgba(0, 0, 0, 0.1);
		max-width: 60px;
		transition: background 0.3s;
	}

	.lifecycle-connector.active {
		background: #28704a;
	}
</style>
