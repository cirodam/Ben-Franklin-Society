import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { getVoteRuleByUuid, evaluateTally } from './vote_rules.js';

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
	motion_number: number;
	title: string;
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
	deliberation_opened_at: string | null;
	enacted_at: string | null;
	resolved_at: string | null;
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
	return (
		(db.prepare('SELECT * FROM motion WHERE uuid = ?').get(uuid) as Motion | undefined) ?? null
	);
}

export function listMotions(opts: {
	bodyUuid?: string;
	status?: MotionStatus;
} = {}): Motion[] {
	let query = 'SELECT * FROM motion WHERE 1=1';
	const params: string[] = [];
	if (opts.bodyUuid !== undefined) {
		query += ' AND body_uuid = ?'; params.push(opts.bodyUuid);
	}
	if (opts.status) { query += ' AND status = ?'; params.push(opts.status); }
	query += ' ORDER BY created_at DESC';
	return db.prepare(query).all(...params) as Motion[];
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
}): Motion {
	const uuid = randomUUID();
	
	// Get next motion number for this body
	const result = db.prepare(
		'SELECT COALESCE(MAX(motion_number), 0) + 1 AS next_number FROM motion WHERE body_uuid = ?'
	).get(input.body_uuid) as { next_number: number };
	const motionNumber = result.next_number;
	
	db.prepare(
		`INSERT INTO motion (uuid, motion_number, title, body, reasoning, introduced_by_uuid, body_uuid, deliberation_rule_uuid, status, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'introduced', ?)`
	).run(uuid, motionNumber, input.title, input.body, input.reasoning ?? null, input.introduced_by_uuid, input.body_uuid, input.deliberation_rule_uuid ?? null, now());
	return getMotionByUuid(uuid)!;
}

export function advanceMotion(uuid: string, to: MotionStatus): Motion {
	const motion = getMotionByUuid(uuid);
	if (!motion) throw new Error(`Motion not found: ${uuid}`);

	const allowed = ALLOWED_TRANSITIONS[motion.status] ?? [];
	if (!allowed.includes(to)) {
		throw new Error(`Cannot transition motion from '${motion.status}' to '${to}'`);
	}

	// Require 15 readiness votes to advance from introduced to deliberation
	if (motion.status === 'introduced' && to === 'deliberation') {
		const readinessCount = getReadinessCount(uuid);
		if (readinessCount < 15) {
			throw new Error(`Motion requires 15 members to mark it ready before deliberation. Currently ${readinessCount}/15.`);
		}
	}

	const resolvedAt = (to === 'withdrawn') ? now() : null;
	const deliberationOpenedAt = (to === 'deliberation' && !motion.deliberation_opened_at) ? now() : null;
	
	db.transaction(() => {
		db.prepare(
			'UPDATE motion SET status = ?, resolved_at = COALESCE(?, resolved_at), deliberation_opened_at = COALESCE(?, deliberation_opened_at) WHERE uuid = ?'
		).run(to, resolvedAt, deliberationOpenedAt, uuid);

		// When advancing to deliberation, open voting immediately
		if (to === 'deliberation') {
			// Check if vote rule is set
			if (!motion.vote_rule_uuid) {
				throw new Error('A vote rule must be assigned before deliberation can begin');
			}

			// Get eligible voter count
			const row = db.prepare(
				`SELECT COUNT(*) as c FROM association_member WHERE association_uuid = ? AND removed_at IS NULL`
			).get(motion.body_uuid) as { c: number };
			const count = row.c;

			// Create vote tally
			db.prepare(
				`INSERT INTO motion_vote_tally (motion_uuid, eligible_count, aye_count, nay_count, abstain_count, opened_at)
				 VALUES (?, ?, 0, 0, 0, ?)`
			).run(uuid, count, deliberationOpenedAt);
		}
	})();
	
	return getMotionByUuid(uuid)!;
}

export function setMotionVoteRule(motionUuid: string, voteRuleUuid: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status === 'deliberation' || motion.status === 'enacted' || motion.status === 'rejected' || motion.status === 'withdrawn') {
		throw new Error(`Cannot change vote rule on a motion in status '${motion.status}'`);
	}
	db.prepare('UPDATE motion SET vote_rule_uuid = ? WHERE uuid = ?').run(voteRuleUuid, motionUuid);
	return getMotionByUuid(motionUuid)!;
}

export function setMotionDeliberationRule(motionUuid: string, deliberationRuleUuid: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status === 'deliberation' || motion.status === 'enacted' || motion.status === 'rejected' || motion.status === 'withdrawn') {
		throw new Error(`Cannot change deliberation rule on a motion in status '${motion.status}'`);
	}
	db.prepare('UPDATE motion SET deliberation_rule_uuid = ? WHERE uuid = ?').run(deliberationRuleUuid, motionUuid);
	return getMotionByUuid(motionUuid)!;
}

export function setMotionClerkNotes(motionUuid: string, clerkNotes: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	db.prepare('UPDATE motion SET clerk_notes = ? WHERE uuid = ?').run(clerkNotes || null, motionUuid);
	return getMotionByUuid(motionUuid)!;
}

