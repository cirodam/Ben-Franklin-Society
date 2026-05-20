import type { DocumentTypeConfig } from '../registry.js';
import type { MotionDocument } from '$lib/server/documents/library-types.js';

/**
 * Document type configuration for motions.
 */
export const motionDocType: DocumentTypeConfig<MotionDocument['content']> = {
	type: 'motion',
	label: 'Motion',
	pluralLabel: 'Motions',
	icon: '📋',
	directory: 'motions',

	statuses: [
		'draft',
		'introduced',
		'deliberation',
		'adopted',
		'enacted',
		'rejected',
		'withdrawn',
	] as const,

	detailRoute: (doc) => `/library/${doc.slug}`,

	// loadBySlug removed - use library.ts loaders directly on server

	getSubtitle: (doc) => {
		// Check if it's a LibraryItemSummary or LibraryDocument
		let provisionCount = 0;
		
		if ('content' in doc && Array.isArray(doc.content?.provisions)) {
			provisionCount = doc.content.provisions.length;
		}

		if (provisionCount === 0) {
			return 'Motion';
		}
		return provisionCount === 1 ? '1 provision' : `${provisionCount} provisions`;
	},

	getStatusClass: (status) => `status--${status}`,

	canCreate: () => true, // TODO: Add permission checks (e.g., must be member)

	canEdit: (person, doc) => {
		// Only introducer can edit drafts
		return (
			doc.content.status === 'draft' &&
			(person.uuid === doc.owner_uuid || person.uuid === doc.content.introducer_uuid)
		);
	},

	canView: () => true, // All motions are public once introduced
};
