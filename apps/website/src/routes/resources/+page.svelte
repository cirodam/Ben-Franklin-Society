<svelte:head>
	<title>Resources - Ben Franklin Society</title>
	<meta
		name="description"
		content="Developer resources and documentation for the Ben Franklin Society platform."
	/>
</svelte:head>

<article>
	<h1>Resources</h1>

	<p>
		A Ben Franklin Society is people organizing to take care of each other and make collective
		decisions. The software helps coordinate membership, record decisions, manage authentication,
		and track deliberations—but the real work happens between people in the real world.
	</p>

	<p>
		Think of it like a ledger or record book: useful infrastructure that enables the actual
		community work. The software is free and open source. The full source code, documentation,
		deployment scripts, and contribution guidelines are available on GitHub.
	</p>

	<p class="github-link">
		<a href="https://github.com/cirodam/Ben-Franklin-Society" target="_blank" rel="noopener noreferrer">
			github.com/cirodam/Ben-Franklin-Society
		</a>
	</p>
</article>

<style>
	article {
		max-width: 700px;
		margin: 0 auto;
		padding: 0 0 2rem 0;
	}

	h1 {
		font-family: var(--font-prose);
		font-size: 2.5rem;
		line-height: 1.2;
		margin-top: 0;
		margin-bottom: 3rem;
		text-align: center;
	}

	p {
		margin-bottom: 1.5rem;
		line-height: 1.8;
	}

	.github-link {
		text-align: center;
		margin-top: 3rem;
	}

	.github-link a {
		color: var(--color-text);
		text-decoration: none;
		font-size: 1.1rem;
	}

	.github-link a:hover {
		color: var(--color-secondary);
	}

	@media (max-width: 768px) {
		article {
			padding: 1rem 0;
		}

		h1 {
			font-size: 2rem;
			margin-bottom: 2rem;
		}
	}
</style>
