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
} from './library-core.js';

// Re-export governing documents
export {
	loadGoverningDocument,
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
} from './library-governing.js';

// Re-export motions
export {
	loadMotion,
	getMotionBySlug,
	getMotionByUuid,
	listMotions,
	createMotion,
	updateMotion,
	updateMotionStatus
} from './library-motions.js';

// Re-export simple documents (prose, contracts, org charts)
export {
	loadProseDocument,
	saveProseDocument,
	loadContract,
	saveContract,
	loadOrgChartDocument,
	listOrgChartDocuments
} from './library-simple-docs.js';

// Re-export types for backward compatibility
export type { Article, Section } from './library-types.js';
export type { GoverningDocContent as GoverningDocContentType } from './library-types.js';

