<script lang="ts">
	import { Card } from '@bfs/ui';

	type Section = {
		uuid: string;
		name: string;
		description: string | null;
		parent_section_uuid: string | null;
	};

	let { sections }: { sections: Section[] } = $props();

	// Build hierarchy - sections with parent_section_uuid are children
	const rootSections = $derived(sections.filter(s => !s.parent_section_uuid));
	const childSections = $derived.by(() => {
		const map = new Map<string, Section[]>();
		for (const section of sections) {
			if (section.parent_section_uuid) {
				if (!map.has(section.parent_section_uuid)) {
					map.set(section.parent_section_uuid, []);
				}
				map.get(section.parent_section_uuid)!.push(section);
			}
		}
		return map;
	});
</script>

{#if sections.length > 0}
	<Card>
		<h2>Sections <span class="count">{sections.length}</span></h2>
		<div class="sections-list">
			{#each rootSections as section}
				<div class="section-group">
					<a href="/sections/{section.uuid}" class="section">
						<div class="section-content">
							<h3 class="section-name">{section.name}</h3>
							{#if section.description}
								<p class="section-description">{section.description}</p>
							{/if}
						</div>
						<span class="section-arrow">→</span>
					</a>
					{#if childSections.has(section.uuid)}
						<div class="subsections">
							{#each childSections.get(section.uuid) ?? [] as child}
								<a href="/sections/{child.uuid}" class="section subsection">
									<div class="section-content">
										<h4 class="section-name">{child.name}</h4>
										{#if child.description}
											<p class="section-description">{child.description}</p>
										{/if}
									</div>
									<span class="section-arrow">→</span>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</Card>
{/if}

<style>
	:global(.card h2) {
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		margin-bottom: var(--space-4);
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.count {
		font-size: var(--text-xs);
		font-weight: var(--weight-normal);
		color: var(--color-text-muted);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		padding: 1px 8px;
	}

	.sections-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.section-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.section {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-4);
		text-decoration: none;
		color: inherit;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		transition: all 0.2s ease;
	}

	.section:hover {
		border-color: var(--color-primary, #0066cc);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.section-content {
		flex: 1;
	}

	.section-arrow {
		font-size: var(--text-xl);
		color: var(--color-text-muted);
		transition: transform 0.2s ease, color 0.2s ease;
	}

	.section:hover .section-arrow {
		color: var(--color-primary, #0066cc);
		transform: translateX(4px);
	}

	.subsection {
		background: var(--color-surface);
		border-left: 3px solid var(--color-border);
	}

	.subsections {
		margin-left: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.section-name {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		margin-bottom: var(--space-2);
		color: var(--color-text);
	}

	.subsection .section-name {
		font-size: var(--text-xs);
	}

	.section-description {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: 1.5;
		margin: 0;
	}

	.subsection .section-description {
		font-size: var(--text-xs);
	}
</style>
