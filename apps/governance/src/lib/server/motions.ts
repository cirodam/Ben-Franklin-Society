import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { getVoteRuleByUuid, evaluateTally } from './vote_rules.js';
import * as library from './library.js';
import { getActiveMeetingForMotion } from './meetings.js';

// --- Types ---

export type MotionStatus =
	| 'draft'
	| 'introduced'
	| 'deliberation' // Combined deliberation and voting phase
	| 'enacted'
	| 'rejected'
	| 'withdrawn';

export type VoteChoice = 'aye' | 'nay' | 'abstain';

export interface Motion {
	uuid: string;
	slug: string;
	motion_number: number;
	title: string;
	owner_uuid: string; // the association that owns this (typically same as body_uuid)
	body: string;
	reasoning: string | null;
	introduced_by_uuid: string;
	body_uuid: string; // every motion belongs to a body; use the community association for society-wide motions
	deliberation_rule_uuid: string | null;
	vote_rule_uuid: string | null;
	status: MotionStatus;
	clerk_notes: string | null;
	parliamentarian_notes: string | null;
	created_at: string;
	introduced_at: string | null;
	enacted_at: string | null;
	resolved_at: string | null;
	adopted_by_motion_uuid: string | null; // reference to motion that adopted/amended this
	repealed_by_motion_uuid: string | null;
}

export interface VoteTally {
	motion_uuid: string;
	eligible_count: number;
	aye_count: number;
	nay_count: number;
	abstain_count: number;
	opened_at: string;
	closed_at: string | null;
}

export interface MotionComment {
	uuid: string;
	motion_uuid: string;
	author_uuid: string;
	body: string;
	created_at: string;
	edited_at: string | null;
	deleted_at: string | null;
}

// --- Helpers ---

function now(): string {
	return new Date().toISOString();
}

const ALLOWED_TRANSITIONS: Partial<Record<MotionStatus, MotionStatus[]>> = {
	draft: ['introduced', 'withdrawn'],
	introduced: ['deliberation', 'withdrawn'],
	deliberation: ['withdrawn'], // deliberation → enacted/rejected goes through closeVote()
};

// --- Motion queries ---

export function getMotionByUuid(uuid: string): Motion | null {
	return library.getMotionByUuid(uuid);
}

export function getMotionBySlug(slug: string): Motion | null {
	return library.getMotionBySlug(slug);
}

export function listMotions(opts: {
	bodyUuid?: string;
	status?: MotionStatus;
} = {}): Motion[] {
	return library.listMotions({
		owner_uuid: opts.bodyUuid,
		status: opts.status,
	});
}

export function listEnactedMotions(): (Motion & { body_name: string; body_abbreviation: string | null })[] {
	return db.prepare(
		`SELECT m.*, a.name AS body_name, a.abbreviation AS body_abbreviation
		 FROM motion m
		 JOIN association a ON a.uuid = m.body_uuid
		 WHERE m.status = 'enacted'
		 ORDER BY m.enacted_at DESC`
	).all() as (Motion & { body_name: string; body_abbreviation: string | null })[];
}

// --- Motion writes ---

export function createMotion(input: {
	title: string;
	body: string;
	reasoning?: string | null;
	introduced_by_uuid: string;
	body_uuid: string;
	deliberation_rule_uuid?: string | null;
	type?: string;
	seniority?: number | null;
	slug?: string;
}): Motion {
	const uuid = randomUUID();
	
	// Get next motion number for this body
	// Check both database (old) and library (new) for highest number
	const dbResult = db.prepare(
		'SELECT COALESCE(MAX(motion_number), 0) AS max_number FROM motion WHERE body_uuid = ?'
	).get(input.body_uuid) as { max_number: number };
	
	const libraryMotions = library.listMotions({ owner_uuid: input.body_uuid });
	const libraryMaxNumber = libraryMotions.reduce((max, m) => Math.max(max, m.motion_number), 0);
	
	const motionNumber = Math.max(dbResult.max_number, libraryMaxNumber) + 1;
	
	// Generate slug if not provided
	const slug = input.slug ?? `motion-${uuid.substring(0, 8)}`;
	const year = new Date().getFullYear();
	const paddedNumber = motionNumber.toString().padStart(3, '0');
	const motionNumberStr = `M-${year}-${paddedNumber}`;
	
	const motion = library.createMotion({
		slug,
		title: input.title,
		body: input.body,
		reasoning: input.reasoning ?? undefined,
		introducer_uuid: input.introduced_by_uuid,
		owner_uuid: input.body_uuid,
		motion_number: motionNumberStr,
		deliberation_rule_uuid: input.deliberation_rule_uuid ?? undefined,
	});
	
	// Set status to introduced (library creates as draft)
	return library.updateMotionStatus(slug, 'introduced', {
		introduced_at: now(),
	});
}

export function advanceMotion(uuid: string, to: MotionStatus): Motion {
	const motion = getMotionByUuid(uuid);
	if (!motion) throw new Error(`Motion not found: ${uuid}`);

	const allowed = ALLOWED_TRANSITIONS[motion.status] ?? [];
	if (!allowed.includes(to)) {
		throw new Error(`Cannot transition motion from '${motion.status}' to '${to}'`);
	}

	const resolvedAt = (to === 'withdrawn') ? now() : null;
	const introducedAt = (to === 'introduced' && !motion.introduced_at) ? now() : null;
	
	// Note: Voting now happens during meetings, not automatically when advancing to deliberation
	if (to === 'deliberation') {
		// Check if vote rule is set
		if (!motion.vote_rule_uuid) {
			throw new Error('A vote rule must be assigned before deliberation can begin');
		}
	}
	
	// Update motion status in library
	return library.updateMotionStatus(motion.slug, to, {
		introduced_at: introducedAt || undefined,
		vote_closed_at: resolvedAt || undefined,
	});
}

