<script lang="ts">
	interface Props {
		title: string;
		description: string;
		href: string;
	}

	let { title, description, href }: Props = $props();
</script>

<a {href} class="browse-card">
	<div class="browse-card__title">{title}</div>
	<div class="browse-card__desc">{description}</div>
</a>

<style>
	.browse-card {
		border: 2px solid var(--deep-forest);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		text-decoration: none;
		color: var(--charcoal);
		background: var(--canvas);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		transition: all 0.2s;
	}

	.browse-card:hover {
		background: white;
		border-color: var(--market-green);
		box-shadow: 0 4px 12px rgba(74, 124, 89, 0.15);
		transform: translateY(-2px);
	}

	.browse-card__title {
		font-family: var(--font-serif);
		font-weight: 600;
		font-size: var(--text-lg);
		color: var(--charcoal);
	}

	.browse-card__desc {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--slate);
		line-height: 1.5;
	}
</style>
