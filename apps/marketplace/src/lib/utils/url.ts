/**
 * URL building utilities for filter and pagination URLs
 */

/**
 * Filter parameters for classified listings
 */
export interface ClassifiedFilters {
	category?: string;
	keyword?: string;
	minPrice?: number;
	maxPrice?: number;
	negotiable?: boolean;
	scope?: string;
	page?: number;
}

/**
 * Filter parameters for service listings
 */
export interface ServiceFilters {
	category?: string;
	keyword?: string;
	scope?: string;
	page?: number;
}

/**
 * Build a URL with filter parameters for classified listings
 * @param basePath Base path (e.g., '/classifieds')
 * @param currentFilters Current filter state
 * @param overrides Filter overrides
 * @returns URL with query parameters
 */
export function buildClassifiedUrl(
	basePath: string,
	currentFilters: ClassifiedFilters,
	overrides: Partial<ClassifiedFilters> = {}
): string {
	const filters = { ...currentFilters, ...overrides };
	const params = new URLSearchParams();

	if (filters.category) params.set('category', filters.category);
	if (filters.keyword) params.set('keyword', filters.keyword);
	if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
	if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
	if (filters.negotiable) params.set('negotiable', '1');
	if (filters.scope) params.set('scope', filters.scope);
	if (filters.page && filters.page > 1) params.set('page', String(filters.page));

	const query = params.toString();
	return query ? `${basePath}?${query}` : basePath;
}

/**
 * Build a URL with filter parameters for service listings
 * @param basePath Base path (e.g., '/services')
 * @param currentFilters Current filter state
 * @param overrides Filter overrides
 * @returns URL with query parameters
 */
export function buildServiceUrl(
	basePath: string,
	currentFilters: ServiceFilters,
	overrides: Partial<ServiceFilters> = {}
): string {
	const filters = { ...currentFilters, ...overrides };
	const params = new URLSearchParams();

	if (filters.category) params.set('category', filters.category);
	if (filters.keyword) params.set('keyword', filters.keyword);
	if (filters.scope) params.set('scope', filters.scope);
	if (filters.page && filters.page > 1) params.set('page', String(filters.page));

	const query = params.toString();
	return query ? `${basePath}?${query}` : basePath;
}
