/**
 * Format a date relative to now.
 * - If today: shows time (e.g., "2:30 PM")
 * - Otherwise: shows date (e.g., "Jan 15")
 */
export function formatRelativeDate(iso: string | null): string {
	if (!iso) return '';
	const d = new Date(iso);
	const now = new Date();
	if (d.toDateString() === now.toDateString()) {
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
	return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Format a date and time.
 * Example: "Jan 15, 2026, 2:30 PM"
 */
export function formatDateTime(iso: string | null): string {
	if (!iso) return '';
	return new Date(iso).toLocaleString([], {
		dateStyle: 'medium',
		timeStyle: 'short'
	});
}

/**
 * Format a date with long style.
 * Example: "January 15, 2026"
 */
export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString([], { dateStyle: 'long' });
}

/**
 * Format just the time.
 * Example: "2:30 PM"
 */
export function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit'
	});
}
