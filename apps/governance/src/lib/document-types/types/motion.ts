import type { DocumentTypeConfig } from '../registry.js';
import type { MotionDocument } from '$lib/server/library-types.js';

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
		'repealed',
	] as const,

	detailRoute: (doc) => `/motions/${doc.uuid}`,

	getSubtitle: (doc) => {
		// Check if it's a LibraryItemSummary (has metadata) or LibraryDocument (has content)
		let motionNumber: string | undefined;
		
		if ('metadata' in doc && doc.metadata?.motion_number) {
			motionNumber = doc.metadata.motion_number;
		} else if ('content' in doc && doc.content?.motion_number) {
			motionNumber = doc.content.motion_number;
		}

		return motionNumber || 'Motion';
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
