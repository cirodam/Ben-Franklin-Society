import type { PageServerLoad } from './$types.js';
import { listMotions } from '$lib/server/governance/motions.js';
import { listAssociations } from '$lib/server/organization/associations.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ url }) => {
	// Get filter parameters from URL
	const statusFilter = url.searchParams.get('status');
	const bodyFilter = url.searchParams.get('body');
	const searchTerm = url.searchParams.get('q')?.toLowerCase();

	// Get all motions with body names
	let motions = listMotions().map((m) => {
		const body = db.prepare('SELECT name FROM association WHERE uuid = ?').get(m.body_uuid) as { name: string } | undefined;
		return { ...m, body_name: body?.name ?? 'Community' };
	});

	// Apply filters
	if (statusFilter) {
		motions = motions.filter((m) => m.status === statusFilter);
	}
	if (bodyFilter) {
		motions = motions.filter((m) => m.body_uuid === bodyFilter);
	}
	if (searchTerm) {
		motions = motions.filter((m) => 
			m.title.toLowerCase().includes(searchTerm) || 
			m.body.toLowerCase().includes(searchTerm)
		);
	}

	// Get all associations for body filter dropdown
	const associations = listAssociations({ status: 'active' });

	return { 
		motions, 
		associations,
		filters: {
			status: statusFilter,
			body: bodyFilter,
			search: searchTerm
		}
	};
};