export function setMotionVoteRule(motionUuid: string, voteRuleUuid: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status === 'deliberation' || motion.status === 'enacted' || motion.status === 'rejected' || motion.status === 'withdrawn') {
		throw new Error(`Cannot change vote rule on a motion in status '${motion.status}'`);
	}
	return library.updateMotion(motion.slug, { vote_rule_uuid: voteRuleUuid ?? undefined });
}

export function setMotionDeliberationRule(motionUuid: string, deliberationRuleUuid: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status === 'deliberation' || motion.status === 'enacted' || motion.status === 'rejected' || motion.status === 'withdrawn') {
		throw new Error(`Cannot change deliberation rule on a motion in status '${motion.status}'`);
	}
	return library.updateMotion(motion.slug, { deliberation_rule_uuid: deliberationRuleUuid ?? undefined });
}

export function setMotionClerkNotes(motionUuid: string, clerkNotes: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	return library.updateMotion(motion.slug, { clerk_notes: clerkNotes ?? undefined });
}

export function setMotionParliamentarianNotes(motionUuid: string, parliamentarianNotes: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	return library.updateMotion(motion.slug, { parliamentarian_notes: parliamentarianNotes ?? undefined });
}

// --- Vote ---
// Voting now happens during active meetings only.
// Vote tally is created automatically on first vote cast during a meeting.

export function getVoteTally(motionUuid: string): VoteTally | null {
	return (
		(db
			.prepare('SELECT * FROM motion_vote_tally WHERE motion_uuid = ?')
			.get(motionUuid) as VoteTally | undefined) ?? null
	);
}

export function hasVoted(motionUuid: string, voterUuid: string): boolean {
	return !!db
		.prepare('SELECT 1 FROM motion_vote_receipt WHERE motion_uuid = ? AND voter_uuid = ?')
		.get(motionUuid, voterUuid);
}

/**
 * Cast a vote on a motion. Votes can ONLY be cast during an active meeting
 * where the motion is on the agenda.
 */
export function castVote(motionUuid: string, voterUuid: string, choice: VoteChoice): void {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	
	// Check if motion is on agenda of an active meeting
	const activeMeetingUuid = getActiveMeetingForMotion(motionUuid);
	if (!activeMeetingUuid) {
		throw new Error('Voting is only allowed during an active meeting where this motion is on the agenda');
	}
	
	if (hasVoted(motionUuid, voterUuid)) throw new Error('Already voted');

	// Get or create vote tally
	let tally = getVoteTally(motionUuid);
	if (!tally) {
		// Create tally on first vote
		const row = db.prepare(
			`SELECT COUNT(*) as c FROM association_member WHERE association_uuid = ? AND removed_at IS NULL`
		).get(motion.body_uuid) as { c: number };
		const eligibleCount = row.c;
		
		db.prepare(
			`INSERT INTO motion_vote_tally (motion_uuid, eligible_count, aye_count, nay_count, abstain_count, opened_at)
			 VALUES (?, ?, 0, 0, 0, ?)`
		).run(motionUuid, eligibleCount, now());
		
		tally = getVoteTally(motionUuid);
		if (!tally) throw new Error('Failed to create vote tally');
	}

	const col = choice === 'aye' ? 'aye_count' : choice === 'nay' ? 'nay_count' : 'abstain_count';

	db.transaction(() => {
		db.prepare(
			'INSERT INTO motion_vote_receipt (uuid, motion_uuid, voter_uuid, voted_at) VALUES (?, ?, ?, ?)'
		).run(randomUUID(), motionUuid, voterUuid, now());
		// col is derived from a controlled enum, not user input — safe to interpolate
		db.prepare(`UPDATE motion_vote_tally SET ${col} = ${col} + 1 WHERE motion_uuid = ?`).run(motionUuid);
	})();
}

// --- Comments ---

export function addComment(motionUuid: string, authorUuid: string, body: string): MotionComment {
	const uuid = randomUUID();
	const createdAt = now();
	db.prepare(
		`INSERT INTO motion_comment (uuid, motion_uuid, author_uuid, body, created_at)
		 VALUES (?, ?, ?, ?, ?)`
	).run(uuid, motionUuid, authorUuid, body, createdAt);
	return db.prepare('SELECT * FROM motion_comment WHERE uuid = ?').get(uuid) as MotionComment;
}

export function editComment(commentUuid: string, body: string): void {
	db.prepare(
		'UPDATE motion_comment SET body = ?, edited_at = ? WHERE uuid = ? AND deleted_at IS NULL'
	).run(body, now(), commentUuid);
}

export function deleteComment(commentUuid: string): void {
	db.prepare(
		'UPDATE motion_comment SET deleted_at = ? WHERE uuid = ? AND deleted_at IS NULL'
	).run(now(), commentUuid);
}

export function getComments(motionUuid: string): MotionComment[] {
	return db
		.prepare(
			'SELECT * FROM motion_comment WHERE motion_uuid = ? AND deleted_at IS NULL ORDER BY created_at'
		)
		.all(motionUuid) as MotionComment[];
}

// --- Motion as Document ---

