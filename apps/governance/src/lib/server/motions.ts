import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { getVoteRuleByUuid, evaluateTally } from './vote_rules.js';

// --- Types ---

export type MotionStatus =
	| 'draft'
	| 'introduced'
	| 'deliberation'
	| 'vote'
	| 'enacted'
	| 'rejected'
	| 'withdrawn';

export type VoteChoice = 'aye' | 'nay' | 'abstain';

export interface Motion {
	uuid: string;
	title: string;
	body: string;
	reasoning: string | null;
	introduced_by_uuid: string;
	body_uuid: string; // every motion belongs to a body; use the community association for society-wide motions
	deliberation_rule_uuid: string | null;
	vote_rule_uuid: string | null;
	status: MotionStatus;
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
	deliberation: ['withdrawn'], // deliberation → vote goes through openVote()
	vote: ['withdrawn'],        // vote → enacted/rejected goes through closeVote()
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

export function listEnactedMotions(): (Motion & { body_name: string })[] {
	return db.prepare(
		`SELECT m.*, a.name AS body_name
		 FROM motion m
		 JOIN association a ON a.uuid = m.body_uuid
		 WHERE m.status = 'enacted'
		 ORDER BY m.enacted_at DESC`
	).all() as (Motion & { body_name: string })[];
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
	db.prepare(
		`INSERT INTO motion (uuid, title, body, reasoning, introduced_by_uuid, body_uuid, deliberation_rule_uuid, status, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, 'introduced', ?)`
	).run(uuid, input.title, input.body, input.reasoning ?? null, input.introduced_by_uuid, input.body_uuid, input.deliberation_rule_uuid ?? null, now());
	return getMotionByUuid(uuid)!;
}

export function advanceMotion(uuid: string, to: MotionStatus): Motion {
	const motion = getMotionByUuid(uuid);
	if (!motion) throw new Error(`Motion not found: ${uuid}`);

	const allowed = ALLOWED_TRANSITIONS[motion.status] ?? [];
	if (!allowed.includes(to)) {
		throw new Error(`Cannot transition motion from '${motion.status}' to '${to}'`);
	}

	const resolvedAt = (to === 'withdrawn') ? now() : null;
	const deliberationOpenedAt = (to === 'deliberation' && !motion.deliberation_opened_at) ? now() : null;
	
	db.prepare(
		'UPDATE motion SET status = ?, resolved_at = COALESCE(?, resolved_at), deliberation_opened_at = COALESCE(?, deliberation_opened_at) WHERE uuid = ?'
	).run(to, resolvedAt, deliberationOpenedAt, uuid);

	return getMotionByUuid(uuid)!;
}

export function setMotionVoteRule(motionUuid: string, voteRuleUuid: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status === 'vote' || motion.status === 'enacted' || motion.status === 'rejected' || motion.status === 'withdrawn') {
		throw new Error(`Cannot change vote rule on a motion in status '${motion.status}'`);
	}
	db.prepare('UPDATE motion SET vote_rule_uuid = ? WHERE uuid = ?').run(voteRuleUuid, motionUuid);
	return getMotionByUuid(motionUuid)!;
}

export function setMotionDeliberationRule(motionUuid: string, deliberationRuleUuid: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status === 'vote' || motion.status === 'enacted' || motion.status === 'rejected' || motion.status === 'withdrawn') {
		throw new Error(`Cannot change deliberation rule on a motion in status '${motion.status}'`);
	}
	db.prepare('UPDATE motion SET deliberation_rule_uuid = ? WHERE uuid = ?').run(deliberationRuleUuid, motionUuid);
	return getMotionByUuid(motionUuid)!;
}

// --- Vote ---

export function openVote(motionUuid: string, eligibleCount?: number): VoteTally {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status !== 'deliberation') {
		throw new Error(`Motion must be in 'deliberation' to open a vote (current: ${motion.status})`);
	}
	if (!motion.vote_rule_uuid) {
		throw new Error('A vote rule must be assigned before a vote can be opened');
	}

	// eligible = current members of the body (community association = all active persons)
	let count = eligibleCount;
	if (count === undefined) {
		const row = db.prepare(
			`SELECT COUNT(*) as c FROM association_member WHERE association_uuid = ? AND removed_at IS NULL`
		).get(motion.body_uuid) as { c: number };
		count = row.c;
	}

	const openedAt = now();
	db.transaction(() => {
		db.prepare(
			`INSERT INTO motion_vote_tally (motion_uuid, eligible_count, aye_count, nay_count, abstain_count, opened_at)
			 VALUES (?, ?, 0, 0, 0, ?)`
		).run(motionUuid, count, openedAt);
		db.prepare("UPDATE motion SET status = 'vote' WHERE uuid = ?").run(motionUuid);
	})();

	return getVoteTally(motionUuid)!;
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
	if (motion.status !== 'vote') throw new Error('Vote is not open');
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
	if (!motion || motion.status !== 'vote') throw new Error('Motion is not in vote status');

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
