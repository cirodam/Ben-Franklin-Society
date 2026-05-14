import type { Motion } from '$lib/server/motions.js';
import type { Association } from '$lib/server/associations.js';

/**
 * Format a motion identifier with its body abbreviation and number
 * Examples: "GA 13442", "AGCOM 5", "Motion #123" (if no abbreviation)
 */
export function formatMotionId(motion: Motion, body: Association | { abbreviation: string | null }): string {
	if (body.abbreviation) {
		return `${body.abbreviation} ${motion.motion_number}`;
	}
	return `Motion #${motion.motion_number}`;
}

/**
 * Format a full motion display with identifier and title
 * Example: "GA 13442 - Motion to Establish Agricultural Service"
 */
export function formatMotionFull(motion: Motion, body: Association | { abbreviation: string | null }): string {
	const id = formatMotionId(motion, body);
	return `${id} - ${motion.title}`;
}
