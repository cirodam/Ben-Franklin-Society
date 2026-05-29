<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Badge, Breadcrumb, Button, Card, Modal, PageHeader, Select, Input } from '@bfs/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Modal state
	let showAddSkillModal = $state(false);
	let showEditSkillModal = $state(false);
	let showAddToolModal = $state(false);
	let showEditToolModal = $state(false);

	let selectedSkillUuid = $state('');
	let selectedToolUuid = $state('');
	let editingSkill = $state<any>(null);
	let editingTool = $state<any>(null);

	// Get registered skill/tool UUIDs for filtering
	const registeredSkillUuids = $derived(new Set(data.personSkills.map(s => s.skill_uuid)));
	const registeredToolUuids = $derived(new Set(data.personTools.map(t => t.tool_uuid)));

	const availableSkills = $derived(data.allSkills.filter(s => !registeredSkillUuids.has(s.uuid)));
	const availableTools = $derived(data.allTools.filter(t => !registeredToolUuids.has(t.uuid)));

	function openEditSkill(skill: any) {
		editingSkill = skill;
		showEditSkillModal = true;
	}

	function openEditTool(tool: any) {
		editingTool = tool;
		showEditToolModal = true;
	}

	function getProficiencyBadge(proficiency: string | null) {
		if (!proficiency) return null;
		const variants = {
			beginner: 'neutral',
			intermediate: 'accent',
			expert: 'success'
		};
		return { label: proficiency.charAt(0).toUpperCase() + proficiency.slice(1), variant: variants[proficiency as keyof typeof variants] as 'neutral' | 'accent' | 'success' };
	}
</script>

