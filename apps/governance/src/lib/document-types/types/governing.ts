import type { DocumentTypeConfig } from '../registry.js';
import type { GoverningDocument } from '$lib/server/library-types.js';

/**
 * Seniority levels for governing documents.
 */
const SENIORITY_NAMES: Record<number, string> = {
	1: 'Charter',
	2: 'Constitution',
	3: 'Bylaw',
	4: 'Ordinance',
	5: 'Regulation',
	6: 'Policy',
};

/**
 * Get the name of a seniority level.
 */
export function getSeniorityName(seniority: number): string {
	return SENIORITY_NAMES[seniority] || `Seniority ${seniority}`;
}

/**
 * Get CSS class variant for seniority badge.
 */
export function getSeniorityVariant(seniority: number): string {
	return `seniority--${seniority}`;
}

/**
 * Document type configuration for governing documents.
 */
export const governingDocType: DocumentTypeConfig<GoverningDocument['content']> = {
	type: 'governing',
	label: 'Governing Document',
	pluralLabel: 'Governing Documents',
	icon: '📜',
	directory: 'governing',

	statuses: ['draft', 'adopted', 'repealed'] as const,

	detailRoute: (doc) => `/library/${doc.slug}`,

	loadBySlug: async (slug) => {
		const { loadGoverningDocument } = await import('$lib/server/library.js');
		return loadGoverningDocument(slug);
	},

	getSubtitle: (doc) => {
		// Check if it's a LibraryItemSummary (has metadata) or LibraryDocument (has content)
		if ('metadata' in doc && doc.metadata?.seniority) {
			return getSeniorityName(doc.metadata.seniority);
		}
		if ('content' in doc && doc.content?.seniority) {
			return getSeniorityName(doc.content.seniority);
		}
		return 'Governing Document';
	},

	getStatusClass: (status) => `status--${status}`,

	canCreate: () => true, // TODO: Add permission checks

	canEdit: (person, doc) => {
		// Only drafts can be edited, or by specific permission
		return doc.content.status === 'draft' || person.uuid === doc.owner_uuid;
	},

	canView: () => true, // All governing documents are public
};
