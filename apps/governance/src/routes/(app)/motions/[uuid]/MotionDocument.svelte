<script lang="ts">
	import { Parchment } from '@bfs/ui';
	import MotionHeader from './MotionHeader.svelte';
	import MotionBody from './MotionBody.svelte';

	type Body = {
		uuid: string;
		name: string;
		abbreviation: string | null;
	};

	type Person = {
		uuid: string;
		given_name: string;
		family_name: string;
	};

	type Motion = {
		uuid: string;
		motion_number: number;
		title: string;
		body: string;
		reasoning?: string | null;
		clerk_notes?: string | null;
		parliamentarian_notes?: string | null;
		created_at: string;
		status: string;
	};

	type Rule = {
		uuid: string;
		name: string;
		numerator: number;
		denominator: number;
	};

	type DeliberationRule = {
		uuid: string;
		name: string;
		minimum_days: number;
	};

	let {
		motion,
		body = null,
		introducer = null,
		currentRule = null,
		currentDeliberationRule = null
	}: {
		motion: Motion;
		body?: Body | null;
		introducer?: Person | null;
		currentRule?: Rule | null;
		currentDeliberationRule?: DeliberationRule | null;
	} = $props();
</script>

<Parchment>
	<MotionHeader 
		{motion} 
		{body} 
		{introducer} 
		{currentRule} 
		{currentDeliberationRule} 
	/>
	<MotionBody {motion} />
</Parchment>
