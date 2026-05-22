<script lang="ts">
	import type { InjuryType } from '$lib/server/documents/library-types.js';

	interface Props {
		type: InjuryType;
	}

	let { type }: Props = $props();

	const config: Record<
		InjuryType,
		{
			label: string;
			color: string;
		}
	> = {
		physical: {
			label: 'Physical',
			color: 'bg-red-100 text-red-800'
		},
		material: {
			label: 'Material',
			color: 'bg-amber-100 text-amber-800'
		},
		relational: {
			label: 'Relational',
			color: 'bg-purple-100 text-purple-800'
		},
		systemic: {
			label: 'Systemic',
			color: 'bg-blue-100 text-blue-800'
		},
		communal: {
			label: 'Communal',
			color: 'bg-green-100 text-green-800'
		}
	};

	const { label, color } = config[type];
</script>

<span class="inline-block px-2 py-0.5 text-xs font-medium rounded {color}">
	{label}
</span>
