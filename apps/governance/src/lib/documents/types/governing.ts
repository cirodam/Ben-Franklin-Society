import type { DocumentTypeConfig } from '../registry.js';
import type { GoverningDocument, SeniorityLevel } from '@bfs/types';

/**
 * Seniority level labels.
 */
const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
	charter: 'Charter',
	constitution: 'Constitution',
	bylaw: 'Bylaw',
	ordinance: 'Ordinance',
	regulation: 'Regulation',
	policy: 'Policy',
};

/**
 * Get the display label for a seniority level.
 */
export function getSeniorityLabel(seniority: SeniorityLevel): string {
	return SENIORITY_LABELS[seniority];
}

/**
 * Get CSS class variant for seniority badge.
 */
export function getSeniorityVariant(seniority: SeniorityLevel): string {
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

	statuses: ['draft', 'enacted', 'repealed', 'sunsetted'] as const,

	detailRoute: (doc) => `/library/${doc.slug}`,

	// loadBySlug removed - use library.ts loaders directly on server

	getSubtitle: (doc) => {
		// Check if it's a LibraryItemSummary (has metadata) or LibraryDocument (has content)
		if ('metadata' in doc && doc.metadata?.seniority) {
			return getSeniorityLabel(doc.metadata.seniority as SeniorityLevel);
		}
		if ('content' in doc && doc.content?.seniority) {
			return getSeniorityLabel(doc.content.seniority);
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
