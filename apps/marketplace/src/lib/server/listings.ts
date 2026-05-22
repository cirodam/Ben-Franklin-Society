/**
 * Legacy facade for backward compatibility
 * Re-exports from the new modular structure
 */

// Classifieds
export {
	type ClassifiedListing,
	type ClassifiedOpts,
	type CreateClassifiedOpts,
	type UpdateClassifiedOpts,
} from './classifieds/types.js';
export {
	getClassifieds,
	getClassified,
	getMyClassifieds,
	getRecentClassifieds,
	getActiveClassifiedsBySeller,
} from './classifieds/queries.js';
export { createClassified, updateClassified, withdrawClassified } from './classifieds/mutations.js';

// Services
export {
	type ServiceListing,
	type ServiceOpts,
	type CreateServiceOpts,
	type UpdateServiceOpts,
} from './services/types.js';
export {
	getServices,
	getService,
	getMyServices,
	getRecentServices,
	getActiveServicesByProvider,
} from './services/queries.js';
export { createService, updateService, withdrawService } from './services/mutations.js';

// Suspension
export { isSellerSuspended } from './suspension.js';

// Combined queries (used in some routes)
import { getActiveClassifiedsBySeller } from './classifieds/queries.js';
import { getActiveServicesByProvider } from './services/queries.js';
import type { ClassifiedListing } from './classifieds/types.js';
import type { ServiceListing } from './services/types.js';

/**
 * Get all active listings by a principal (both classifieds and services)
 */
export function getListingsByPrincipal(owner_uuid: string): {
	classifieds: ClassifiedListing[];
	services: ServiceListing[];
} {
	return {
		classifieds: getActiveClassifiedsBySeller(owner_uuid),
		services: getActiveServicesByProvider(owner_uuid),
	};
}

