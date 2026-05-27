<svelte:head>
	<title>What is a Ben Franklin Society?</title>
	<meta
		name="description"
		content="A platform for communities to govern themselves through structured deliberation and sortition."
	/>
</svelte:head>

<article>
	<h1>What is a Ben Franklin Society?</h1>

	<p>
		A Ben Franklin Society is many things, but primarily it's a mutual aid society. It's a community of 
        people that work together to meet each others essential needs. Before the New Deal, groups like this
        were quite common in the US. They provided things like insurance, healthcare, and financial services 
        to their members. A Ben Franklin Society is an attempt to breathe life back into this idea and to build
        something ready to meet the crises that we face today.    
	</p>

    <p>
        Americans are intelligent, resourceful, and generous people. The challenges facing the nation today don't 
        reflect poorly on the their character. They reflect the reality that our existing institutions are quite old, 
        and they're facing challenges today that their designers never could have anticipated. We shouldn't abandon our
        institutions, but the day may come where we can no longer rely on them. It's for that reason that we need to build
        alternatives now. We have to build our own institutions that are fit to meet the challenges of our time.
    </p>

    <p>
        When disaster strikes, ordinary people don't panic, loot, or descend into chaos. They spontaneously organize, cooperate, 
        and create improvised communities of mutual aid. In crisis, people default to cooperation, not conflict. A Ben Franklin 
        Society is intended to be a scaffold for that cooperation. There is so much potential in ordinary people, and a Ben Franklin
        Society is intended to give them a way to realize it.
    </p>

    <p>
        This isn't a paid product. It's not a startup or a business. I'm not trying to sell you something. This is an idea, born out
        of a belief in the good nature, resilience, and integrity of the American people.
    </p>

	<hr />

	<p class="closing">
		This is experimental software. It is not production-ready. But if you're looking for an exit—if
		you want to build something different—this is a place to start. See the <a href="/faq">FAQ</a>
		or visit the
		<a href="https://github.com/cirodam/Ben-Franklin-Society" target="_blank"
			>GitHub repository</a
		>.
	</p>
</article>

<style>
	article {
		max-width: 700px;
		margin: 0 auto;
		padding: 2rem 0;
	}

	h1 {
		font-family: var(--font-prose);
		font-size: 2.5rem;
		line-height: 1.2;
		margin-bottom: 2rem;
		text-align: center;
	}

	h2 {
		font-size: 1.5rem;
		margin-top: 3rem;
		margin-bottom: 1rem;
	}

	.lede {
		font-size: 1.25rem;
		line-height: 1.6;
		margin-bottom: 2rem;
		color: var(--color-secondary);
	}

	p {
		margin-bottom: 1.5rem;
		line-height: 1.8;
	}

	hr {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 3rem 0;
	}

	.closing {
		font-size: 0.95rem;
		color: var(--color-secondary);
		font-style: italic;
	}

	@media (max-width: 768px) {
		article {
			padding: 1rem 0;
		}

		h1 {
			font-size: 2rem;
		}

		.lede {
			font-size: 1.1rem;
		}
	}
</style>
