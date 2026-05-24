/**
 * Formatting utilities for the library app
 */

/**
 * Format an ISO date string to a localized date string
 */
export function formatDate(isoString: string): string {
	return new Date(isoString).toLocaleDateString();
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
