<script lang="ts">
	import { Select } from '@bfs/ui';

	let { name = 'visibility', label = 'Visibility', value = 'members_only' }: {
		name?: string;
		label?: string;
		value?: string;
	} = $props();

	const options = [
		{ value: 'public', label: 'Public — All society members can view' },
		{ value: 'members_only', label: 'Members only — Association members can view (default)' },
		{ value: 'officers_only', label: 'Officers only — Only members with roles can view' }
	];
</script>

<Select {name} {label} {value}>
	{#each options as option}
		<option value={option.value} selected={option.value === value}>{option.label}</option>
	{/each}
</Select>
