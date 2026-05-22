/**
 * Formatting utilities for marketplace listings
 */

/**
 * Format a price with optional negotiable flag
 * @param price Price in Franks
 * @param negotiable Whether price is negotiable (0 or 1)
 * @returns Formatted price string
 */
export function formatPrice(price: number, negotiable: number): string {
	if (price === 0) return 'Free';
	return `${price} F${negotiable ? ' (negotiable)' : ''}`;
}

/**
 * Format a price with optional negotiable flag (abbreviated version)
 * @param price Price in Franks
 * @param negotiable Whether price is negotiable (0 or 1)
 * @returns Formatted price string with abbreviated negotiable indicator
 */
export function formatPriceShort(price: number, negotiable: number): string {
	if (price === 0) return 'Free';
	return `${price} F${negotiable ? ' (neg.)' : ''}`;
}

/**
 * Format a service rate with unit
 * @param rate Rate in Franks
 * @param unit Rate unit (per_hour, per_job, or negotiable)
 * @returns Formatted rate string
 */
export function formatRate(rate: number, unit: string): string {
	if (unit === 'negotiable' || rate === 0) return 'Negotiable';
	const label = unit === 'per_hour' ? '/hr' : unit === 'per_job' ? '/job' : `/${unit.replace('per_', '')}`;
	return `${rate} F${label}`;
}

/**
 * Format a service rate for display (alternative formatting)
 * @param rate Rate in Franks
 * @param unit Rate unit
 * @returns Formatted rate string
 */
export function formatRateDisplay(rate: number, unit: string): string {
	if (unit === 'negotiable' || rate === 0) return 'Negotiable';
	return `${rate} F/${unit.replace('per_', '')}`;
}

/**
 * Format a date for display
 * @param isoDate ISO date string
 * @returns Formatted date string
 */
export function formatDate(isoDate: string): string {
	return new Date(isoDate).toLocaleDateString([], { dateStyle: 'medium' });
}
