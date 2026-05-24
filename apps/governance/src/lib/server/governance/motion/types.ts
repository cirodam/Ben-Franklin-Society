/**
 * Type definitions for the motion system
 */

// Re-export types from @bfs/types
export type { MotionDocument, MotionContent, MotionStatus } from '@bfs/types';

export type VoteChoice = 'aye' | 'nay' | 'abstain';

// Allowed status transitions for motions
export const ALLOWED_TRANSITIONS: Partial<Record<string, string[]>> = {
	draft: ['introduced', 'withdrawn'],
	introduced: ['deliberation', 'withdrawn'],
	deliberation: ['voting', 'withdrawn'],
	voting: ['withdrawn'], // voting → adopted/rejected goes through vote session finalization
	adopted: ['enacted', 'withdrawn'], // adopted → enacted when clerk confirms implementation
};
