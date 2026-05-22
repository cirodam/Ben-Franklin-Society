import type { DocumentTypeConfig } from '../registry.js';
import type { ProseDocument } from '@bfs/types';

/**
 * Document type configuration for prose documents.
 * General-purpose documents with paragraphs of text.
 */
export const proseDocType: DocumentTypeConfig<ProseDocument['content']> = {
	type: 'prose',
	label: 'Document',
	pluralLabel: 'Documents',
	icon: '📄',
	directory: 'prose',

	statuses: ['draft', 'published', 'archived'] as const,

	detailRoute: (doc) => `/library/${doc.slug}`,

	// loadBySlug removed - use library.ts loaders directly on server

	getSubtitle: (doc) => {
		// Check if it's a LibraryItemSummary (has metadata) or LibraryDocument (has content)
		let paragraphCount = 0;
		
		if ('metadata' in doc && typeof doc.metadata?.paragraph_count === 'number') {
			paragraphCount = doc.metadata.paragraph_count;
		} else if ('content' in doc && Array.isArray(doc.content?.paragraphs)) {
			paragraphCount = doc.content.paragraphs.length;
		}

		return paragraphCount === 1 ? '1 paragraph' : `${paragraphCount} paragraphs`;
	},

	getStatusClass: (status) => `status--${status}`,

	canCreate: () => true, // Anyone can create prose documents

	canEdit: (person, doc) => {
		// Only owner can edit
		return person.uuid === doc.owner_uuid;
	},

	canView: (person, doc) => {
		// Check if it's a LibraryItemSummary (has metadata) or LibraryDocument (has content)
		let status: string | undefined;
		
		if ('metadata' in doc && doc.metadata?.status) {
			status = doc.metadata.status;
		} else if ('content' in doc && doc.content?.status) {
			status = doc.content.status;
		}

		// Published documents are public, drafts/archived only visible to owner
		return status === 'published' || person.uuid === doc.owner_uuid;
	},
};