<div class="page">
	<Breadcrumb items={[{ label: '← Back to Profile', href: '/me' }]} />
	
	<PageHeader title="Emergency Registry" />

	<Card>
		<div class="info-section">
			<h2 class="info-title">How the Emergency Registry Works</h2>
			
			<p class="info-text">
				In times of emergency—natural disasters, infrastructure failures, or other crises—our community's ability to 
				coordinate and support one another depends on knowing what skills and resources are available. The Emergency 
				Registry helps match needs with capabilities when it matters most.
			</p>

			<div class="info-principles">
				<div class="principle">
					<h3>Voluntary Participation</h3>
					<p>
						Registration is completely voluntary. You choose what to share, and you can update or remove 
						your registrations at any time. There is no obligation to register anything.
					</p>
				</div>

				<div class="principle">
					<h3>Flexible & Conditional</h3>
					<p>
						Your registration is not an unconditional commitment. Use the "available" toggle to indicate 
						when you can help. Add notes to specify conditions, limitations, or preferences 
						(e.g., "available weekends only," "requires advance notice," "can help with training but not fieldwork").
					</p>
				</div>

				<div class="principle">
					<h3>Community Collaboration</h3>
					<p>
						Emergency coordinators use this registry to understand community capabilities, not to make demands. 
						We work together to find the best possible balance between community needs and individual circumstances. 
						Your time, energy, and resources are valued, and the community respects your boundaries.
					</p>
				</div>
			</div>

			<p class="info-footer">
				<strong>Privacy Note:</strong> Emergency coordinators and committee members can search this registry during 
				emergencies. Only the information you choose to register will be visible. Your location data (if provided on 
				your profile) may be used to coordinate local response efforts.
			</p>
		</div>
	</Card>

	<Card>
		<div class="section-header">
			<h2>Emergency Skills</h2>
			<Button size="sm" onclick={() => showAddSkillModal = true} disabled={availableSkills.length === 0}>
				+ Add Skill
			</Button>
		</div>

		{#if data.personSkills.length === 0}
			<p class="empty-state">No skills registered yet. Add your first skill to get started.</p>
		{:else}
			<div class="items-list">
				{#each data.personSkills as skill}
					<div class="item-card">
						<div class="item-header">
							<div>
								<h3 class="item-name">{skill.skill_name}</h3>
								{#if skill.skill_category}
									<span class="item-category">{skill.skill_category}</span>
								{/if}
							</div>
							<div class="item-badges">
								{#if getProficiencyBadge(skill.proficiency)}
									<Badge label={getProficiencyBadge(skill.proficiency)!.label} variant={getProficiencyBadge(skill.proficiency)!.variant} />
								{/if}
								<Badge label={skill.available ? 'Available' : 'Unavailable'} variant={skill.available ? 'success' : 'warn'} />
							</div>
						</div>
						{#if skill.notes}
							<p class="item-notes">{skill.notes}</p>
						{/if}
						<div class="item-actions">
							<Button size="sm" variant="ghost" onclick={() => openEditSkill(skill)}>Edit</Button>
							<form method="POST" action="?/removeSkill" use:enhance>
								<input type="hidden" name="skill_uuid" value={skill.skill_uuid} />
								<Button size="sm" variant="danger" type="submit">Remove</Button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	<Card>
		<div class="section-header">
			<h2>Emergency Tools & Equipment</h2>
			<Button size="sm" onclick={() => showAddToolModal = true} disabled={availableTools.length === 0}>
				+ Add Tool
			</Button>
		</div>

		{#if data.personTools.length === 0}
			<p class="empty-state">No tools registered yet. Add your first tool to get started.</p>
		{:else}
			<div class="items-list">
				{#each data.personTools as tool}
					<div class="item-card">
						<div class="item-header">
							<div>
								<h3 class="item-name">{tool.tool_name}</h3>
								{#if tool.tool_category}
									<span class="item-category">{tool.tool_category}</span>
								{/if}
							</div>
							<div class="item-badges">
								{#if tool.quantity}
									<Badge label={`Qty: ${tool.quantity}`} variant="neutral" />
								{/if}
								<Badge label={tool.available ? 'Available' : 'Unavailable'} variant={tool.available ? 'success' : 'warn'} />
							</div>
						</div>
						{#if tool.notes}
							<p class="item-notes">{tool.notes}</p>
						{/if}
						<div class="item-actions">
							<Button size="sm" variant="ghost" onclick={() => openEditTool(tool)}>Edit</Button>
							<form method="POST" action="?/removeTool" use:enhance>
								<input type="hidden" name="tool_uuid" value={tool.tool_uuid} />
								<Button size="sm" variant="danger" type="submit">Remove</Button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>
</div>

<!-- Add Skill Modal -->
<Modal bind:open={showAddSkillModal} title="Add Emergency Skill" size="md">
	<form method="POST" action="?/addSkill" use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				showAddSkillModal = false;
				selectedSkillUuid = '';
			}
		};
	}}>
		<div class="modal-content">
			<Select
				name="skill_uuid"
				label="Skill"
				required
				bind:value={selectedSkillUuid}
			>
				<option value="">Select a skill...</option>
				{#each availableSkills as skill}
					<option value={skill.uuid}>{skill.name} {skill.category ? `(${skill.category})` : ''}</option>
				{/each}
			</Select>

			<Select
				name="proficiency"
				label="Proficiency Level"
			>
				<option value="">Not specified</option>
				<option value="beginner">Beginner</option>
				<option value="intermediate">Intermediate</option>
				<option value="expert">Expert</option>
			</Select>

			<Input
				name="notes"
				label="Notes"
				type="text"
				placeholder="e.g., Available weekends only, requires 24hr notice, certification expires 2030"
				hint="Specify any conditions, limitations, or important details about your availability"
			/>
		</div>

		<div class="modal-actions">
			<Button variant="ghost" type="button" onclick={() => showAddSkillModal = false}>Cancel</Button>
			<Button type="submit">Add Skill</Button>
		</div>
	</form>
</Modal>

<!-- Edit Skill Modal -->
{#if editingSkill}
	<Modal bind:open={showEditSkillModal} title="Edit {editingSkill.skill_name}" size="md">
		<form method="POST" action="?/updateSkill" use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success') {
					showEditSkillModal = false;
					editingSkill = null;
				}
			};
		}}>
			<input type="hidden" name="skill_uuid" value={editingSkill.skill_uuid} />
			
			<div class="modal-content">
				<Select
					name="proficiency"
					label="Proficiency Level"
					value={editingSkill.proficiency || ''}
				>
					<option value="">Not specified</option>
					<option value="beginner">Beginner</option>
					<option value="intermediate">Intermediate</option>
					<option value="expert">Expert</option>
				</Select>

				<Input
					name="notes"
					label="Notes"
					type="text"
					value={editingSkill.notes || ''}
					placeholder="e.g., Available weekends only, requires 24hr notice, certification expires 2030"
					hint="Specify any conditions, limitations, or important details about your availability"
				/>

				<label class="checkbox-label">
					<input type="checkbox" name="available" value="true" checked={editingSkill.available} />
					<span>Currently available</span>
				</label>
			</div>

			<div class="modal-actions">
				<Button variant="ghost" type="button" onclick={() => showEditSkillModal = false}>Cancel</Button>
				<Button type="submit">Save Changes</Button>
			</div>
		</form>
	</Modal>
{/if}

<!-- Add Tool Modal -->
<Modal bind:open={showAddToolModal} title="Add Emergency Tool/Equipment" size="md">
	<form method="POST" action="?/addTool" use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				showAddToolModal = false;
				selectedToolUuid = '';
			}
		};
	}}>
		<div class="modal-content">
			<Select
				name="tool_uuid"
				label="Tool/Equipment"
				required
				bind:value={selectedToolUuid}
			>
				<option value="">Select a tool...</option>
				{#each availableTools as tool}
					<option value={tool.uuid}>{tool.name} {tool.category ? `(${tool.category})` : ''}</option>
				{/each}
			</Select>

			<Input
				name="quantity"
				label="Quantity"
				type="number"
				min="1"
				placeholder="1"
				hint="Number of units available (optional)"
			/>

			<Input
				name="notes"
				label="Notes"
				type="text"
				placeholder="e.g., 5000W generator, requires fuel, can transport within 10 miles"
				hint="Specify conditions, limitations, or details about availability and use"
			/>
		</div>

		<div class="modal-actions">
			<Button variant="ghost" type="button" onclick={() => showAddToolModal = false}>Cancel</Button>
			<Button type="submit">Add Tool</Button>
		</div>
	</form>
</Modal>

<!-- Edit Tool Modal -->
{#if editingTool}
	<Modal bind:open={showEditToolModal} title="Edit {editingTool.tool_name}" size="md">
		<form method="POST" action="?/updateTool" use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success') {
					showEditToolModal = false;
					editingTool = null;
				}
			};
		}}>
			<input type="hidden" name="tool_uuid" value={editingTool.tool_uuid} />
			
			<div class="modal-content">
				<Input
					name="quantity"
					label="Quantity"
					type="number"
					min="1"
					value={editingTool.quantity || ''}
					placeholder="1"
					hint="Number of units available (optional)"
				/>

				<Input
					name="notes"
					label="Notes"
					type="text"
					value={editingTool.notes || ''}
					placeholder="e.g., 5000W generator, requires fuel, can transport within 10 miles"
					hint="Specify conditions, limitations, or details about availability and use"
				/>

				<label class="checkbox-label">
					<input type="checkbox" name="available" value="true" checked={editingTool.available} />
					<span>Currently available</span>
				</label>
			</div>

			<div class="modal-actions">
				<Button variant="ghost" type="button" onclick={() => showEditToolModal = false}>Cancel</Button>
				<Button type="submit">Save Changes</Button>
			</div>
		</form>
	</Modal>
{/if}

