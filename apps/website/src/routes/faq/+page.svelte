<svelte:head>
	<title>FAQ - Ben Franklin Society</title>
	<meta
		name="description"
		content="Frequently asked questions about the Ben Franklin Society governance platform."
	/>
</svelte:head>

<article>
	<h1>Frequently Asked Questions</h1>

	<div class="question">
		<h2>Is this left-wing or right-wing?</h2>
		<p>
			Neither. It's a governance structure, not a political ideology. The system doesn't tell
			communities what to decide—it provides a way to make decisions together.
		</p>
	</div>

	<div class="question">
		<h2>Is this a computer program?</h2>
		<p>
			There is a computer program—software designed to help organize and coordinate. It tracks
			membership, runs sortition, manages deliberation, records decisions, handles authentication.
		</p>
		<p>
			But the institutions we're building should live in the real world. A Ben Franklin Society is
			people who know each other, meet together, deliberate face-to-face, and make collective
			decisions about how to live. The software is an organizing tool, not a replacement for real
			community.
		</p>
		<p>
			Think of it like a ledger or record book. It's useful infrastructure, but the actual work
			happens between people, in the real world.
		</p>
	</div>

	<div class="question">
		<h2>Who runs the software?</h2>
		<p>
			You do. Each community runs its own instance on its own infrastructure. There is no vendor,
			no platform company, no central authority that can impose terms or extract rent.
		</p>
		<p>
			The software is open-source. You can inspect it, modify it, fork it. The data belongs to your
			community—it lives in your database, on your server. If you want to move to different
			infrastructure, you can. If you want to change how it works, you can.
		</p>
		<p>
			This is about sovereignty. You're not a user of someone else's platform. You're running your
			own infrastructure for your own community.
		</p>
	</div>

	<div class="question">
		<h2>Who is in charge?</h2>
		<p>
			Nobody, permanently. The General Assembly—randomly selected citizens serving fixed terms—makes
			legislative decisions. Services, Colleges, and Committees have coordinators, but those roles
			rotate. Everyone cycles back to regular life.
		</p>
		<p>
			This is the point. Power doesn't accumulate. There's no permanent ruling class, no political
			elite, no one whose career depends on maintaining power. You govern for a term, then you live
			under the decisions you made.
		</p>
		<p>
			The structure itself prevents the formation of a professional political class. That's not a
			bug—it's the entire design.
		</p>
	</div>

	<div class="question">
		<h2>What is a mutual aid society?</h2>
		<p>
			A voluntary association where people pool resources and help each other through collective
			action. Not charity—mutual support. Members contribute what they can and draw on the
			collective when they need help.
		</p>
		<p>
			In early 20th century America, mutual aid societies were everywhere. The Odd Fellows, the
			Grange, fraternal lodges, ethnic associations, union halls, neighborhood cooperatives. They
			provided healthcare, unemployment insurance, funeral benefits, education, and community
			support—all organized and governed by the members themselves.
		</p>
		<p>
			These weren't utopian experiments. They were practical survival strategies built on
			democratic self-governance. Millions of Americans relied on them before the welfare state and
			corporate employment became the dominant systems.
		</p>
		<p>
			When the Depression hit, mutual aid societies were often more responsive than government
			programs—because they were locally controlled and directly accountable to their members.
		</p>
	</div>

	<div class="question">
		<h2>Should I start a society or join one?</h2>
		<p>
			Join one if it exists near you. But most don't exist yet. This software is experimental and
			there aren't established Ben Franklin Societies to join.
		</p>
		<p>
			If you want to start one, you need a community first. You don't create a society to find
			people—you create a society from people who already know each other and want to govern
			themselves together. An existing mutual aid network, an intentional community, a worker
			cooperative, a neighborhood organization.
		</p>
		<p>
			Starting from scratch means building relationships first. Governance structure comes after
			trust and shared purpose, not before.
		</p>
		<p>
			If you're alone and looking for people: look for local mutual aid networks, cooperative
			housing projects, community land trusts, or other groups practicing collective action. Find
			people who are already building alternatives, then talk about governance.
		</p>
	</div>

	<div class="question">
		<h2>Why "Ben Franklin Society"?</h2>
		<p>
			Benjamin Franklin championed mutual aid societies—voluntary associations where people pooled
			resources and governed themselves democratically. The Odd Fellows, the Grange, fraternal
			lodges, neighborhood cooperatives. These organizations sustained millions of Americans through
			genuine hardship by practicing collective self-governance as practical necessity, not
			political theory.
		</p>
		<p>The motto—"The Work Shall Not Be Lost"—means what you build matters. The record remains.</p>
	</div>
</article>

<style>
	article {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 0;
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 3rem;
		text-align: center;
	}

	.question {
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--color-border);
	}

	.question:last-child {
		border-bottom: none;
	}

	.question h2 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		margin-top: 0;
	}

	.question p {
		margin-bottom: 1rem;
		line-height: 1.8;
	}

	.question p:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 768px) {
		article {
			padding: 1rem 0;
		}

		h1 {
			font-size: 2rem;
		}
	}
</style>
