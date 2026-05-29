/**
 * Library System - Centralized document management
 * 
 * This module re-exports all library functions from their respective modules
 * for backward compatibility. New code should import from the specific modules.
 */

// Re-export core functionality
export {
	SOCIETY_CODE_FOLDERS,
	MOTION_STATUSES,
	getSocietyUuid,
	getGoverningFolder,
	getMotionFolder,
	getGoverningStatusFromPath,
	getMotionLocationFromPath,
	getAllBodySlugs,
	moveGoverningDocument,
	moveMotion,
	deleteDocumentFile,
	ensureMotionFolders
} from './society-core.js';

// Re-export governing documents
export {
	loadGoverningDocument,
	saveGoverningDocument,
	getAllGoverningDocs,
	getDocumentBySlug,
	updateSection,
	addSection,
	deleteSection,
	updateArticle,
	addArticle,
	deleteArticle
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
