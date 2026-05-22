/**
 * Library System - Centralized document management
 * 
 * This module re-exports all library functions from their respective modules
 * for backward compatibility. New code should import from the specific modules.
 */

// Re-export core functionality
export {
	searchLibrary,
	getLibraryStats,
	deleteDocument,
	changeDocumentOwner,
	type LibrarySearchOptions,
	type LibraryItemSummary
} from './society-core.js';

// Re-export governing documents
export {
	loadGoverningDocument,
	saveGoverningDocument,
	getDocumentBySlug,
	updateSection,
	addSection,
	deleteSection,
	updateArticle,
	addArticle,
	deleteArticle,
	type DocumentStatus,
	type Document,
	type LegacyDocument
} from './society-governing.js';

// Re-export motions
export {
	loadMotion,
	saveMotion,
	getMotionBySlug,
	getMotionByUuid,
	listMotions,
	createMotion,
	updateMotion,
	updateMotionStatus
} from './society-motions.js';

// Re-export simple documents (prose, contracts, org charts)
export {
	loadProseDocument,
	saveProseDocument,
	loadContract,
	saveContract,
	loadOrgChartDocument,
	listOrgChartDocuments
} from './society-simple-docs.js';

// Re-export types for backward compatibility
export type { Article, Section } from '@bfs/types';
export type { GoverningDocContent as GoverningDocContentType } from '@bfs/types';