export function setMotionParliamentarianNotes(motionUuid: string, parliamentarianNotes: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	db.prepare('UPDATE motion SET parliamentarian_notes = ? WHERE uuid = ?').run(parliamentarianNotes || null, motionUuid);
	return getMotionByUuid(motionUuid)!;
}

// --- Vote ---

// openVote is now called internally by advanceMotion when moving to deliberation
// This function is kept for backward compatibility but should not be called directly
export function openVote(motionUuid: string, eligibleCount?: number): VoteTally {
	throw new Error('openVote should not be called directly. Vote opens automatically when advancing to deliberation.');
}

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

export function castVote(motionUuid: string, voterUuid: string, choice: VoteChoice): void {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status !== 'deliberation') throw new Error('Motion is not in deliberation/voting phase');
	if (hasVoted(motionUuid, voterUuid)) throw new Error('Already voted');

	const tally = getVoteTally(motionUuid);
	if (!tally) throw new Error('Vote tally not found');
	if (tally.closed_at) throw new Error('Vote has already closed');

	const col = choice === 'aye' ? 'aye_count' : choice === 'nay' ? 'nay_count' : 'abstain_count';

	db.transaction(() => {
		db.prepare(
			'INSERT INTO motion_vote_receipt (uuid, motion_uuid, voter_uuid, voted_at) VALUES (?, ?, ?, ?)'
		).run(randomUUID(), motionUuid, voterUuid, now());
		// col is derived from a controlled enum, not user input — safe to interpolate
		db.prepare(`UPDATE motion_vote_tally SET ${col} = ${col} + 1 WHERE motion_uuid = ?`).run(motionUuid);
	})();
}

// Close the vote and transition to enacted or rejected.
// Returns the final status.
export function closeVote(motionUuid: string): 'enacted' | 'rejected' {
	const tally = getVoteTally(motionUuid);
	if (!tally) throw new Error('Vote tally not found');
	if (tally.closed_at) throw new Error('Vote is already closed');

	const motion = getMotionByUuid(motionUuid);
	if (!motion || motion.status !== 'deliberation') throw new Error('Motion is not in deliberation status');

	let outcome: 'enacted' | 'rejected';
	if (motion.vote_rule_uuid) {
		const rule = getVoteRuleByUuid(motion.vote_rule_uuid);
		if (!rule) throw new Error(`Vote rule not found: ${motion.vote_rule_uuid}`);
		outcome = evaluateTally(rule, tally).passed ? 'enacted' : 'rejected';
	} else {
		// Fallback: simple majority of aye vs nay
		outcome = tally.aye_count > tally.nay_count ? 'enacted' : 'rejected';
	}
	const resolvedAt = now();

	db.transaction(() => {
		db.prepare('UPDATE motion_vote_tally SET closed_at = ? WHERE motion_uuid = ?').run(resolvedAt, motionUuid);
		db.prepare(
			`UPDATE motion SET status = ?, resolved_at = ?, enacted_at = ?  WHERE uuid = ?`
		).run(
			outcome,
			resolvedAt,
			outcome === 'enacted' ? resolvedAt : null,
			motionUuid
		);
	})();

	return outcome;
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

// --- Motion Readiness ---

export function markReady(motionUuid: string, memberUuid: string): void {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status !== 'introduced') throw new Error('Motion must be in introduced status');

	// Check if already marked
	const existing = db
		.prepare('SELECT 1 FROM motion_readiness WHERE motion_uuid = ? AND member_uuid = ?')
		.get(motionUuid, memberUuid);
	
	if (existing) return; // Already marked, no-op

	db.prepare(
		'INSERT INTO motion_readiness (uuid, motion_uuid, member_uuid, marked_at) VALUES (?, ?, ?, ?)'
	).run(randomUUID(), motionUuid, memberUuid, now());
}

export function unmarkReady(motionUuid: string, memberUuid: string): void {
	db.prepare('DELETE FROM motion_readiness WHERE motion_uuid = ? AND member_uuid = ?')
		.run(motionUuid, memberUuid);
}

export function hasMarkedReady(motionUuid: string, memberUuid: string): boolean {
	return !!db
		.prepare('SELECT 1 FROM motion_readiness WHERE motion_uuid = ? AND member_uuid = ?')
		.get(motionUuid, memberUuid);
}

export function getReadinessCount(motionUuid: string): number {
	const result = db
		.prepare('SELECT COUNT(*) as count FROM motion_readiness WHERE motion_uuid = ?')
		.get(motionUuid) as { count: number };
	return result.count;
}

export function getReadinessSigners(motionUuid: string): Array<{
	uuid: string;
	given_name: string;
	family_name: string;
	handle: string;
	marked_at: string;
}> {
	return db.prepare(`
		SELECT p.uuid, p.given_name, p.family_name, p.handle, mr.marked_at
		FROM motion_readiness mr
		JOIN person p ON p.uuid = mr.member_uuid
		WHERE mr.motion_uuid = ?
		ORDER BY mr.marked_at ASC
	`).all(motionUuid) as Array<{
		uuid: string;
		given_name: string;
		family_name: string;
		handle: string;
		marked_at: string;
	}>;
}
