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
		border: 1px solid var(--border-light);
		border-radius: 8px;
		padding: var(--space-6);
		background: var(--bg-surface);
		box-shadow: var(--shadow-sm);
		text-decoration: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		transition: all 0.15s ease;
	}

	.browse-card:hover {
		border-color: var(--border-accent);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.browse-card__title {
		font-family: var(--font-serif);
		font-weight: 600;
		font-size: var(--text-lg);
		color: var(--text-primary);
	}

	.browse-card__desc {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--text-muted);
		line-height: 1.5;
	}
</style>