<style>
	.page {
		max-width: 880px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.info-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.info-title {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		margin: 0;
		color: var(--text-primary);
	}

	.info-text {
		margin: 0;
		line-height: 1.6;
		color: var(--text-secondary);
	}

	.info-principles {
		display: grid;
		gap: var(--space-4);
		margin: var(--space-2) 0;
	}

	.principle {
		padding: var(--space-4);
		background: var(--surface-subtle);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--border-accent);
	}

	.principle h3 {
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		margin: 0 0 var(--space-2) 0;
		color: var(--text-primary);
	}

	.principle p {
		margin: 0;
		line-height: 1.5;
		color: var(--text-secondary);
		font-size: var(--text-sm);
	}

	.info-footer {
		margin: 0;
		padding: var(--space-3);
		background: var(--surface-info);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-info);
		font-size: var(--text-sm);
		line-height: 1.5;
		color: var(--text-secondary);
	}

	.info-footer strong {
		color: var(--text-primary);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
	}

	.section-header h2 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	.empty-state {
		padding: var(--space-8) var(--space-4);
		text-align: center;
		color: var(--text-secondary);
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.item-card {
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		background: var(--surface);
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
	}

	.item-name {
		margin: 0;
		font-size: var(--text-md);
		font-weight: var(--weight-medium);
	}

	.item-category {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}

	.item-badges {
		display: flex;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.item-notes {
		margin: var(--space-2) 0;
		font-size: var(--text-sm);
		color: var(--text-secondary);
		font-style: italic;
	}

	.item-actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--border);
	}

	.modal-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4) 0;
	}

	.modal-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-4);
		border-top: 1px solid var(--border);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.checkbox-label span {
		font-size: var(--text-md);
	}
</style>
