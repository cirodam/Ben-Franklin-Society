import { randomUUID } from 'node:crypto';
import { db } from './db.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProceduralVoteType = 'open_deliberation' | 'close_deliberation' | 'priority';
export type ProceduralVoteStatus = 'active' | 'passed' | 'failed';
export type BallotPosition = 'yea' | 'nay' | 'abstain';

export interface ProceduralVote {
	uuid: string;
	motion_uuid: string;
	called_by_uuid: string;
	vote_type: ProceduralVoteType;
	status: ProceduralVoteStatus;
	created_at: string;
	closes_at: string;
	closed_at: string | null;
}

export interface ProceduralBallot {
	uuid: string;
	procedural_vote_uuid: string;
	voter_uuid: string;
	position: BallotPosition;
	cast_at: string;
}

export interface ProceduralVoteTally {
	yea_count: number;
	nay_count: number;
	abstain_count: number;
	eligible_count: number;
}

// ---------------------------------------------------------------------------
// Create procedural vote
// ---------------------------------------------------------------------------

export function createProceduralVote(opts: {
	motion_uuid: string;
	called_by_uuid: string;
	vote_type: ProceduralVoteType;
	duration_hours?: number; // defaults to 48 hours
}): ProceduralVote {
	const uuid = randomUUID();
	const now = new Date();
	const durationMs = (opts.duration_hours ?? 48) * 60 * 60 * 1000;
	const closesAt = new Date(now.getTime() + durationMs);

	db.prepare(
		`INSERT INTO procedural_vote (uuid, motion_uuid, called_by_uuid, vote_type, status, created_at, closes_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?)`
	).run(
		uuid,
		opts.motion_uuid,
		opts.called_by_uuid,
		opts.vote_type,
		now.toISOString(),
		closesAt.toISOString()
	);

	return getProceduralVoteByUuid(uuid)!;
}

// ---------------------------------------------------------------------------
// Get procedural votes
// ---------------------------------------------------------------------------

export function getProceduralVoteByUuid(uuid: string): ProceduralVote | null {
	return (
		db.prepare('SELECT * FROM procedural_vote WHERE uuid = ?').get(uuid) as
			| ProceduralVote
			| undefined
	) ?? null;
}

export function listProceduralVotesForMotion(motion_uuid: string): ProceduralVote[] {
	return db
		.prepare('SELECT * FROM procedural_vote WHERE motion_uuid = ? ORDER BY created_at DESC')
		.all(motion_uuid) as ProceduralVote[];
}

export function getActiveProceduralVoteForMotion(
	motion_uuid: string,
	vote_type?: ProceduralVoteType
): ProceduralVote | null {
	const query = vote_type
		? 'SELECT * FROM procedural_vote WHERE motion_uuid = ? AND vote_type = ? AND status = \'active\' LIMIT 1'
		: 'SELECT * FROM procedural_vote WHERE motion_uuid = ? AND status = \'active\' LIMIT 1';

	const params = vote_type ? [motion_uuid, vote_type] : [motion_uuid];

	return (db.prepare(query).get(...params) as ProceduralVote | undefined) ?? null;
}

export function listActiveProceduralVotes(): ProceduralVote[] {
	return db
		.prepare('SELECT * FROM procedural_vote WHERE status = \'active\' ORDER BY closes_at ASC')
		.all() as ProceduralVote[];
}

// ---------------------------------------------------------------------------
// Cast ballot
// ---------------------------------------------------------------------------

export function castProceduralBallot(opts: {
	procedural_vote_uuid: string;
	voter_uuid: string;
	position: BallotPosition;
}): ProceduralBallot {
	const proceduralVote = getProceduralVoteByUuid(opts.procedural_vote_uuid);
	if (!proceduralVote) throw new Error('Procedural vote not found');
	if (proceduralVote.status !== 'active') throw new Error('Procedural vote is not active');

	const uuid = randomUUID();
	const now = new Date().toISOString();

	db.prepare(
		`INSERT INTO procedural_ballot (uuid, procedural_vote_uuid, voter_uuid, position, cast_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(procedural_vote_uuid, voter_uuid) 
     DO UPDATE SET position = excluded.position, cast_at = excluded.cast_at`
	).run(uuid, opts.procedural_vote_uuid, opts.voter_uuid, opts.position, now);

	return {
		uuid,
		procedural_vote_uuid: opts.procedural_vote_uuid,
		voter_uuid: opts.voter_uuid,
		position: opts.position,
		cast_at: now,
	};
}

// ---------------------------------------------------------------------------
// Get tally
// ---------------------------------------------------------------------------

export function getProceduralVoteTally(
	procedural_vote_uuid: string,
	eligible_count: number
): ProceduralVoteTally {
	const result = db
		.prepare(
			`SELECT 
        SUM(CASE WHEN position = 'yea' THEN 1 ELSE 0 END) as yea_count,
        SUM(CASE WHEN position = 'nay' THEN 1 ELSE 0 END) as nay_count,
        SUM(CASE WHEN position = 'abstain' THEN 1 ELSE 0 END) as abstain_count
      FROM procedural_ballot
      WHERE procedural_vote_uuid = ?`
		)
		.get(procedural_vote_uuid) as {
		yea_count: number;
		nay_count: number;
		abstain_count: number;
	};

	return {
		yea_count: result.yea_count ?? 0,
		nay_count: result.nay_count ?? 0,
		abstain_count: result.abstain_count ?? 0,
		eligible_count,
	};
}

export function hasVoted(procedural_vote_uuid: string, voter_uuid: string): boolean {
	const result = db
		.prepare(
			'SELECT 1 FROM procedural_ballot WHERE procedural_vote_uuid = ? AND voter_uuid = ?'
		)
		.get(procedural_vote_uuid, voter_uuid);
	return !!result;
}

// ---------------------------------------------------------------------------
// Close procedural vote
// ---------------------------------------------------------------------------

export function closeProceduralVote(
	procedural_vote_uuid: string,
	eligible_count: number
): ProceduralVote {
	const proceduralVote = getProceduralVoteByUuid(procedural_vote_uuid);
	if (!proceduralVote) throw new Error('Procedural vote not found');
	if (proceduralVote.status !== 'active') throw new Error('Procedural vote is not active');

	const tally = getProceduralVoteTally(procedural_vote_uuid, eligible_count);

	// Simple majority to pass
	const passed = tally.yea_count > tally.nay_count;
	const status: ProceduralVoteStatus = passed ? 'passed' : 'failed';

	db.prepare(
		'UPDATE procedural_vote SET status = ?, closed_at = ? WHERE uuid = ?'
	).run(status, new Date().toISOString(), procedural_vote_uuid);

	return getProceduralVoteByUuid(procedural_vote_uuid)!;
}
