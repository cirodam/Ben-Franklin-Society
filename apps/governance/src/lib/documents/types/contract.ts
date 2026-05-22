import type { DocumentTypeConfig } from '../registry.js';
import type { ContractDocument } from '@bfs/types';

/**
 * Document type configuration for contracts.
 * Bilateral agreements between two parties (members or associations).
 */
export const contractDocType: DocumentTypeConfig<ContractDocument['content']> = {
	type: 'contract',
	label: 'Contract',
	pluralLabel: 'Contracts',
	icon: '🤝',
	directory: 'contracts',

	statuses: ['draft', 'active', 'completed', 'terminated'] as const,

	detailRoute: (doc) => `/library/${doc.slug}`,

	// loadBySlug removed - use library.ts loaders directly on server

	getSubtitle: (doc) => {
		// Show the two parties
		let partyA: string | undefined;
		let partyB: string | undefined;

		if ('metadata' in doc) {
			partyA = doc.metadata?.party_a_name;
			partyB = doc.metadata?.party_b_name;
		} else if ('content' in doc) {
			partyA = doc.content?.party_a?.principal_name;
			partyB = doc.content?.party_b?.principal_name;
		}

		if (partyA && partyB) {
			return `${partyA} ↔ ${partyB}`;
		}
		return 'Contract';
	},

	getStatusClass: (status) => `status--${status}`,

	canCreate: (person) => {
		// TODO: Maybe require a permission? For now, allow anyone
		return true;
	},

	canEdit: (person, doc) => {
		// Contracts can only be edited while draft
		// TODO: Maybe restrict to contract parties or admins?
		let status: string | undefined;
		
		if ('metadata' in doc && doc.metadata?.status) {
			status = doc.metadata.status;
		} else if ('content' in doc && doc.content?.status) {
			status = doc.content.status;
		}

		return status === 'draft';
	},

	canView: (person, doc) => {
		// Active and completed contracts are public
		// Drafts visible to everyone for now (could restrict to parties later)
		return true;
	},
};
